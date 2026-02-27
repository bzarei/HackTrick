import { Type } from "./type";
import { ValidationContext } from "../validation-context";
import { ObjectType } from "./object-type";
/**
 * this constraint relates to referenced object schema
 */
export declare class ReferenceType<T> extends Type<T> {
    type: ObjectType<T>;
    private schema;
    constructor(type: ObjectType<T>);
    check(object: T, context: ValidationContext): void;
}
export declare const reference: (type: any) => ReferenceType<unknown>;
//# sourceMappingURL=reference-type.d.ts.map