import { Type } from "./type";
import type { ConstraintInfo } from "./type";
/**
 * this constraint class adds specific checks for booleans.
 */
export declare class BooleanType extends Type<boolean> {
    constructor(name?: string);
    isTrue(info?: ConstraintInfo): BooleanType;
    isFalse(info?: ConstraintInfo): BooleanType;
}
/**
 * return a new constraint based on boolean values
 */
export declare const boolean: (name?: string) => BooleanType;
//# sourceMappingURL=boolean-type.d.ts.map