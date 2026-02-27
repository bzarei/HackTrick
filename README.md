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

Comparing it with the biggest competitors, claude created this matrix: 

### Dependency Injection

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

### Aspect-Oriented Programming

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

### Portal

Portal implements a react portal framework supporting microfrontends vastly simplifying implementation efforts since a number of technical challenges every application has to solve are already part of the framework.
- integration of a DI solution
- centralized error handling ( including error boundaries ) 
- session handling
- i18n integration
- meta-data based approach that allows for 
  - filtering of available features according to authentication, authorization or other aspects ( e.g. feature flags )
  - automatic router configuration according to the metadata
  - dynamic navigation features that are based on the meta-data and custom rules
  - feature outlets that cover both local and federated components and allow for custom async preloading logic ( e.g. i18n loading )
- custom application configurations with support for both client and server side logic

While the framework supports enterprise portals with dynamic microfrontends - and server side configuration mechanisms - as one extreme it also covers small local only applications without significant coding and rampup overhead, making it a one-size-fits-all framework.

The main idea for most of the mechanisms is that modules expose meta-data of "what is inside", by annotating available "features" ( named components used internally or part of the routing ) with special decorators that can be parsed and extracted.

```ts
@Feature({
  id: 'private-navigation',
  label: 'Navigation',
  visibility: ["private"],
  features: ["feature-a"],
  permissions: []
  tags: ['portal'],
  path: '/'
})
export class Navigation extends React.Component {
    ...
}
```

A parser - as part of the build - will locate those features and generate a manifest.json.

```json
{
  "id": "shell",
  "label": "Shell",
  "version": "1.0.0",
  "features": [
     {
      "id": "public-navigation",
      "label": "Navigation",
      "path": "",
      "visibility": [
        "public"
      ],
      "tags": [
        "portal"
      ],
      "features": [
        "feature-a"
      ],
      "permissions": [
      ],
      "component": "PublicNavigationFeature",
      "sourceFile": "apps/shell/src/PublicNavigation.tsx",
      "children": []
    },
    ...
  ],
  "moduleName": "ApplicationModule",
  "sourceFile": "apps/shell/src/main.tsx",
  "description": "Shell"
}
```

which can either be used locally or registered via a server component.

Let's see how to boot an application. First thing we need to do is to setup the di container and add a couple of instances
inside of the main "module"
```ts
@Module({
  id: 'shell',
  label: 'Shell',
  version: '1.0.0',
  description: 'Shell',
  name: '',
})
export class ApplicationModule extends AbstractModule {
  @create()
  createSessionManager() : SessionManager<any,any> {
    return new SessionManager(new DummyAuthenticationService()); // for now, would be OIDC in reality
  }

  @create()
  createDeploymentLoader(portalService: PortalService) : DeploymentLoader {
    return new EmptyDeploymentLoader() // only local, so far 
  }

  @create()
  createDeploymentManager(loader: DeploymentLoader, featureRegistry: FeatureRegistry) : DeploymentManager {
      return new DeploymentManager(
        featureRegistry,
        loader,
        manifest as Manifest // that's the local genaretd manifest.json
      );
  }

  // lifecycle

  @onRunning()
  async onRunning(featureRegistry: FeatureRegistry, deploymentManager: DeploymentManager, sessionManager: SessionManager<any,any>, routerManager: RouterManager) {
      // load deployment

      await deploymentManager.loadDeployment({
          application: "portal",
          client: deploymentManager.clientInfo(),
      });

      // the root if the router will be a feature with tag "portal" and the correct visibility

      routerManager.setRoot(featureRegistry.finder()
        .withTag('portal')
        .withVisibility(sessionManager.hasSession())
        .findOne());
        
      await this.get(SessionManager).init();
    }
}

// create environment

export const createEnvironment = async () : Promise<Environment> => {
    const environment = new Environment({module: ApplicationModule})

    await environment.start()

    return environment
}
```

The crucial parts are
- the `DeploymentManager` which is responsible to compute a merged `manifest.json`. Since we are still completely local,
  it will only return the local `manifest.json`
- A `FeatureRegistry` collects all features and will be filled with the gathered information of the deployment manager.  Since it knows about all registered components - local or remote - 
 a `<FeatureOutlet>` component is now available that renders any registered feature by name, which is the basis for a number of mechanisms.
- The `RoutingManager` will compute dynamic routes based on the provided features and a handpicked "root" feature
  The routing logic will simply pick all features that have a defined "path" and add them as children - inserting a feature outlet - to the desired
  root feature, which in this case has a defined tag "portal" and has a visibility property that matches the current session state.

Launching the application is now just a couple lines of code.

```ts
const environment = await createEnvironment();

const root = createRoot(document.getElementById('root')!);
root.render(
    <EnvironmentContext.Provider value={environment}>
      <App />
    </EnvironmentContext.Provider>
    );
```

while the application

```ts
export class App extends React.Component {
    routerManager!: RouterManager;

    static contextType = EnvironmentContext

    declare context: Environment

    async componentDidMount() { 
        this.routerManager = this.context.get(RouterManager);
    }

    override render() {
        return (
            this.routerManager.renderRouter()
        );
    }
}
```

simply delegates to rendering to the defined routes. So what is the root?
Well, a specific feature which acts as the main page typically offering navigation possibilities ( as a side bar ).

The interesting part, is that since we already have the complete meta-data available, we dont need to hardcode the navigation entries anymore,
but can rely on a couple of conventions to list the available routes.

Example: 

```ts
const features = featureRegistry
    .finder()
    .withPath()
    .withoutParent()
    .withVisibility(sessionManager.hasSession())
    .withTag('menu')
    .find();
```

In this case all features, that have the corresponding visibility status matching the session state and have a tag "menu", will be listed 
as corresponding `<Link>`s.

Isn't that awsome? 

Ok, but we promised microfrontends as well, were are they?

Federated modules will take a similar approach, by defining a root module, exposing a `manifest.json`, etc.
The main application will only need to change the corresponding deployment loader to integrate it.
```ts
  return new RemoteDeploymentLoader([
        { name: 'microfrontend', url: 'http://localhost:3001' },
      ]);
```
In this case, the manifest is fetched dynamically from the known url and merged with the local manifest.

This is good enough for a local environment used for development purposes, in production the logic would be handed over to a 
server component that is aware of different microfrontends and configurations also including more sophisticated logic to filter
features according to feature flags, etc.

### Communication

### I18N

## API Docs

- http://ernstandreas.de/novx/