/**
 * The Environment class is the central component of the dependency injection system.
 * It manages instances and their lifecycles.
 */
import { DecoratorDescriptor, MethodDescriptor } from '../reflection';
/**
 * Scope interface representing how instance lifecycle is managed
 */
export interface Scope {
    get<T>(provider: AbstractInstanceProvider<T>, environment: Environment, argProvider: () => any[]): T;
}
/**
 * Abstract provider interface responsible for creating instances
 */
export declare abstract class AbstractInstanceProvider<T = any> {
    /**
     * Return the class which is responsible for creation (e.g. the injectable class)
     */
    getHost(): any;
    getModule(): string;
    /**
     * Return the type of the created instance
     */
    abstract getType(): {
        new (...args: any[]): T;
    } | {
        prototype: any;
    };
    /**
     * Return true if the provider will eagerly construct instances
     */
    abstract isEager(): boolean;
    /**
     * Return the scope name
     */
    abstract getScope(): string;
    /**
     * Return the types that this provider depends on (for constructor or setter injection)
     * The second element is the number of parameters that a construction injection will require
     */
    getDependencies(): [any[], number];
    /**
     * Create a new instance
     * @param environment The Environment
     * @param args The required arguments
     */
    abstract create(environment: Environment, ...args: any[]): T;
    /**
     * Return a string representation of this provider
     */
    report(): string;
    /**
     * Check for additional factories
     */
    checkFactories(): void;
}
export declare class Providers {
    static check: AbstractInstanceProvider<any>[];
    static providers: Map<any, AbstractInstanceProvider<any>[]>;
    static resolved: boolean;
    static registerClass(module: string, clazz: new (...args: any[]) => any, eager?: boolean, scope?: string): void;
    static register(provider: AbstractInstanceProvider<any>): void;
    static isRegistered(type: any): boolean;
    static checkFactories(): void;
    static filter(environment: Environment, providerFilter: (provider: AbstractInstanceProvider<any>) => boolean): Map<any, AbstractInstanceProvider<any>>;
}
/**
 * Base exception for all DI-related errors
 */
export declare class DIException extends Error {
    constructor(message: string);
}
/**
 * Exception raised during the registration of dependencies
 */
export declare class DIRegistrationException extends DIException {
    constructor(message: string);
}
/**
 * Exception raised when there are multiple providers for the same type
 */
export declare class ProviderCollisionException extends DIRegistrationException {
    providers: AbstractInstanceProvider<any>[];
    constructor(message: string, ...providers: AbstractInstanceProvider<any>[]);
    toString(): string;
}
/**
 * Exception raised during the runtime
 */
export declare class DIRuntimeException extends DIException {
    constructor(message: string);
}
/**
 * Registry for scope implementations
 */
export declare class Scopes {
    private static scopes;
    /**
     * Get a scope instance from the environment
     */
    static get(scopeName: string, environment: Environment): Scope;
    /**
     * Register a scope type with a name
     */
    static register(scopeType: any, name: string): void;
}
/**
 * Lifecycle phases that can be processed by lifecycle processors
 */
export declare enum Lifecycle {
    ON_INJECT = 0,
    ON_INIT = 1,
    ON_RUNNING = 2,
    ON_DESTROY = 3
}
/**
 * Base class for lifecycle processors
 */
export declare abstract class LifecycleProcessor {
    order: number;
    constructor();
    /**
     * Process a lifecycle event
     */
    abstract processLifecycle(lifecycle: Lifecycle, instance: any, environment: Environment): any;
    /**
     * Process a lifecycle event asynchronously
     * Default implementation calls the sync version
     */
    processLifecycleAsync(lifecycle: Lifecycle, instance: any, environment: Environment): Promise<any>;
}
/**
 * Base class for custom post processors executed after object creation
 */
export declare abstract class PostProcessor extends LifecycleProcessor {
    abstract process(instance: any, environment: Environment): void;
    processLifecycle(lifecycle: Lifecycle, instance: any, environment: Environment): any;
}
/**
 * Lifecycle callable handler class
 */
