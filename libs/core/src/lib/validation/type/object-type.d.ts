import { Type } from "./type";
import { ValidationContext } from "../validation-context";
export type PropertyConstraints = {
    [property: string]: Type<any> | string;
};
/**
 * this constraint class adds specific checks for complex objects.
 */
export declare class ObjectType<T = any> extends Type<T> {
    shape: PropertyConstraints;
    constructor(shape: PropertyConstraints, name?: string);
    check(object: T, context: ValidationContext): void;
}
export declare const object: (constraints: PropertyConstraints, name?: string) => ObjectType<any>;
//# sourceMappingURL=object-type.d.ts.map