/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * The Environment class is the central component of the dependency injection system.
 * It manages instances and their lifecycles.
 */
var Boot_1;
import { __decorate, __metadata } from "tslib";
import { TypeDescriptor } from '../reflection';
import { TraceLevel, Tracer } from '../tracer';
/**
 * Abstract provider interface responsible for creating instances
 */
export class AbstractInstanceProvider {
    /**
     * Return the class which is responsible for creation (e.g. the injectable class)
     */
    getHost() {
        return this.constructor;
    }
    getModule() {
        return "";
    }
    /**
     * Return the types that this provider depends on (for constructor or setter injection)
     * The second element is the number of parameters that a construction injection will require
     */
    getDependencies() {
        return [[], 1];
    }
    /**
     * Return a string representation of this provider
     */
    report() {
        return this.toString();
    }
    /**
     * Check for additional factories
     */
    checkFactories() {
        // noop
    }
}
// Static registry of providers
export class Providers {
    static check = [];
    static providers = new Map();
    static resolved = false;
    static registerClass(module, clazz, eager = true, scope = "singleton") {
        Providers.register(new ClassInstanceProvider(module, clazz, eager, scope));
    }
    static register(provider) {
        const type = provider.getType();
        Providers.check.push(provider);
        const candidates = Providers.providers.get(type);
        if (!candidates) {
            Providers.providers.set(type, [provider]);
        }
        else {
            candidates.push(provider);
        }
    }
    static isRegistered(type) {
        return Providers.providers.has(type);
    }
    static checkFactories() {
        for (const check of Providers.check) {
            check.checkFactories();
        }
        Providers.check = [];
    }
    static filter(environment, providerFilter) {
        const cache = new Map();
        Providers.checkFactories(); // Check for additional factories
        // Local helper functions
        function filterType(clazz) {
            let result = null;
            for (const provider of Providers.providers.get(clazz) || []) {
                if (providerApplies(provider)) {
                    if (result !== null) {
                        throw new ProviderCollisionException(`Type ${clazz.name || 'unknown'} already registered`, result, provider);
                    }
                    result = provider;
                }
            }
            return result;
        }
        function providerApplies(provider) {
            // Is it in the right module?
            if (!providerFilter(provider)) {
                return false;
            }
            return true;
        }
        function isInjectable(type) {
            if (!type || type === Object) {
                return false;
            }
            return true;
        }
        function cacheProviderForType(provider, type) {
            const existingProvider = cache.get(type);
            if (!existingProvider) {
                cache.set(type, provider);
            }
            else {
                if (type === provider.getType()) {
                    throw new ProviderCollisionException(`Type ${type.name || 'unknown'} already registered`, existingProvider, provider);
                }
                if (existingProvider.getType() !== type) {
                    // Only overwrite if the existing provider is not specific
                    if (existingProvider instanceof AmbiguousProvider) {
                        existingProvider.addProvider(provider);
                    }
                    else {
                        cache.set(type, new AmbiguousProvider(type, existingProvider, provider));
                    }
                }
            }
            // recursion for base classes
            if (type.prototype) {
                const proto = Object.getPrototypeOf(type.prototype);
                if (proto && proto.constructor && isInjectable(proto.constructor)) {
                    cacheProviderForType(provider, proto.constructor);
                }
            }
        }
        // filter conditional providers and fill base classes as well
        for (const [providerType] of Providers.providers) {
            const matchingProvider = filterType(providerType);
            // NEW! NO!!!!
            //if (environment.parent?.isRegisteredType(providerType))
            //    continue;
            if (matchingProvider) {
                cacheProviderForType(matchingProvider, providerType);
            }
        }
        // replace by EnvironmentInstanceProvider
        const mapped = new Map();
        const result = new Map();
        for (const [providerType, provider] of cache.entries()) {
            let environmentProvider = mapped.get(provider);
            if (!environmentProvider) {
                environmentProvider = new EnvironmentInstanceProvider(environment, provider);
                mapped.set(provider, environmentProvider);
            }
            result.set(providerType, environmentProvider);
        }
        // And resolve
        let providers = result;
        if (environment.parent) {
            // Combine with parent providers
            providers = new Map([...environment.parent.getProviders(), ...providers]);
        }
        const providerContext = new ResolveContext(providers);
        for (const provider of mapped.values()) {
            provider.resolve(providerContext);
        }
        return result;
    }
}
/**
 * Base exception for all DI-related errors
 */
export class DIException extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain (important when targeting ES5)
        this.name = this.constructor.name;
    }
}
/**
 * Exception raised during the registration of dependencies
 */
export class DIRegistrationException extends DIException {
    constructor(message) {
        super(message);
    }
}
/**
 * Exception raised when there are multiple providers for the same type
 */
export class ProviderCollisionException extends DIRegistrationException {
    providers;
    constructor(message, ...providers) {
        super(message);
        this.providers = providers;
    }
    toString() {
        return `[${this.message} ${this.providers[1]} collides with ${this.providers[0]}]`;
    }
}
/**
 * Exception raised during the runtime
 */
export class DIRuntimeException extends DIException {
    constructor(message) {
        super(message);
    }
}
// scopes
/**
 * Registry for scope implementations
 */
