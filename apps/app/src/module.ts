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
  SessionManager,
  Authentication,
  SvgSpriteRegistry,
  OIDCUser,
  Session,
  AuthenticationRequest,
} from '@novx/portal';

import { applicationConfig } from "./environments/environments"

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
  Trace,
  TraceEntry,
  TraceFormatter,
  injectable,
  config, module, Module as DIModule
} from '@novx/core';

import {
  EndpointLocator,
  PatternEndpointLocator,
  Serialization,
} from '@novx/communication';

import manifest from './manifest.json';

export class FooterTrace extends Trace {
  static entries : TraceEntry[] = []
  
  // constructor

  constructor(messageFormat: string) {
    super(new TraceFormatter(messageFormat));
  }

  // implement Trace

  /**
   * @inheritDoc
   */
  trace(entry: TraceEntry): void {
    FooterTrace.entries.push(entry)
  }
}


/**
 * No-op authentication service that returns a dummy user.
 */
export class NoAuthenticationService implements Authentication<OIDCUser, any> {
   async authenticate(request: AuthenticationRequest): Promise<Session<OIDCUser, any>> {
    return {
      user: {
        id: 'dummy-user',
        username: 'dummy',
        email: 'dummy@example.com',
        roles: ['user'],
        given_name: '',
        family_name: '',
        email_verified: '',
        name: '',
        preferred_username: '',
        sub: ''
      },
      ticket: {}
    }
   }
  
   async init(): Promise<Session<OIDCUser, any> | null> {
    return null;
   }
    
   async logout(): Promise<void> {
    // noope
   }
}

// tracing

new Tracer({
  enabled: true,
  trace: new FooterTrace('%d [%p]: %m %f\n'), // %f
  paths: {
    application: TraceLevel.FULL,
    di: TraceLevel.FULL,
    portal: TraceLevel.FULL,
  },
});

// serialization

new Serialization();

// application module

@module({name: "config"})
class ApplicationConfigModule extends DIModule {
  @create()
  createConfigurationManager() : ConfigurationManager {
      return new ConfigurationManager(
          new ValueConfigurationSource(applicationConfig),
      );
  }
}

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
    return new SessionManager(new NoAuthenticationService() /*KeycloakAuthenticationService()*/);
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
  createDeploymentLoader(portalService: PortalService, @config("deployment", "local") deployment : string) : DeploymentLoader {
    console.log(deployment)
     console.log(applicationConfig)
    if (deployment == 'service')
      return new ServiceDeploymentLoader(portalService);

    else if (deployment == 'microfrontend')
      return new RemoteDeploymentLoader(applicationConfig.deployments[deployment].remotes);

      else return new EmptyDeploymentLoader()
  }

  @create()
  createDeploymentManager(loader: DeploymentLoader, featureRegistry: FeatureRegistry) : DeploymentManager {
      return new DeploymentManager({
        featureRegistry: featureRegistry,
        loader: loader,
        localManifest: manifest as Manifest,
        processor: new ManifestProcessor()
      });
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

      routerManager.setRoot(() => (featureRegistry.finder()
        .withTag('portal')
        .withVisibility(sessionManager.hasSession())
        .findOne()
        ))
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

    // sprites

    this.get(SvgSpriteRegistry).registerAll("shell", import.meta.webpackContext(
        './icons',
         {
          recursive: false,
          regExp: /\.svg$/
        }
       ));

    // session manager

    await this.get(SessionManager).start();

    // done

    await super.setup();
  }
}

// import loaders

const loaders = [RemoteComponentLoader, LocalComponentLoader, I18NLoader]

// create environment

export const createEnvironment = async () : Promise<Environment> => {
    const configEnvironment = new Environment({module: ApplicationConfigModule})
    await configEnvironment.start();

    const environment = new Environment({module: ApplicationModule, parent: configEnvironment})

    console.log(environment.report())

    await environment.start()

    return environment
}