import 'reflect-metadata';

import {
  AbstractModule,
  DeploymentManager,
  ServiceDeploymentLoader,
  RemoteDeploymentLoader,
  Module,
  Manifest,
  ManifestProcessor,
  FeatureRegistry,
  RouterManager,
  DeploymentLoader,
  EmptyDeploymentLoader,
  LocalComponentLoader,
  PortalService, RemoteComponentLoader, I18NLoader,
  KeycloakAuthenticationService,
  SessionManager,
} from '@novx/portal';

import { AssetTranslationLoader, LocaleManager, LocalStorageLocaleBackingStore, Translator, TranslatorBuilder } from '@novx/i18n';


import {
  TraceLevel,
  Tracer,
  ConsoleTrace,
  ConfigurationManager,
  ValueConfigurationSource,
  catchError,
  Environment,
  create,
  onRunning,
  injectable,
  TypeDescriptor,
} from '@novx/core';

import {
  EndpointLocator,
  PatternEndpointLocator,
  Serialization,
} from '@novx/communication';

import manifest from './manifest.json';

// tracing

new Tracer({
  enabled: true,
  trace: new ConsoleTrace('%d [%p]: %m %f\n'), // %f
  paths: {
    application: TraceLevel.FULL,
    di: TraceLevel.OFF,
    portal: TraceLevel.OFF,
    form: TraceLevel.OFF,
  },
});

// serialization

new Serialization();

// application module

@Module({
  id: 'shell',
  label: 'Shell',
  version: '1.0.0',
  description: 'Shell',
  name: '',
})
@injectable({module: "shell"})
export class ApplicationModule extends AbstractModule {
  @create()
  createSessionManager() : SessionManager<any,any> {
    return new SessionManager(new KeycloakAuthenticationService());
  }

  @create()
  createLocaleManager() : LocaleManager {
    return new LocaleManager({
      locale: "de-DE",
      supportedLocales: ["de-DE", "en-US"],
      backingStore: new LocalStorageLocaleBackingStore("language"),
    })
  }

  @create()
  createTranslator(localeManager: LocaleManager) : Translator {
    return new TranslatorBuilder()
      .loader(new AssetTranslationLoader({ path: '/i18n/' }))
      .localeManager(localeManager)
      .build()
  }

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

  @create()
  createDeploymentLoader(portalService: PortalService) : DeploymentLoader {
    let load = 'nix';

    if (load == 'service')
      return new ServiceDeploymentLoader(portalService);

    else if (load == 'remote')
      return new RemoteDeploymentLoader([
        { name: 'mfe1', url: 'http://localhost:3001' },
      ]);

      else return new EmptyDeploymentLoader()
  }

  @create()
  createDeploymentManager(loader: DeploymentLoader, featureRegistry: FeatureRegistry) : DeploymentManager {
      return new DeploymentManager(
        featureRegistry,
        loader,
        manifest as unknown as Manifest,
        new ManifestProcessor(),

        (permission: string) => {
          console.log('check permission ' + permission);
          return true;
        },

        (feature: string) => {
          console.log('check feature ' + feature);
          return true;
        },
      );
  }

  @create()
  createEndpointLocator() : EndpointLocator {
      return new PatternEndpointLocator({
          match: '.*',
          url: 'http://localhost:8000/',
        })
  }

    // lifecycle

    @onRunning()
    async onRunning(featureRegistry: FeatureRegistry, deploymentManager: DeploymentManager, sessionManager: SessionManager<any,any>, routerManager: RouterManager) {
      // load deployment

      await deploymentManager.loadDeployment({
          application: "portal",
          client: deploymentManager.clientInfo(),
      });

      // set root

      routerManager.setRoot(featureRegistry.finder()
        .withTag('portal')
        .withVisibility(sessionManager.hasSession())
        .findOne()
        );
    }

  // error handlers

  @catchError()
  public handleError(error: any) {
    console.log(error)
  }

  // lifecycle methods

  async setup() : Promise<void>  {
    // setup tracer

    Tracer.Trace('application', TraceLevel.LOW, 'setup');

    /* sprites

    this.get(SvgSpriteRegistry).registerAll("shell", import.meta.webpackContext(
        './icons',
         {
          recursive: false,
          regExp: /\.svg$/
        }
       ));*/

    // session manager

    await this.get(SessionManager).init();

    // done

    await super.setup();
  }
}

// import loaders

const loaders = [RemoteComponentLoader, LocalComponentLoader, I18NLoader]

// create environment

export const createEnvironment = async () : Promise<Environment> => {
    const environment = new Environment({module: ApplicationModule})

    console.log(environment.report())

    await environment.start()

    return environment
}