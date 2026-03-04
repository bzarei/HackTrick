# Core

## Introduction

The `core` library covers several aspects
- a combined di and aop solution
- tracing functions
- configuration values handling
- basic language features and functions
- error handling logic

Let's look at a simple di example first.

```ts
import { Environment, Module, injectable, onRunning} from '@novx/core';

class Bar {}

@injectable()
class Foo {
  constructor(private bar: Bar, @config("foo.bar") public value: string)) {} // will inject a configuration value
}

@injectable({scope: "request", eager: false}) // default is "singleton" and eager
class Baz {
  constructor() {}
}

@module()
class TestModule extends Module {
  @create()
  createConfigurationManager() : ConfigurationManager {
    return new ConfigurationManager(
      new ValueConfigurationSource({
        foo: {
          bar: 'bar',
        },
      }),
    );
  }

  @create() // same arguments possble as @create
  createBar() : Bar {
     return new Bar()
  }
  
  @onRunning()
  async start() : Promise<void> {
    console.log("run, forrest...")
  }

  @onDestroy()
  async stop() : Promise<void> {
    console.log("rip...")
  }
}

@module({name: "import"})
class ImportModule extends Module {}

@injectable({scope: "import"})
class Import {}

@module({name: "child", imports: [ImportModule]}) // load transitived closure...
class ChildModule extends Module {}

@injectable({scope: "child"})
class Child {}

// start container

const environment = new Environment({module: TestModule});
await environment.start();

// child container will inherit all parent providers and the additional providers from Child- and ImportModule

const childEnvironment = new Environment({module: ChildModule, parent: environment});
await childEnvironment.start();

// get some instances

const foo = environment.get(Foo)

const child = childEnvironment.get(Import)
```

Ok, many thngs looks familiar, here are the overall capabilities:
- different - pluggable - scopes
- factory functions (`@create`)
- post processors
- lifecycle methods (`@onInject`, `@onInit`, `@onRunning`, `@onDestroy`)
- pluggable parameter decorators used for injections ( as an example  `@value`)
- hierarchical environments, no static state anywhere

And the biggest advantage in contrast to all other solutions, it has an integrated aop mechanism.

```ts
@injectable()
class Aspects {}
    @around(methods().of(Service).thatAreAsync())
    async aroundMethod(invocation: Invocation): Promise<any> {
        ...
        try {
            return await invocation.proceed()
        } 
        finally {
            ...
        }
    }

    @after(methods().named("foo"))
    afterMethod(invocation: Invocation) {
        ...
    }

    @error(methods().of(Service))
    error(invocation: Invocation) {
        ...
    }
}
```

which totally makes sense, since aspects typically also require injected objects, so its a perfect fit.

Comparing it with the biggest competitors, claude created this matrix:

**Dependency Injection**

| Feature | This Framework | InversifyJS | TSyringe | TypeDI | NestJS DI | Awilix |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Decorator-based registration | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Constructor injection | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Method / setter injection | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Factory method (`@create`) | ✅ | ⚠️ manual | ❌ | ⚠️ manual | ✅ | ✅ |
| Singleton scope | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Request / transient scope | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Environment scope** | ✅ | ❌ | ❌ | ❌ | ⚠️ custom | ❌ |
| **Custom scopes** | ✅ `@scope` | ✅ | ❌ | ❌ | ⚠️ partial | ✅ |
| **Parent / child environments** | ✅ | ⚠️ containers | ❌ | ❌ | ✅ modules | ❌ |
| **Module system** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Multi-module isolation** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Cycle detection at startup | ✅ | ⚠️ partial | ❌ | ❌ | ✅ | ⚠️ |
| Eager instantiation | ✅ | ⚠️ manual | ❌ | ❌ | ✅ | ❌ |
| **ON_INJECT lifecycle** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **ON_INIT lifecycle** | ✅ | ❌ | ❌ | ❌ | ✅ `OnModuleInit` | ❌ |
| **ON_RUNNING lifecycle** | ✅ | ❌ | ❌ | ❌ | ✅ `OnApplicationBootstrap` | ❌ |
| **ON_DESTROY lifecycle** | ✅ | ❌ | ❌ | ❌ | ✅ `OnModuleDestroy` | ❌ |
| Async lifecycle | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Custom annotation resolvers | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `reflect-metadata` free | ❌* | ❌ | ❌ | ❌ | ❌ | ✅ |
| Zero dependencies | ✅ (core) | ❌ | ❌ | ❌ | ❌ | ⚠️ |

*Uses own TypeDescriptor registry; `reflect-metadata` is used only for annotation params in AOP.

**Aspect-Oriented Programming**

| Feature | This Framework | InversifyJS | TSyringe | TypeDI | NestJS DI | AspectJS |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Before advice | ✅ | ❌ | ❌ | ❌ | ⚠️ interceptors | ✅ |
| After advice | ✅ | ❌ | ❌ | ❌ | ⚠️ interceptors | ✅ |
| Around advice | ✅ | ❌ | ❌ | ❌ | ✅ interceptors | ✅ |
| Error advice | ✅ | ❌ | ❌ | ❌ | ⚠️ exception filters | ✅ |
| **Async-aware around** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Fluent pointcut DSL** | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ |
| Method name matching | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Regex matching | ✅ `.matching("...")` | ❌ | ❌ | ❌ | ❌ | ⚠️ |
| Async-only targeting | ✅ `.thatAreAsync()` | ❌ | ❌ | ❌ | ❌ | ❌ |
| Class-scoped pointcut | ✅ `.of(Class)` | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Aspects are DI singletons** | ✅ | ❌ | ❌ | ❌ | ✅ (providers) | ❌ |
| **Injected aspect state** | ✅ `this.message` etc. | ❌ | ❌ | ❌ | ✅ | ❌ |
| `Invocation` object | ✅ | ❌ | ❌ | ❌ | ✅ `ExecutionContext` | ✅ |

# Documentation

Detailed documentation can be found in the corresponding [wiki](https://github.com/coolsamson7/novx/wiki/Core).

# API

- http://ernstandreas.de/novx/
