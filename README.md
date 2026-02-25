# NOVX

![CI](https://github.com/coolsamson7/novx/actions/workflows/ci.yml/badge.svg)

## Overview

NOVX is a monorepo covering a number of Typescript and React solutions in individual packages

- [Core DI Solution]([https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects](https://github.com/coolsamson7/novx/tree/main/libs/core)) a typescript dependency injection and aspect solution 

### Core

The core covers several aspects
- a combined di and aop solution
- tracing functions
- configuration values handling
- basic language features and functions
- error handling logic

Let's look at a simple di example first.

```ts
import { Environment, Module, injectable, onRunning} from '@novx/core';

@injectable()
class Bar {}

@injectable()
class Foo {
  constructor(private bar: Bar) {}
}

@module()
class TestModule extends Module {
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
- hierarchical environments

And the biggest advantage in contrast to all other solutions, it has an integarted aop mechanism.

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



### Portal

### Communication

### I18N

## API Docs

- http://ernstandreas.de/novx/