export class Scopes {
    static scopes = {};
    /**
     * Get a scope instance from the environment
     */
    static get(scopeName, environment) {
        const scopeType = Scopes.scopes[scopeName];
        if (!scopeType) {
            throw new Error(`Unknown scope type ${scopeName}`);
        }
        return environment.get(scopeType);
    }
    /**
     * Register a scope type with a name
     */
    static register(scopeType, name) {
        Scopes.scopes[name] = scopeType;
    }
}
/**
 * Lifecycle phases that can be processed by lifecycle processors
 */
export var Lifecycle;
(function (Lifecycle) {
    Lifecycle[Lifecycle["ON_INJECT"] = 0] = "ON_INJECT";
    Lifecycle[Lifecycle["ON_INIT"] = 1] = "ON_INIT";
    Lifecycle[Lifecycle["ON_RUNNING"] = 2] = "ON_RUNNING";
    Lifecycle[Lifecycle["ON_DESTROY"] = 3] = "ON_DESTROY";
})(Lifecycle || (Lifecycle = {}));
/**
 * Base class for lifecycle processors
 */
export class LifecycleProcessor {
    order = 0;
    constructor() {
        if (TypeDescriptor.forType(this.constructor).hasDecorator(order)) {
            this.order = TypeDescriptor.forType(this.constructor).getDecorator(order)?.arguments[0] || 0;
        }
    }
    /**
     * Process a lifecycle event asynchronously
     * Default implementation calls the sync version
     */
    async processLifecycleAsync(lifecycle, instance, environment) {
        return this.processLifecycle(lifecycle, instance, environment);
    }
}
/**
 * Base class for custom post processors executed after object creation
 */
export class PostProcessor extends LifecycleProcessor {
    processLifecycle(lifecycle, instance, environment) {
        if (lifecycle === Lifecycle.ON_INIT) {
            this.process(instance, environment);
        }
        return instance;
    }
}
/**
 * Lifecycle callable handler class
 */
export class LifecycleCallable {
    decorator;
    lifecycle;
    order = 0;
    constructor(decorator, lifecycle) {
        this.decorator = decorator;
        this.lifecycle = lifecycle;
        if (TypeDescriptor.forType(this.constructor).hasDecorator(order)) {
            this.order = TypeDescriptor.forType(this.constructor).getDecorator(order)?.arguments[0] || 0;
        }
        AbstractCallableProcessor.register(this);
    }
    args(decorator, method, environment, instance) {
        return [];
    }
}
/**
 * Represents a method call during a lifecycle phase
 */
export class MethodCall {
    method;
    decorator;
    lifecycleCallable;
    constructor(method, decorator, lifecycleCallable) {
        this.method = method;
        this.decorator = decorator;
        this.lifecycleCallable = lifecycleCallable;
    }
    execute(instance, environment) {
        const args = this.lifecycleCallable.args(this.decorator, this.method, environment, instance);
        return instance[this.method.name](...args);
        //return this.method.method.apply(instance, args);
    }
    async executeAsync(instance, environment) {
        const args = this.lifecycleCallable.args(this.decorator, this.method, environment, instance);
        return await instance[this.method.name](...args); //this.method.method.apply(instance, args);
    }
    // override
    toString() {
        return `MethodCall(${this.method.name})`;
    }
}
/**
 * Processor for method calls during lifecycle phases
 */
export class AbstractCallableProcessor extends LifecycleProcessor {
    lifecycle;
    // Static registry of callables
    static callables = new Map();
    static cache = new Map();
    static register(callable) {
        AbstractCallableProcessor.callables.set(callable.decorator, callable);
    }
    static computeCallables(type) {
        const result = [[], [], [], []]; // per lifecycle
        const descriptor = TypeDescriptor.forType(type);
        for (const method of descriptor.getMethods()) {
            for (const decorator of method.decorators) {
                const callable = AbstractCallableProcessor.callables.get(decorator.decorator);
                if (callable) // any callable for this decorator?
                    result[callable.lifecycle].push(new MethodCall(method, decorator, callable));
            }
        }
        // Sort according to order
        for (let i = 0; i < 4; i++) {
            result[i].sort((a, b) => a.lifecycleCallable.order - b.lifecycleCallable.order);
        }
        return result;
    }
    static callablesFor(type) {
        let callables = AbstractCallableProcessor.cache.get(type);
        if (!callables) {
            callables = AbstractCallableProcessor.computeCallables(type);
            AbstractCallableProcessor.cache.set(type, callables);
        }
        return callables;
    }
    constructor(lifecycle) {
        super();
        this.lifecycle = lifecycle;
    }
    processLifecycle(lifecycle, instance, environment) {
        if (lifecycle === this.lifecycle) {
            const callables = AbstractCallableProcessor.callablesFor(instance.constructor);
            for (const callable of callables[lifecycle]) {
                callable.execute(instance, environment);
            }
        }
        return instance;
    }
    async processLifecycleAsync(lifecycle, instance, environment) {
        if (lifecycle === this.lifecycle) {
            const callables = AbstractCallableProcessor.callablesFor(instance.constructor);
            for (const callable of callables[lifecycle]) {
                await callable.executeAsync(instance, environment);
            }
        }
        return instance;
    }
}
// decorators
/**
 * Set the order priority for lifecycle processors
 */
