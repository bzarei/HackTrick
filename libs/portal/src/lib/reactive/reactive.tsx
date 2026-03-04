/* eslint-disable @typescript-eslint/no-this-alias */
// reactive.ts

import { Environment, injectable, PostProcessor, TypeDescriptor, Invocation, around, methods  } from "@novx/core"
import { useEnvironment } from "../environment"
import React from "react"

// ─── Core reactive primitives ─────────────────────────────────────────────────

type ReactionFn = () => void

let currentReaction: Reaction | null = null

class ObservableValue<T = any> {
  private observers = new Set<Reaction>()

  constructor(private value: T) {}

  get(): T {
    if (currentReaction) {
      this.observers.add(currentReaction)
      currentReaction.dependencies.add(this)
    }
    return this.value
  }

  set(newValue: T) {
    if (this.value === newValue) return
    this.value = newValue
    this.observers.forEach(r => r.schedule())
  }

  removeObserver(r: Reaction) {
    this.observers.delete(r)
  }
}

class Reaction {
  dependencies = new Set<ObservableValue>()
  private scheduled = false

  constructor(private fn: ReactionFn, autoRun = true) {
    if (autoRun) this.run()
  }

  run() {
    this.cleanup()
    currentReaction = this
    try {
      this.fn()
    } finally {
      currentReaction = null
    }
  }

  schedule() {
    if (batchDepth > 0) {
      pendingReactions.add(this)
      return
    }

    if (!this.scheduled) {
      this.scheduled = true
      queueMicrotask(() => {
        this.scheduled = false
        this.run()
      })
    }
  }

  cleanup() {
    this.dependencies.forEach(dep => dep.removeObserver(this))
    this.dependencies.clear()
  }
}

export function autorun(fn: ReactionFn) {
  return new Reaction(fn)
}

// ─── Transaction ──────────────────────────────────────────────────────────────

let batchDepth = 0
const pendingReactions = new Set<Reaction>()

export function transaction(fn: () => void): void {
  batchDepth++
  try {
    fn()
  } finally {
    batchDepth--
    if (batchDepth === 0) {
      const snapshot = [...pendingReactions]
      pendingReactions.clear()
      for (const r of snapshot) r.run()
    }
  }
}

// ─── Decorators ───────────────────────────────────────────────────────────────

export function observable(target: any, propertyKey: string | symbol) {
  TypeDescriptor.forType(target.constructor)
    .addPropertyDecorator(target, propertyKey.toString(), observable)
}

export function computed(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
  TypeDescriptor.forType(target.constructor)
    .addMethodDecorator(target, propertyKey.toString(), computed)
  return descriptor
}

export function action(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
  TypeDescriptor.forType(target.constructor)
    .addMethodDecorator(target, propertyKey.toString(), action)
  return descriptor
}

export function reactive(target: any) {
  TypeDescriptor.forType(target).addDecorator(reactive)
  return target
}

// ─── PostProcessor ────────────────────────────────────────────────────────────

@injectable({ module: "boot" })
export class ReactivePostProcessor extends PostProcessor {

  process(instance: any) {
    const descriptor = TypeDescriptor.forType(instance.constructor)

    if (descriptor.hasDecorator(reactive)) {
      this.makeObservables(instance, descriptor)
      this.makeComputed(instance, descriptor)
    }
  }

  private makeObservables(instance: any, descriptor: TypeDescriptor<any>) {
    for (const field of descriptor.getFields()) {
      if (!field.hasDecorator(observable)) continue

      const observableValue = new ObservableValue(instance[field.name])

      Object.defineProperty(instance, field.name, {
        get() { return observableValue.get() },
        set(v) { observableValue.set(v) },
        enumerable: true,
        configurable: true,
      })
    }
  }

  private makeComputed(instance: any, descriptor: TypeDescriptor<any>) {
    for (const method of descriptor.getMethods()) {
      if (!method.hasDecorator(computed)) continue

      let cached: any
      const reaction = new Reaction(() => {
        cached = (instance as any)[method.name]()
      })

      Object.defineProperty(instance, method.name, {
        get() { return cached },
        enumerable: true,
        configurable: true,
      })
    }
  }
}

