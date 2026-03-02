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
  constructor(private bar: Bar) {}
}

@module()
class TestModule extends Module {
  @create()
  createBar() : Bar {
     return new Bar()
  }
  
  @onRunning()
  async start() : Promise<void> {
    console.log("run, forrest...")
  }
}

// start container

const environment = new Environment({module: TestModule});
await environment.start();

const foo = environment.get(Foo)
```

Ok, kind of looks familiar, but of course there is much more:
- different - pluggable - scopes
- factory functions
- post processors
- lifecycle methods
- pluggable parameter decorators used for injections
- hierarchical environments

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

# API

- http://ernstandreas.de/novx/