export function order(prio = 0) {
    return (target) => {
        TypeDescriptor.forType(target).addDecorator(order, prio);
        return target;
    };
}
export function injectable(options = {}) {
    return (target) => {
        const { eager = true, scope = "singleton", module = "" } = options;
        TypeDescriptor.forType(target).addDecorator(injectable, eager, scope);
        Providers.registerClass(module, target, eager, scope);
        return target;
    };
}
export function create(options = {}) {
    return (target, propertyKey, descriptor) => {
        const { eager = true, scope = "singleton" } = options;
        const typeDescriptor = TypeDescriptor.forType(target.constructor);
        typeDescriptor.addMethodDecorator(target, propertyKey.toString(), create, eager, scope);
        return descriptor;
    };
}
/**
 * Methods annotated with @on_init will be called when the instance is created
 */
export function onInit() {
    return (target, propertyKey, descriptor) => {
        const typeDescriptor = TypeDescriptor.forType(target.constructor);
        typeDescriptor.addMethodDecorator(target, propertyKey.toString(), onInit);
        return descriptor;
    };
}
/**
 * Methods annotated with @on_running will be called when the container is up and running
 */
export function onRunning() {
    return (target, propertyKey, descriptor) => {
        const typeDescriptor = TypeDescriptor.forType(target.constructor);
        typeDescriptor.addMethodDecorator(target, propertyKey.toString(), onRunning);
        return descriptor;
    };
}
/**
 * Methods annotated with @on_destroy will be called when the instance is destroyed
 */
export function onDestroy() {
    return (target, propertyKey, descriptor) => {
        const typeDescriptor = TypeDescriptor.forType(target.constructor);
        typeDescriptor.addMethodDecorator(target, propertyKey.toString(), onDestroy);
        return descriptor;
    };
}
export class Module {
    static resolved = false;
    static byType = new Map();
    static byName = new Map();
    static register(target, options) {
        Module.byType.set(target, options);
        if (options.name)
            Module.byName.set(options.name, options);
        Module.resolved = false;
    }
    static resolve() {
        if (!Module.resolved) {
            Module.resolved = true;
            const cache = new Map();
            // local function
            const collect = (type, visiting) => {
                if (cache.has(type))
                    return cache.get(type);
                if (visiting.has(type))
                    return new Set(); // break cycle
                const options = Module.byType.get(type);
                visiting.add(type);
                const result = new Set();
                result.add(options.name);
                for (const importedType of options.imports) {
                    for (const name of collect(importedType, visiting))
                        result.add(name);
                }
                visiting.delete(type);
                // cache
                cache.set(type, result);
                return result;
            };
            // go
            for (const [type, options] of Module.byType.entries())
                options.accepts = collect(type, new Set());
        } // if
    }
    // protected
    getName() {
        return Module.byType.get(this.constructor).name;
    }
    getImports() {
        return Module.byType.get(this.constructor).imports || [];
    }
}
export function module(options = {}) {
    return (target) => {
        options.type = target;
        if (!options.imports)
            options.imports = [];
        if (!options.name)
            options.name = "";
        Module.register(target, options);
        TypeDescriptor.forType(target).addDecorator(module, options);
        if (options.register !== false) {
            Providers.registerClass(options.name, target, true);
            TypeDescriptor.forType(target).addDecorator(injectable);
        }
        return target;
    };
}
/**
 * Methods annotated with @inject will be called with the required dependencies injected
 */
export function inject() {
    return (target, propertyKey, descriptor) => {
        const typeDescriptor = TypeDescriptor.forType(target.constructor);
        typeDescriptor.addMethodDecorator(target, propertyKey.toString(), inject);
        return descriptor;
    };
}
/**
 * Define a scope
 */
export function scope(name, register = true) {
    return (target) => {
        TypeDescriptor.forType(target).addDecorator(scope);
        Scopes.register(target, name);
        if (register) {
            Providers.registerClass("boot", target, true, "request");
        }
        return target;
    };
}
// annotation
/**
 * Base class for resolving annotated parameter values
 */
export class AnnotationResolver {
    annotationType;
    // static datat
    static resolvers = new Map();
    // static functions
    static register(resolver) {
        AnnotationResolver.resolvers.set(resolver.annotationType, resolver);
    }
    static getResolver(annotationType) {
        return AnnotationResolver.resolvers.get(annotationType);
    }
    // constructor
    constructor(annotationType) {
        this.annotationType = annotationType;
        AnnotationResolver.register(this);
    }
    /**
     * Return types this resolver depends on
     */
    dependencies() {
        return [];
    }
}
/**
 * Provider that resolves a parameter value based on annotation metadata
 */