export declare class LifecycleCallable {
    decorator: any;
    lifecycle: Lifecycle;
    order: number;
    constructor(decorator: any, lifecycle: Lifecycle);
    args(decorator: DecoratorDescriptor, method: MethodDescriptor, environment: Environment, instance?: any): any[];
}
/**
 * Represents a method call during a lifecycle phase
 */
export declare class MethodCall {
    method: MethodDescriptor;
    decorator: DecoratorDescriptor;
    lifecycleCallable: LifecycleCallable;
    constructor(method: MethodDescriptor, decorator: DecoratorDescriptor, lifecycleCallable: LifecycleCallable);
    execute(instance: any, environment: Environment): any;
    executeAsync(instance: any, environment: Environment): Promise<any>;
    toString(): string;
}
/**
 * Processor for method calls during lifecycle phases
 */
export declare class AbstractCallableProcessor extends LifecycleProcessor {
    private lifecycle;
    private static callables;
    private static cache;
    static register(callable: LifecycleCallable): void;
    static computeCallables(type: any): Array<MethodCall[]>;
    static callablesFor(type: any): Array<MethodCall[]>;
    constructor(lifecycle: Lifecycle);
    processLifecycle(lifecycle: Lifecycle, instance: any, environment: Environment): any;
    processLifecycleAsync(lifecycle: Lifecycle, instance: any, environment: Environment): Promise<any>;
}
/**
 * Set the order priority for lifecycle processors
 */
export declare function order(prio?: number): ClassDecorator;
/**
 * Mark a class as injectable
 */
export interface InjectableOptions {
    eager?: boolean;
    scope?: string;
    module?: string;
    location?: string;
}
export declare function injectable(options?: InjectableOptions): ClassDecorator;
/**
 * Mark a method as a factory method
 */
export interface CreateOptions {
    eager?: boolean;
    scope?: string;
}
export declare function create(options?: CreateOptions): MethodDecorator;
/**
 * Methods annotated with @on_init will be called when the instance is created
 */
export declare function onInit(): MethodDecorator;
/**
 * Methods annotated with @on_running will be called when the container is up and running
 */
export declare function onRunning(): MethodDecorator;
/**
 * Methods annotated with @on_destroy will be called when the instance is destroyed
 */
export declare function onDestroy(): MethodDecorator;
/**
 * This annotation is used to mark classes that control the discovery process of injectables
 */
export interface ModuleOptions {
    name?: string;
    imports?: any[];
    register?: boolean;
    type?: any;
    accepts?: Set<string>;
}
export declare class Module {
    static resolved: boolean;
    static byType: Map<any, ModuleOptions>;
    static byName: Map<string, ModuleOptions>;
    static register(target: any, options: ModuleOptions): void;
    static resolve(): void;
    getName(): string;
    getImports(): any[];
}
export declare function module(options?: ModuleOptions): ClassDecorator;
/**
 * Methods annotated with @inject will be called with the required dependencies injected
 */
export declare function inject(): MethodDecorator;
/**
 * Define a scope
 */
export declare function scope(name: string, register?: boolean): ClassDecorator;
/**
 * Base class for resolving annotated parameter values
 */
export declare abstract class AnnotationResolver<T = any> {
    annotationType: any;
    private static resolvers;
    static register(resolver: AnnotationResolver): void;
    static getResolver(annotationType: any): AnnotationResolver | undefined;
    constructor(annotationType: any);
    /**
     * Return types this resolver depends on
     */
    dependencies(): any[];
    /**
     * Resolve the actual value to inject
     * @param annotationValue The annotation instance
     * @param paramType The actual parameter type
     * @param environment The DI environment
     * @param deps Resolved dependencies from dependencies()
     */
    abstract resolve(annotationValue: any, paramType: any, environment: Environment, ...deps: any[]): T;
}
/**
 * Provider that resolves a parameter value based on annotation metadata
 */
