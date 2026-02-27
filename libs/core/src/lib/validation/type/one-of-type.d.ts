import { Type } from "./type";
/**
 * Validation type for literal union types (e.g., 'value1' | 'value2' | 'value3')
 * This is different from EnumType which expects an enum object at runtime.
 */
export declare class OneOfType<T> extends Type<T> {
    constructor(allowedValues: T[], name?: string);
}
/**
 * Creates a validation type for a union of literal values
 * Usage: oneOf('count', 'sum', 'avg')
 */
export declare const oneOf: <T>(...values: T[]) => OneOfType<T>;
//# sourceMappingURL=one-of-type.d.ts.map