export class AnnotationInstanceProvider extends AbstractInstanceProvider {
    resolver;
    annotationValue;
    paramType;
    dependencies = [];
    constructor(resolver, annotationValue, paramType) {
        super();
        this.resolver = resolver;
        this.annotationValue = annotationValue;
        this.paramType = paramType;
    }
    getType() {
        return this.paramType;
    }
    getHost() {
        return this.resolver.constructor;
    }
    isEager() {
        return false; // Resolved on-demand
    }
    getScope() {
        return "request"; // Always resolve fresh
    }
    getDependencies() {
        const deps = this.resolver.dependencies();
        return [deps, deps.length];
    }
    resolve(context) {
        /**
         * Resolve dependencies for this annotation provider
         */
        this.dependencies = [];
        for (const depType of this.resolver.dependencies()) {
            this.dependencies.push(depType);
        }
    }
    create(environment, ...args) {
        // args are the resolver's dependencies
        return this.resolver.resolve(this.annotationValue, this.paramType, environment, ...args);
    }
    report() {
        return `Annotation(${this.annotationValue} -> ${this.paramType?.name || 'unknown'})`;
    }
    toString() {
        return `AnnotationInstanceProvider(${this.annotationValue} -> ${this.paramType?.name || 'unknown'})`;
    }
    checkFactories() {
        // No-op
    }
}
export class InstanceProvider extends AbstractInstanceProvider {
    module;
    host;
    type;
    eager;
    scopeName;
    paramProviders = [];
    paramProvidersInitialized = false;
    constructor(module, host, type, eager, scopeName) {
        super();
        this.module = module;
        this.host = host;
        this.type = type;
        this.eager = eager;
        this.scopeName = scopeName;
    }
    getModule() {
        return this.module;
    }
    getHost() {
        return this.host;
    }
    getType() {
        return this.type;
    }
    isEager() {
        return this.eager;
    }
    getScope() {
        return this.scopeName;
    }
    checkFactories() {
        // No-op base implementation
    }
    getDependencies() {
        return [[], 1];
    }
    create(environment, ...args) {
        throw new Error('Method not implemented in base class.');
    }
    processAnnotatedParams(annotatedParams) {
        for (const param of annotatedParams) {
            let provider = null;
            // Check for Environment type - special case for automatic injection
            if (param.type === Environment) {
                provider = ['environment', Environment];
                this.paramProviders.push(provider);
                continue;
            }
            // Check for annotation metadata
            if (param.metadata && param.metadata.length) {
                for (const meta of param.metadata) {
                    const resolver = AnnotationResolver.getResolver(meta.constructor);
                    if (resolver) {
                        const annotationProvider = new AnnotationInstanceProvider(resolver, meta, param.type);
                        provider = [annotationProvider, param.type];
                        break;
                    }
                }
            }
            if (provider === null) {
                // Normal DI: store tuple (null, param_type)
                provider = [null, param.type];
            }
            this.paramProviders.push(provider);
        }
    }
    buildDependenciesFromParams() {
        const types = [];
        for (const entry of this.paramProviders) {
            if (entry) {
                const [provider, paramType] = entry;
                if (provider === 'environment') {
                    // Environment type: no dependency needed, will inject current environment
                    continue;
                }
                else if (provider) {
                    // Annotation-based: add resolver's dependencies
                    types.push(...provider.getDependencies()[0]);
                }
                else {
                    // Normal DI: add parameter type directly
                    types.push(paramType);
                }
            }
        }
        return types;
    }
    resolveParamValues(environment, args, startIndex = 0) {
        const finalArgs = [];
        let depIndex = startIndex;
        for (const [provider, _paramType] of this.paramProviders) {
            if (provider === 'environment') {
                // Environment type: inject current environment
                finalArgs.push(environment);
            }
            else if (provider !== null) {
                // Annotation-based: call provider to resolve the value
                const dependencies = provider.getDependencies()[0];
                const depCount = dependencies.length;
                const depArgs = args.slice(depIndex, depIndex + depCount);
                const value = provider.create(environment, ...depArgs);
                depIndex += depCount;
                finalArgs.push(value);
            }
            else {
                // Normal DI: use the dependency directly
                finalArgs.push(args[depIndex]);
                depIndex++;
            }
        }
        return finalArgs;
    }
}
class EnvironmentScopeInstanceProvider extends InstanceProvider {
    constructor() {
        super("boot", EnvironmentScopeInstanceProvider, EnvironmentScope, false, "request");
    }
    create(_environment, ..._args) {
        return new EnvironmentScope();
    }
}
class SingletonScopeInstanceProvider extends InstanceProvider {
    constructor() {
        super("boot", SingletonScopeInstanceProvider, SingletonScope, false, "request");
    }
    create(environment, ...args) {
        return new SingletonScope();
    }
}
class RequestScopeInstanceProvider extends InstanceProvider {
    constructor() {
        super("boot", RequestScopeInstanceProvider, RequestScope, false, "singleton");
    }
    create(environment, ...args) {
        return new RequestScope();
    }
}
/**
 * A ClassInstanceProvider creates instances of type T by calling the class constructor
 */