export declare class AnnotationInstanceProvider<T> extends AbstractInstanceProvider<T> {
    private resolver;
    private annotationValue;
    private paramType;
    private dependencies;
    constructor(resolver: AnnotationResolver<T>, annotationValue: any, paramType: any);
    getType(): any;
    getHost(): any;
    isEager(): boolean;
    getScope(): string;
    getDependencies(): [any[], number];
    resolve(context: any): void;
    create(environment: Environment, ...args: any[]): T;
    report(): string;
    toString(): string;
    checkFactories(): void;
}
export declare class InstanceProvider<T> extends AbstractInstanceProvider<T> {
    protected module: string;
    protected host: any;
    protected type: any;
    protected eager: boolean;
    protected scopeName: string;
    protected paramProviders: Array<[AnnotationInstanceProvider<any> | 'environment' | null, any]>;
    protected paramProvidersInitialized: boolean;
    constructor(module: string, host: any, type: any, eager: boolean, scopeName: string);
    getModule(): string;
    getHost(): any;
    getType(): any;
    isEager(): boolean;
    getScope(): string;
    checkFactories(): void;
    getDependencies(): [any[], number];
    create(environment: Environment, ...args: any[]): T;
    protected processAnnotatedParams(annotatedParams: any[]): void;
    protected buildDependenciesFromParams(): any[];
    protected resolveParamValues(environment: Environment, args: any[], startIndex?: number): any[];
}
/**
 * A ClassInstanceProvider creates instances of type T by calling the class constructor
 */
export declare class ClassInstanceProvider<T> extends InstanceProvider<T> {
    private params;
    constructor(module: string, type: new (...args: any[]) => T, eager: boolean, scope?: string);
    private initParamProviders;
    getDependencies(): [any[], number];
    create(environment: Environment, ...args: any[]): T;
    report(): string;
    toString(): string;
    checkFactories(): void;
}
declare class MethodInjectionProvider extends InstanceProvider<any> {
    private hostClass;
    private methodName;
    private params;
    constructor(hostClass: any, methodName: string);
    private initParamProviders;
    getDependencies(): [any[], number];
    create(environment: Environment, ...args: any[]): any;
}
/**
 * A FunctionInstanceProvider creates instances by calling methods annotated with @create
 */
export declare class FunctionInstanceProvider<T> extends InstanceProvider<T> {
    private method;
    private methodName;
    private returnType;
    constructor(module: string, clazz: any, method: any, methodName: string, returnType: any, eager?: boolean, scope?: string);
    private initParamProviders;
    getDependencies(): [any[], number];
    create(environment: Environment, ...args: any[]): T;
    report(): string;
    toString(): string;
}
/**
 * AmbiguousProvider covers cases where fetching a class would lead to an ambiguity exception
 */
export declare class AmbiguousProvider<T> extends AbstractInstanceProvider<T> {
    private typeClass;
    private providers;
    constructor(typeClass: any, ...providers: AbstractInstanceProvider<T>[]);
    addProvider(provider: AbstractInstanceProvider<T>): void;
    getType(): any;
    isEager(): boolean;
    getScope(): string;
    getDependencies(): [any[], number];
    create(environment: Environment, ...args: any[]): T;
    report(): string;
    toString(): string;
    checkFactories(): void;
}
/**
 * EnvironmentInstanceProvider wraps a provider within an environment
 */
export declare class EnvironmentInstanceProvider<T> extends AbstractInstanceProvider<T> {
    environment: Environment;
    private scopeInstance;
    private provider;
    private dependencies;
    constructor(environment: Environment, provider: AbstractInstanceProvider<T>);
    resolve(context: ResolveContext): void;
    getType(): any;
    isEager(): boolean;
    getScope(): string;
    getDependencies(): [any[], number];
    report(): string;
    create(environment: Environment, ...args: any[]): T;
    printTree(lines: string[], prefix?: string): void;
    toString(): string;
    checkFactories(): void;
}
/**
 * Context class for resolving providers and detecting cycles
 */
declare class ResolveContext {
    private providers;
    private path;
    constructor(providers: Map<any, AbstractInstanceProvider<any>>);
    push(provider: AbstractInstanceProvider<any>): void;
    pop(): void;
    requireProvider(type: any): AbstractInstanceProvider<any>;
    private cycleReport;
}
/**
 * Environment class for managing DI container
 */
