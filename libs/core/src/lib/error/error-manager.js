import { __decorate } from "tslib";
import { TraceLevel, Tracer } from '../tracer';
import { TypeDescriptor } from '../reflection';
import { injectable } from '../di';
/**
 * this decorator is used to identify methods that should be registered as error handlers
 * @constructor
 */
export function catchError() {
    return (target, propertyKey, descriptor) => {
        TypeDescriptor.forType(target.constructor).addMethodDecorator(target, propertyKey, catchError);
        const params = Reflect.getMetadata("design:paramtypes", target, propertyKey);
        if (params.length !== 1)
            throw new Error('methods decorated with @catchError() must define a single type parameter, got ' +
                params.length);
        const type = params[0];
        // array.length === 1!
        // eslint-disable-next-line no-prototype-builtins
        if (!target.constructor.hasOwnProperty("$$exception"))
            target.constructor["$$exception"] = {};
        target.constructor["$$exception"][propertyKey] = {
            type: type,
            handler: descriptor?.value,
        };
    };
}
/**
 * <code>ErrorManager</code> is responsible to handle errors by delegating to registered methods which match the error type.
 */
let ErrorManager = class ErrorManager {
    // instance data
    cache = {};
    currentContext;
    // private
    defaultErrorHandler(e) {
        console.log(e);
        return e;
    }
    find(clazz) {
        if (!clazz)
            return undefined;
        let entry = this.cache[clazz.name];
        if (!entry) {
            const parent = this.findNextMatch(Object.getPrototypeOf(clazz));
            if (parent)
                this.register((entry = {
                    type: clazz,
                    instance: parent.instance || undefined,
                    handler: parent.handler || undefined,
                    next: parent,
                }));
        }
        // if
        return entry;
    }
    findNextMatch(clazz) {
        let entry = this.find(clazz);
        while (!entry && clazz && clazz?.name)
            entry = this.find((clazz = Object.getPrototypeOf(clazz)));
        return entry;
    }
    register(entry) {
        this.cache[entry.type.name] = entry;
    }
    // public
    /**
     * Handle an error by calling the appropriate error handler.
     * This method will mark the error as handled in order to avoid double handling.
     * @param error the error to be handled
     * @param errorContext an optional context.
     * @return error the error for further actions
     */
    handle(error, errorContext) {
        if (error.$handled)
            return error;
        // a string will complain...
        if (typeof error == 'object')
            error.$handled = true;
        if (Tracer.ENABLED)
            Tracer.Trace('error', TraceLevel.FULL, 'handle error {0}', error.name);
        let entry = this.find(error.constructor);
        if (!entry) {
            // either the inheritance trick didn't work, or there is no handler...
            entry = this.find(Error);
            if (entry) {
                this.register({
                    type: error.constructor,
                    instance: entry.instance,
                    handler: entry.handler,
                });
            }
            else {
                this.register((entry = {
                    type: error.constructor,
                    instance: this,
                    handler: this.defaultErrorHandler,
                }));
            }
        }
        return entry.handler.apply(entry.instance, [
            error,
            errorContext || this.currentContext,
        ]);
    }
    /**
     * @internal
     */
    registerHandler(handler) {
        const handlers = handler.constructor['$$exception'];
        for (const property in handlers) {
            const entry = handlers[property];
            this.register({
                type: entry.type,
                instance: handler,
                handler: entry.handler,
            });
        } // for
    }
    // public
    /**
     * clear the current context
     */
    clearContext() {
        if (Tracer.ENABLED)
            Tracer.Trace('error', TraceLevel.FULL, 'clear context');
        try {
            return this.currentContext;
        }
        finally {
            this.currentContext = undefined;
        }
    }
    /**
     * return the current context
     */
    context() {
        return this.currentContext;
    }
    /**
     * push a new context and chain it to the current context
     * @param context the context
     */
    pushContext(context) {
        if (Tracer.ENABLED)
            Tracer.Trace('error', TraceLevel.FULL, 'push context');
        context.$next = this.currentContext;
        return (this.currentContext = context);
    }
    /**
     * set a new context.
     * @param context
     */
    setContext(context) {
        if (Tracer.ENABLED)
            Tracer.Trace('error', TraceLevel.FULL, 'set context');
        return (this.currentContext = context);
    }
    /**
     * pop the current context and set the parent as the current.
     */
    popContext() {
        if (Tracer.ENABLED)
            Tracer.Trace('error', TraceLevel.FULL, 'pop context');
        try {
            return this.currentContext;
        }
        finally {
            this.currentContext = this.currentContext?.$next;
        }
    }
};
ErrorManager = __decorate([
    injectable()
], ErrorManager);
export { ErrorManager };
//# sourceMappingURL=error-manager.js.map