export class ClassInstanceProvider extends InstanceProvider {
    params = 0;
    constructor(module, type, eager, scope = 'singleton') {
        super(module, type, type, eager, scope);
    }
    initParamProviders() {
        if (this.paramProvidersInitialized)
            return;
        const typeDescriptor = TypeDescriptor.forType(this.type);
        const constructor = typeDescriptor.getConstructor();
        // For constructors, pass the class itself (not prototype) to getParamTypes
        const paramTypes = constructor ? constructor.paramTypes : [];
        this.params = paramTypes.length;
        // Process annotated parameters
        const annotatedParams = paramTypes.map((type, index) => ({
            type,
            metadata: (typeof Reflect !== 'undefined' && Reflect.getMetadata) ? Reflect.getMetadata('annotations', this.type, `param:${index}`) || [] : [],
        }));
        this.processAnnotatedParams(annotatedParams);
        this.paramProvidersInitialized = true;
    }
    getDependencies() {
        // Lazy init: compute paramProviders on first call
        this.initParamProviders();
        // Build dependency list using shared logic
        const types = this.buildDependenciesFromParams();
        return [types, this.params];
    }
    create(environment, ...args) {
        //console.debug(`${this} create class ${this.type.name}`);
        // If no paramProviders, use old simple logic
        if (!this.paramProviders.length) {
            return environment.created(new this.type(...args.slice(0, this.params)));
        }
        // Resolve parameter values using shared logic
        const finalArgs = this.resolveParamValues(environment, args);
        return environment.created(new this.type(...finalArgs));
    }
    report() {
        return this.host.name;
    }
    toString() {
        return `ClassInstanceProvider(${this.type.name})`;
    }
    checkFactories() {
        for (const methodDescriptor of TypeDescriptor.forType(this.host).getMethods()) {
            const createDecorator = methodDescriptor.getDecorator(create);
            if (createDecorator) {
                const args = createDecorator.arguments || [];
                const eager = args[0] !== undefined ? args[0] : true;
                const scope = args[1] || "singleton";
                Providers.register(new FunctionInstanceProvider(this.getModule(), this.host, methodDescriptor.method, methodDescriptor.name, methodDescriptor.returnType, eager, scope));
            }
        }
    }
}
class MethodInjectionProvider extends InstanceProvider {
    hostClass;
    methodName;
    params = 0;
    constructor(hostClass, methodName) {
        super("", hostClass, undefined, false, "request");
        this.hostClass = hostClass;
        this.methodName = methodName;
    }
    initParamProviders() {
        if (this.paramProvidersInitialized)
            return;
        const descriptor = TypeDescriptor
            .forType(this.hostClass)
            .getMethod(this.methodName);
        const paramTypes = descriptor ? descriptor.paramTypes : [];
        this.params = paramTypes.length;
        const annotatedParams = paramTypes.map((type, index) => ({
            type,
            metadata: (typeof Reflect !== 'undefined' && Reflect.getMetadata)
                ? Reflect.getMetadata('annotations', this.hostClass, `${this.methodName}:param:${index}`) || []
                : [],
        }));
        this.processAnnotatedParams(annotatedParams);
        this.paramProvidersInitialized = true;
    }
    getDependencies() {
        this.initParamProviders();
        const types = this.buildDependenciesFromParams();
        return [types, this.params];
    }
    create(environment, ...args) {
        this.initParamProviders();
        return this.resolveParamValues(environment, args);
    }
}
/**
 * A FunctionInstanceProvider creates instances by calling methods annotated with @create
 */
export class FunctionInstanceProvider extends InstanceProvider {
    method;
    methodName;
    returnType;
    constructor(module, clazz, method, methodName, returnType, eager = true, scope = 'singleton') {
        super(module, clazz, returnType, eager, scope);
        this.method = method;
        this.methodName = methodName;
        this.returnType = returnType;
    }
    initParamProviders() {
        if (this.paramProvidersInitialized)
            return;
        const typeDescriptor = TypeDescriptor.forType(this.host);
        const methodDescriptor = typeDescriptor.getMethod(this.methodName);
        const paramTypes = methodDescriptor ? methodDescriptor.paramTypes : [];
        // Process annotated parameters
        const annotatedParams = paramTypes.map((type, index) => ({
            type,
            metadata: (typeof Reflect !== 'undefined' && Reflect.getMetadata) ? Reflect.getMetadata('annotations', this.host, `${this.methodName}:param:${index}`) || [] : [],
        }));
        this.processAnnotatedParams(annotatedParams);
        this.paramProvidersInitialized = true;
    }
    getDependencies() {
        // Lazy init: compute paramProviders on first call
        this.initParamProviders();
        const types = [this.host]; // First dependency is always the host class instance
        // Build dependency list using shared logic
        types.push(...this.buildDependenciesFromParams());
        return [types, 1 + this.paramProviders.length];
    }
    create(environment, ...args) {
        //console.debug(`${this} create from method ${this.methodName}`);
        // If no paramProviders (no parameters), use args directly
        if (!this.paramProviders.length) {
            const instance = this.method.apply(args[0]); // args[0]=this
            return environment.created(instance);
        }
        // args[0] is the host instance (this)
        const hostInstance = args[0];
        // Resolve parameter values using shared logic (start_index=1 to skip host instance)
        const methodArgs = this.resolveParamValues(environment, args, 1);
        const instance = this.method.apply(hostInstance, methodArgs);
        return environment.created(instance);
    }
    report() {
        return `${this.host.name}.${this.methodName}() -> ${this.returnType ? this.returnType.name : 'unknown'}`;
    }
    toString() {
        return `FunctionInstanceProvider(${this.host.name}.${this.methodName}() -> ${this.returnType ? this.returnType.name : 'unknown'})`;
    }
}
/**
 * AmbiguousProvider covers cases where fetching a class would lead to an ambiguity exception
 */
export class AmbiguousProvider extends AbstractInstanceProvider {
    typeClass;
    providers = [];
    constructor(typeClass, ...providers) {
        super();
        this.typeClass = typeClass;
        this.providers = [...providers];
    }
    addProvider(provider) {
        this.providers.push(provider);
    }
    getType() {
        return this.typeClass;
    }
    isEager() {
        return false;
    }
    getScope() {
        return "singleton";
    }
    getDependencies() {
        return [[], 1];
    }
    create(environment, ...args) {
        throw new DIRuntimeException(`Multiple candidates for type ${this.typeClass.name}`);
    }
    report() {
        return "ambiguous: " + this.providers.map(p => p.report()).join(",");
    }
    toString() {
        return `AmbiguousProvider(${this.typeClass.name})`;
    }
    checkFactories() {
        // No-op
    }
}
/**
 * EnvironmentInstanceProvider wraps a provider within an environment
 */
