/* eslint-disable @typescript-eslint/no-this-alias */
// reactive.ts

import { Environment, injectable, PostProcessor, TypeDescriptor } from "@novx/core"
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

    if ()
    this.makeObservables(instance, descriptor)
    this.makeComputed(instance, descriptor)
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