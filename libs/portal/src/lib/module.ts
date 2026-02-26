import { FeatureMetadata } from './feature-registry';
import { Environment, inject, injectable, ModuleOptions, onRunning, Providers, TraceLevel, Tracer, TypeDescriptor } from '@novx/core';
import { DeploymentManager } from './deployment-manager';
import { Module as DIModule } from '@novx/core';

const MODULE_META = Symbol("module:meta");

/**
 * Remote module configuration
 */
export interface RemoteConfig {
  url: string;
  scope: string;
  module: string;
}

/**
 * Base metadata interface
 */
export interface Metadata {
  id: string;
  label?: string;
  icon?: string;
  description?: string;
  sourceFile?: string;
}

/**
 * Module metadata with features and permissions
 */
export interface ModuleMetadata extends Metadata {
  remote?: RemoteConfig;
  version: string;
  features?: FeatureMetadata[];
  permissions?: string[];
  moduleName?: string;
}

/**
 * Module decorator for marking and configuring module metadata
 *
 * Usage:
 * @Module({
 *   id: "product-module",
 *   label: "Product Management",
 *   version: "1.0.0",
 *   remote: {
 *     url: "http://localhost:3001/remoteEntry.js",
 *     scope: "productModule",
 *     module: "./Module",
 *   },
 * })
 * export class ProductModule {}
 */
export function Module(config: Omit<ModuleMetadata & ModuleOptions, 'sourceFile'>) {
  return function decorator(target: any) { 
    const metadata: ModuleMetadata = {
      ...config,
      sourceFile: target.name,
    };

    config.type = target

    if (!config.imports)
        config.imports = []

     if (config.name === undefined)
        config.name = config.id;

    Reflect.defineMetadata(MODULE_META, metadata, target);

    TypeDescriptor.forType(target).addDecorator(injectable, true, "singleton");
    TypeDescriptor.forType(target).addDecorator(Module);
    
    Providers.registerClass(config.name, target, true, "singleton");

    DIModule.register(target, config)
    
    // Queue for setup processing

    AbstractModule.enqueue(target);

    return target;
  };
}

export abstract class AbstractModule extends DIModule {
  // static

  static getMetadata(target: Function): ModuleMetadata {
    return Reflect.getMetadata(MODULE_META, target);
  }

  static queue: Array<{
    moduleClass: any,
    status: 'pending' | 'loading' | 'loaded' | 'failed'
  }> = [];

  static enqueue(moduleClass: any) { 
    if ( Tracer.ENABLED)
      Tracer.Trace('portal', TraceLevel.FULL, "enqueue module {0}", moduleClass.name);

    this.queue.push({ moduleClass, status: 'pending' });
  }

  static reset() {
    this.queue = [];
  }

  // instance data

  protected environment!: Environment;

  // protected

  protected getModuleName(): string {
    return this.getMetadata().id;
  }

  protected getMetadata(): ModuleMetadata {
    return AbstractModule.getMetadata(this.constructor);
  }

  protected get<T>(type: new(...args: any[]) => T) : T {
    return this.environment.get<T>(type);
  }

  // lifecycle

  @inject()
  injectEnvironment(environment: Environment) {
    this.environment = environment;
  }

  @onRunning()
  async setup(): Promise<void> {
    this.get(DeploymentManager).loaded(this.getMetadata().id)
  }
}