export class EnvironmentInstanceProvider extends AbstractInstanceProvider {
    environment;
    // instance data
    scopeInstance;
    provider;
    dependencies = null;
    // constructor
    constructor(environment, provider) {
        super();
        this.environment = environment;
        this.scopeInstance = environment.getScope(provider.getScope());
        if (provider instanceof EnvironmentInstanceProvider) {
            // inherit
            this.provider = provider.provider;
            this.dependencies = provider.dependencies;
        }
        else {
            this.provider = provider;
        }
    }
    resolve(context) {
        if (this.dependencies === null) {
            this.dependencies = [];
            context.push(this);
            try {
                const [types] = this.provider.getDependencies();
                for (const type of types) {
                    const provider = context.requireProvider(type);
                    this.dependencies.push(provider);
                    provider.resolve(context);
                }
            }
            finally {
                context.pop();
            }
        }
    }
    getType() {
        return this.provider.getType();
    }
    isEager() {
        return this.provider.isEager();
    }
    getScope() {
        return this.provider.getScope();
    }
    getDependencies() {
        return this.provider.getDependencies();
    }
    report() {
        return this.provider.report();
    }
    create(environment, ...args) {
        if (!this.dependencies) {
            throw new DIRuntimeException("Provider dependencies not resolved");
        }
        return this.scopeInstance.get(this.provider, this.environment, () => this.dependencies.map(provider => provider.create(environment)));
    }
    printTree(lines, prefix = "") {
        if (!this.dependencies)
            return;
        const children = this.dependencies;
        const lastIndex = children.length - 1;
        lines.push(prefix + "+- " + this.report());
        for (let i = 0; i < children.length; i++) {
            const childPrefix = i === lastIndex ? prefix + "   " : prefix + "|  ";
            children[i].printTree(lines, childPrefix);
        }
    }
    toString() {
        return `EnvironmentInstanceProvider(${this.provider})`;
    }
    checkFactories() {
        // No-op
    }
}
/**
 * Context class for resolving providers and detecting cycles
 */