// ─── React integration ────────────────────────────────────────────────────────

export function useLocalEnvironment(module?: any) {
  const parent = useEnvironment()

  const env = React.useMemo(
    () => new Environment({ module, parent }),
    [parent, module]
  )

  React.useEffect(() => {
    void env.start()
    return () => { void env.stop() }
  }, [env])

  return env
}

/**
 * Call once at the top of any component that reads observables.
 * The component will automatically re-render when its reactive
 * dependencies change — no HOC or wrapper needed.
 *
 * @example
 * const CounterView = () => {
 *   useObserver()
 *   const counter = useLocalEnvironment().get(Counter)
 *   return <p>{counter.count}</p>
 * }
 */
export function useObserver() {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)

  const reactionRef = React.useRef<Reaction | null>(null)
  if (!reactionRef.current) {
    reactionRef.current = new Reaction(() => forceUpdate(), false)
  }

  const reaction = reactionRef.current
  reaction.cleanup()
  const prev = currentReaction
  currentReaction = reaction

  // Clear tracking after all synchronous observable reads in this render
  queueMicrotask(() => { currentReaction = prev })

  React.useEffect(() => () => reactionRef.current?.cleanup(), [])
}

// ─── CommandDescriptor ────────────────────────────────────────────────────────

export class CommandDescriptor {
  private _enabled = new ObservableValue(true)

  constructor(
    public readonly name: string,
    public readonly method: Function,
  ) {}

  get enabled() { return this._enabled.get() }
  set enabled(v: boolean) { this._enabled.set(v) }
}

// ─── @command decorator ───────────────────────────────────────────────────────

export function command(
  target: any,
  propertyKey: string | symbol,
  _descriptor: PropertyDescriptor
) {
  TypeDescriptor
    .forType(target.constructor)
    .addMethodDecorator(target, propertyKey.toString(), command)
}

// ─── Controller ───────────────────────────────────────────────────────────────

export abstract class Controller {
  private _commands = new Map<string, CommandDescriptor>()

  constructor() {
    const descriptor = TypeDescriptor.forType(this.constructor as any)

    for (const method of descriptor.getMethods()) {
      if (method.hasDecorator(command)) {
        this._commands.set(
          method.name,
          new CommandDescriptor(method.name, method.method)
        )
      }
    }
  }

  execute(name: string, ...args: any[]): any {
    const cmd = this._require(name)
    if (!cmd.enabled) return

    let result: any
    transaction(() => { result = (this as any)[name](...args) })
    return result
  }

  enable(name: string)             { this._require(name).enabled = true }
  disable(name: string)            { this._require(name).enabled = false }
  isEnabled(name: string): boolean { return this._require(name).enabled }
  commands(): string[]             { return [...this._commands.keys()] }

  private _require(name: string): CommandDescriptor {
    const cmd = this._commands.get(name)
    if (!cmd) throw new Error(`Unknown command "${name}"`)
    return cmd
  }
}

// ─── DisableCommandAspect ─────────────────────────────────────────────────────

@injectable({module: "boot"})
export class ControllerAspects {

  @around(methods().decoratedWith(command).thatAreSync())
  around(invocation: Invocation): any {
    const ctrl = invocation.target as Controller
    const name = invocation.method().name

    console.log("> " + name)

    ctrl.disable(name)
    try {
      return invocation.proceed()
    } 
    finally {
      console.log("< " + name)

      ctrl.enable(name)
    }
  }

  @around(methods().decoratedWith(command).thatAreAsync())
  async aroundAsync(invocation: Invocation): Promise<any> {
    const ctrl = invocation.target as Controller
    const name = invocation.method().name

    console.log("> " + name)

    ctrl.disable(name)
    try {
      return await invocation.proceed()
    } 
    finally {
      console.log("< " + name)

      ctrl.enable(name)
    }
  }
}