interface EnvironmentOptions {
    module?: any;
    features?: string[];
    parent?: Environment;
}
export declare class Environment {
    static instance: Environment | null;
    private type;
    private providers;
    private lifecycleProcessors;
    private instances;
    private features;
    parent: Environment | null;
    /**
     * Creates a new Environment instance
     *
     * @param env The environment class that controls scanning of managed objects
     * @param features Optional list of feature flags
     * @param parent Optional parent environment, whose objects are inherited
     */
    constructor(options?: EnvironmentOptions);
    private collectProvider;
    /**
     * Check if a feature is enabled
     */
    hasFeature(feature: string): boolean;
    /**
     * Check if a type is registered
     */
    isRegisteredType(type: any): boolean;
    /**
     * Get all registered types matching a predicate
     */
    registeredTypes(predicate: (type: any) => boolean): any[];
    /**
     * Execute lifecycle processors on an instance
     */
    executeProcessors<T>(lifecycle: Lifecycle, instance: T): T;
    /**
     * Execute lifecycle processors asynchronously
     */
    executeProcessorsAsync<T>(lifecycle: Lifecycle, instance: T): Promise<T>;
    /**
     * Process a newly created instance
     */
    created<T>(instance: T): T;
    /**
     * Generate a report of the environment state
     */
    report(): string;
    /**
     * Start the environment by executing ON_RUNNING lifecycle phase
     */
    start(): Promise<void>;
    /**
     * Stop the environment by executing ON_DESTROY lifecycle phase
     */
    stop(): Promise<void>;
    supports(type: new (...args: any[]) => any): boolean;
    /**
     * Get an instance of the specified type
     */
    get<T>(type: new (...args: any[]) => T): T;
    /**
     * Get providers (for internal use)
     */
    getProviders(): Map<any, AbstractInstanceProvider<any>>;
    /**
     * Get a scope by name
     */
    getScope(scopeName: string): Scope;
    toString(): string;
}
/**
 * Bootstrap environment class
 */
export declare class Boot extends Module {
    private static environment;
    static getEnvironment(): Environment;
}
/**
 * Request scope - creates a new instance for each request
 */
export declare class RequestScope implements Scope {
    get<T>(provider: AbstractInstanceProvider<T>, environment: Environment, argProvider: () => any[]): T;
}
/**
 * Singleton scope - caches instances for reuse
 */
export declare class SingletonScope implements Scope {
    private value;
    get<T>(provider: AbstractInstanceProvider<T>, environment: Environment, argProvider: () => any[]): T;
}
/**
 * Environment scope - caches instances for the lifetime of the environment
 */
export declare class EnvironmentScope extends SingletonScope {
}
export declare class OnInjectCallableProcessor extends AbstractCallableProcessor {
    constructor();
}
export declare class OnInitCallableProcessor extends AbstractCallableProcessor {
    constructor();
}
export declare class OnRunningCallableProcessor extends AbstractCallableProcessor {
    constructor();
}
export declare class OnDestroyCallableProcessor extends AbstractCallableProcessor {
    constructor();
}
/**
 * Base for lifecycle callables that inject method parameters.
 * Shared by @inject, @onInit, @onRunning, @onDestroy.
 */
declare class InjectingLifecycleCallable extends LifecycleCallable {
    private static providerCache;
    protected getProvider(instance: any, method: MethodDescriptor): MethodInjectionProvider;
    args(decorator: DecoratorDescriptor, method: MethodDescriptor, environment: Environment, instance?: any): any[];
}
export declare class InjectLifecycleCallable extends InjectingLifecycleCallable {
    constructor();
}
export declare class OnInitLifecycleCallable extends InjectingLifecycleCallable {
    constructor();
}
export declare class OnDestroyLifecycleCallable extends InjectingLifecycleCallable {
    constructor();
}
export declare class OnRunningLifecycleCallable extends InjectingLifecycleCallable {
    constructor();
}
export {};
//# sourceMappingURL=di.d.ts.map