class ResolveContext {
    providers;
    path = [];
    constructor(providers) {
        this.providers = providers;
    }
    push(provider) {
        this.path.push(provider);
    }
    pop() {
        this.path.pop();
    }
    requireProvider(type) {
        const provider = this.providers.get(type) || null;
        if (provider === null) {
            throw new DIRegistrationException(`Provider for ${type.name || 'unknown'} is not defined`);
        }
        if (this.path.includes(provider)) {
            throw new DIRegistrationException(this.cycleReport(provider));
        }
        return provider;
    }
    cycleReport(provider) {
        let cycle = "";
        let first = true;
        for (const p of this.path) {
            if (!first) {
                cycle += " -> ";
            }
            first = false;
            cycle += `${p.report()}`;
        }
        cycle += ` <> ${provider.report()}`;
        return cycle;
    }
}
export class Environment {
    // static data
    static instance = null;
    // instance data
    type;
    providers = new Map();
    lifecycleProcessors = [];
    instances = [];
    features = [];
    parent;
    // constructor
    /**
     * Creates a new Environment instance
     *
     * @param env The environment class that controls scanning of managed objects
     * @param features Optional list of feature flags
     * @param parent Optional parent environment, whose objects are inherited
     */
    constructor(options = {}) {
        const { module, features = [], parent = null } = options;
        Module.resolve();
        const addProvider = (type, provider) => {
            if (Tracer.ENABLED)
                Tracer.Trace('di', TraceLevel.HIGH, 'add provider {0} for {1}', provider, type?.name || 'unknown');
            this.providers.set(type, provider);
        };
        if (Tracer.ENABLED)
            Tracer.Trace('di', TraceLevel.HIGH, 'create environment for {0}', module?.name || 'unknown');
        // Initialize
        this.type = module;
        this.parent = parent;
        // boot
        if (this.parent === null && module !== Boot) {
            this.parent = Boot.getEnvironment();
        }
        const start = performance.now();
        this.features = [...features];
        if (this.parent) {
            // inherit providers from parent
            for (const [providerType, inheritedProvider] of this.parent.providers) {
                let provider = inheritedProvider;
                if (inheritedProvider.getScope() === "environment") {
                    // replace with own environment instance provider
                    provider = new EnvironmentInstanceProvider(this, inheritedProvider);
                }
                addProvider(providerType, provider);
            }
            // inherit processors unless they have environment scope
            for (const processor of this.parent.lifecycleProcessors) {
                const processorProvider = this.providers.get(processor.constructor);
                if (processorProvider && processorProvider.getScope() !== "environment") {
                    this.lifecycleProcessors.push(processor);
                }
                else {
                    this.get(processor.constructor); // create a new processor for this environment
                }
            }
        }
        else {
            // register core scopes
            this.providers.set(RequestScope, new RequestScopeInstanceProvider());
            this.providers.set(SingletonScope, new SingletonScopeInstanceProvider());
            this.providers.set(EnvironmentScope, new EnvironmentScopeInstanceProvider());
        }
        Environment.instance = this;
        // load providers
        if (module)
            this.collectProvider(module);
        // create eager instances
        for (const provider of this.providers.values())
            if (provider.isEager() && provider.environment === this)
                provider.create(this);
        const end = performance.now();
        if (Tracer.ENABLED)
            Tracer.Trace('di', TraceLevel.HIGH, 'created environment for {0} in {1}ms, created {2} instances', module?.name || 'unknown', end - start, this.instances.length);
    }
    collectProvider(module) {
        const accepts = Module.byType.get(module).accepts;
        // local function
        const filterProvider = (provider) => {
            return accepts.has(provider.getModule());
        };
        const filteredProviders = Providers.filter(this, filterProvider);
        this.providers = new Map([...this.providers, ...filteredProviders]);
    }
    /**
     * Check if a feature is enabled
     */
    hasFeature(feature) {
        return this.features.includes(feature);
    }
    /**
     * Check if a type is registered
     */
    isRegisteredType(type) {
        const provider = this.providers.get(type);
        return !!provider && !(provider.constructor.name === 'AmbiguousProvider');
    }
    /**
     * Get all registered types matching a predicate
     */
    registeredTypes(predicate) {
        const result = [];
        for (const provider of this.providers.values()) { // [...this.providers.values()]
            const type = provider.getType();
            if (predicate(type)) {
                result.push(type);
            }
        }
        return result;
    }
    /**
     * Execute lifecycle processors on an instance
     */
    executeProcessors(lifecycle, instance) {
        for (const processor of this.lifecycleProcessors) {
            processor.processLifecycle(lifecycle, instance, this);
        }
        return instance;
    }
    /**
     * Execute lifecycle processors asynchronously
     */
    async executeProcessorsAsync(lifecycle, instance) {
        for (const processor of this.lifecycleProcessors) {
            await processor.processLifecycleAsync(lifecycle, instance, this);
        }
        return instance;
    }
    /**
     * Process a newly created instance
     */
    created(instance) {
        // remember lifecycle processors
        if (instance instanceof LifecycleProcessor) {
            this.lifecycleProcessors.push(instance);
            // Sort immediately
            this.lifecycleProcessors.sort((a, b) => a.order - b.order);
        }
        // remember instance
        this.instances.push(instance);
        // execute processors
        this.executeProcessors(Lifecycle.ON_INJECT, instance);
        this.executeProcessors(Lifecycle.ON_INIT, instance);
        return instance;
    }
    /**
     * Generate a report of the environment state
     */
    report() {
        const lines = [];
        lines.push(`Environment ${this.type?.name || 'unknown'}`);
        if (this.parent) {
            lines.push(`Parent: ${this.parent.type?.name || 'unknown'}`);
        }
        lines.push("");
        // Post processors
        lines.push("Processors:");
        for (const processor of this.lifecycleProcessors) {
            lines.push(`- ${processor.constructor.name}`);
        }
        lines.push("");
        // Providers
        lines.push("Providers:");
        for (const [_resultType, provider] of this.providers) {
            if (provider instanceof EnvironmentInstanceProvider) {
                if (provider.environment === this) {
                    //lines.push(`- ${typeName}: `);
                    provider.printTree(lines);
                }
            }
        }
        lines.push("");
        // Instances
        lines.push("Instances:");
        const instanceCounts = {};
        for (const obj of this.instances) {
            const className = obj.constructor.name;
            instanceCounts[className] = (instanceCounts[className] || 0) + 1;
        }
        for (const [className, count] of Object.entries(instanceCounts)) {
            lines.push(`- ${className}: ${count}`);
        }
        return lines.join("\n");
    }
    /**
     * Start the environment by executing ON_RUNNING lifecycle phase
     */
    async start() {
        if (Tracer.ENABLED)
            Tracer.Trace('di', TraceLevel.HIGH, 'start environment {0}', this.type?.name || 'unknown');
        // execute ON_RUNNING phase for all instances (can be async)
        for (const instance of this.instances) {
            await this.executeProcessorsAsync(Lifecycle.ON_RUNNING, instance);
        }
    }
    /**
     * Stop the environment by executing ON_DESTROY lifecycle phase
     */
    async stop() {
        if (Tracer.ENABLED)
            Tracer.Trace('di', TraceLevel.HIGH, 'stop environment {0}', this.type?.name || 'unknown');
        // Execute ON_DESTROY phase for all instances (in reverse order)
        for (let i = this.instances.length - 1; i >= 0; i--) {
            await this.executeProcessorsAsync(Lifecycle.ON_DESTROY, this.instances[i]);
        }
        this.instances = [];
    }
    supports(type) {
        return this.providers.get(type) !== undefined;
    }
    /**
     * Get an instance of the specified type
     */
    get(type) {
        const provider = this.providers.get(type);
        if (!provider) {
            const typeName = type?.name || 'unknown';
            throw new DIRuntimeException(`${typeName} is not supported`);
        }
        return provider.create(this);
    }
    /**
     * Get providers (for internal use)
     */
    getProviders() {
        return this.providers;
    }
    /**
     * Get a scope by name
     */
    getScope(scopeName) {
        return Scopes.get(scopeName, this);
    }
    toString() {
        return `Environment(${this.type?.name || 'unknown'})`;
    }
}
// Boot "module"
/**
 * Bootstrap environment class
 */
let Boot = class Boot extends Module {
    static { Boot_1 = this; }
    static environment = null;
    static getEnvironment() {
        if (!Boot_1.environment) {
            Boot_1.environment = new Environment({ module: Boot_1 });
        }
        return Boot_1.environment;
    }
};
Boot = Boot_1 = __decorate([
    module({ name: "boot", register: false })
], Boot);
export { Boot };
// injectables
/**
 * Request scope - creates a new instance for each request
 */
