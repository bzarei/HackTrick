import { injectable, TypeDescriptor, Invocation, around, methods  } from "@novx/core"

import { ObservableValue, transaction } from "../reactive"

export class CommandDescriptor {
  // instance data

  private _enabled = new ObservableValue(true)

  // constructor

  constructor(
    public readonly name: string,          // method name
    public readonly method: Function,
    public readonly displayName?: string,  // optional UI name
    public readonly shortcut?: string      // optional keyboard shortcut
  ) {}

  // public

  get enabled() { return this._enabled.get() }
  set enabled(v: boolean) { this._enabled.set(v) }
}

// @command decorator

export interface CommandOptions {
  name?: string
  shortcut?: string
}

export function command(options?: CommandOptions) {
  return function (
    target: any,
    propertyKey: string | symbol,
    _descriptor: PropertyDescriptor
  ) {
    TypeDescriptor
      .forType(target.constructor)
      .addMethodDecorator(target, propertyKey.toString(), command, options)
  }
}

// Controller

export abstract class Controller {
  // instance data

  private _commands = new Map<string, CommandDescriptor>()

   // constructor

  constructor() {
    const descriptor = TypeDescriptor.forType(this.constructor as any)

    for (const method of descriptor.getMethods((m) => m.hasDecorator(command))) {
      const decorator = method.getDecorator(command)!

      const options = decorator.arguments as CommandOptions | undefined

      this._commands.set(
        method.name,
        new CommandDescriptor(
          method.name,
          method.method,
          options?.name,
          options?.shortcut
        )
      )
    }
  }

  execute(name: string, ...args: any[]): any {
    const cmd = this._command(name)
    if (!cmd.enabled) 
      return

    let result: any
    transaction(() => { result = (this as any)[name](...args) })
    return result
  }

  enable(name: string, state = true)             { this._command(name).enabled = state }
  disable(name: string)            { this._command(name).enabled = false }
  isEnabled(name: string): boolean { return this._command(name).enabled }
  commands(): string[]             { return [...this._commands.keys()] }

  // private

  private _command(name: string): CommandDescriptor {
    const cmd = this._commands.get(name)
    if (!cmd) 
      throw new Error(`Unknown command "${name}"`)

    return cmd
  }
}

// aspects

@injectable({module: "boot"})
export class CommandAspects {
  @around(methods().decoratedWith(command as any).thatAreSync())
  around(invocation: Invocation): any {
    const ctrl = invocation.target as Controller
    const name = invocation.method().name


    ctrl.disable(name)
    try {
      return invocation.proceed()
    }
    finally {
      ctrl.enable(name)
    }
  }

  @around(methods().decoratedWith(command as any).thatAreAsync())
  async aroundAsync(invocation: Invocation): Promise<any> {
    const ctrl = invocation.target as Controller
    const name = invocation.method().name

    ctrl.disable(name)
    try {
      return await invocation.proceed()
    }
    finally {
      ctrl.enable(name)
    }
  }
}
