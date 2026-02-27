import { ValidationContext } from "../validation-context";
import { Type } from "./type";
import type { ConstraintInfo } from "./type";
/**
 * this constraint class adds specific checks for arrays.
 */
export declare class ArrayType<T extends Array<any>> extends Type<T> {
    element: Type<any>;
    constructor(element: Type<any>);
    min(min: number, info?: ConstraintInfo): ArrayType<T>;
    max(max: number, info?: ConstraintInfo): ArrayType<T>;
    check(object: T, context: ValidationContext): void;
}
export declare const array: <T>(constraint: Type<T>) => ArrayType<any[]>;
//# sourceMappingURL=array-type.d.ts.map