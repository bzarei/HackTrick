/**
 * An <code>ErrorContext</code> covers possible context parameters that are known in case of an exception.
 * contexts can be chained in order to cover different aspects of a call. ( e.g. command, http.call, ... )
 */
export interface ErrorContext {
    /**
     * the chained {@link ErrorContext}
     */
    $next?: ErrorContext;
    /**
     * the type of context
     */
    $type: string;
    /**
     * any possible properties of this context
     */
    [prop: string]: unknown;
}
/**
 * this decorator is used to identify methods that should be registered as error handlers
 * @constructor
 */
export declare function catchError(): any;
/**
 * <code>ErrorManager</code> is responsible to handle errors by delegating to registered methods which match the error type.
 */
export declare class ErrorManager {
    private cache;
    private currentContext;
    private defaultErrorHandler;
    private find;
    private findNextMatch;
    private register;
    /**
     * Handle an error by calling the appropriate error handler.
     * This method will mark the error as handled in order to avoid double handling.
     * @param error the error to be handled
     * @param errorContext an optional context.
     * @return error the error for further actions
     */
    handle(error: any, errorContext?: ErrorContext): any;
    /**
     * @internal
     */
    registerHandler(handler: any): void;
    /**
     * clear the current context
     */
    clearContext(): ErrorContext | undefined;
    /**
     * return the current context
     */
    context(): ErrorContext | undefined;
    /**
     * push a new context and chain it to the current context
     * @param context the context
     */
    pushContext(context: ErrorContext): ErrorContext;
    /**
     * set a new context.
     * @param context
     */
    setContext(context: ErrorContext): ErrorContext;
    /**
     * pop the current context and set the parent as the current.
     */
    popContext(): ErrorContext | undefined;
}
//# sourceMappingURL=error-manager.d.ts.map