let RequestScope = class RequestScope {
    get(provider, environment, argProvider) {
        return provider.create(environment, ...argProvider());
    }
};
RequestScope = __decorate([
    scope("request", false)
], RequestScope);
export { RequestScope };
/**
 * Singleton scope - caches instances for reuse
 */
let SingletonScope = class SingletonScope {
    // instance data
    value = this;
    get(provider, environment, argProvider) {
        if (this.value === this)
            this.value = provider.create(environment, ...argProvider());
        return this.value;
    }
};
SingletonScope = __decorate([
    scope("singleton", false)
], SingletonScope);
export { SingletonScope };
/**
 * Environment scope - caches instances for the lifetime of the environment
 */
let EnvironmentScope = class EnvironmentScope extends SingletonScope {
};
EnvironmentScope = __decorate([
    scope("environment", false)
], EnvironmentScope);
export { EnvironmentScope };
// Concrete lifecycle processors
let OnInjectCallableProcessor = class OnInjectCallableProcessor extends AbstractCallableProcessor {
    constructor() {
        super(Lifecycle.ON_INJECT);
    }
};
OnInjectCallableProcessor = __decorate([
    injectable({ module: "boot" }),
    order(1),
    __metadata("design:paramtypes", [])
], OnInjectCallableProcessor);
export { OnInjectCallableProcessor };
let OnInitCallableProcessor = class OnInitCallableProcessor extends AbstractCallableProcessor {
    constructor() {
        super(Lifecycle.ON_INIT);
    }
};
OnInitCallableProcessor = __decorate([
    injectable({ module: "boot" }),
    order(2),
    __metadata("design:paramtypes", [])
], OnInitCallableProcessor);
export { OnInitCallableProcessor };
let OnRunningCallableProcessor = class OnRunningCallableProcessor extends AbstractCallableProcessor {
    constructor() {
        super(Lifecycle.ON_RUNNING);
    }
};
OnRunningCallableProcessor = __decorate([
    injectable({ module: "boot" }),
    order(3),
    __metadata("design:paramtypes", [])
], OnRunningCallableProcessor);
export { OnRunningCallableProcessor };
let OnDestroyCallableProcessor = class OnDestroyCallableProcessor extends AbstractCallableProcessor {
    constructor() {
        super(Lifecycle.ON_DESTROY);
    }
};
OnDestroyCallableProcessor = __decorate([
    injectable({ module: "boot" }),
    order(4),
    __metadata("design:paramtypes", [])
], OnDestroyCallableProcessor);
export { OnDestroyCallableProcessor };
// Lifecycle callables — defined below together with InjectLifecycleCallable
/**
 * Base for lifecycle callables that inject method parameters.
 * Shared by @inject, @onInit, @onRunning, @onDestroy.
 */
class InjectingLifecycleCallable extends LifecycleCallable {
    // 🔥 Cache per host class
    static providerCache = new Map();
    getProvider(instance, method) {
        const key = `${instance.constructor.name}:${method.name}`;
        let provider = InjectingLifecycleCallable.providerCache.get(key);
        if (!provider) {
            provider = new MethodInjectionProvider(instance.constructor, method.name);
            InjectingLifecycleCallable.providerCache.set(key, provider);
        }
        return provider;
    }
    args(decorator, method, environment, instance) {
        const provider = this.getProvider(instance, method);
        const [types] = provider.getDependencies();
        // Resolve through full DI graph
        const resolved = types.map(type => environment.get(type));
        return provider.create(environment, ...resolved);
    }
}
let InjectLifecycleCallable = class InjectLifecycleCallable extends InjectingLifecycleCallable {
    constructor() {
        super(inject, Lifecycle.ON_INJECT);
    }
};
InjectLifecycleCallable = __decorate([
    injectable({ module: "boot" }),
    __metadata("design:paramtypes", [])
], InjectLifecycleCallable);
export { InjectLifecycleCallable };
let OnInitLifecycleCallable = class OnInitLifecycleCallable extends InjectingLifecycleCallable {
    constructor() {
        super(onInit, Lifecycle.ON_INIT);
    }
};
OnInitLifecycleCallable = __decorate([
    injectable({ module: "boot" }),
    __metadata("design:paramtypes", [])
], OnInitLifecycleCallable);
export { OnInitLifecycleCallable };
let OnDestroyLifecycleCallable = class OnDestroyLifecycleCallable extends InjectingLifecycleCallable {
    constructor() {
        super(onDestroy, Lifecycle.ON_DESTROY);
    }
};
OnDestroyLifecycleCallable = __decorate([
    injectable({ module: "boot" }),
    __metadata("design:paramtypes", [])
], OnDestroyLifecycleCallable);
export { OnDestroyLifecycleCallable };
let OnRunningLifecycleCallable = class OnRunningLifecycleCallable extends InjectingLifecycleCallable {
    constructor() {
        super(onRunning, Lifecycle.ON_RUNNING);
    }
};
OnRunningLifecycleCallable = __decorate([
    injectable({ module: "boot" }),
    __metadata("design:paramtypes", [])
], OnRunningLifecycleCallable);
export { OnRunningLifecycleCallable };
//# sourceMappingURL=di.js.map