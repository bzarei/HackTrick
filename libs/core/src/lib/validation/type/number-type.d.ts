import { Type } from "./type";
import type { ConstraintInfo } from "./type";
/**
 * this constraint class adds specific checks for numbers.
 */
export declare class NumberType extends Type<number> {
    constructor(name?: string);
    min(min: number, info?: ConstraintInfo): NumberType;
    max(max: number, info?: ConstraintInfo): NumberType;
    lessThan(number: number, info?: ConstraintInfo): NumberType;
    lessThanEquals(number: number, info?: ConstraintInfo): NumberType;
    greaterThan(number: number, info?: ConstraintInfo): NumberType;
    greaterThanEquals(number: number, info?: ConstraintInfo): NumberType;
    format(format: string, info?: ConstraintInfo): NumberType;
    precision(precision: number, info?: ConstraintInfo): NumberType;
    scale(scale: number, info?: ConstraintInfo): NumberType;
}
export declare class ShortType extends NumberType {
    constructor(name?: string);
}
export declare class IntegerType extends NumberType {
    constructor(name?: string);
}
export declare class LongType extends NumberType {
    constructor(name?: string);
}
export declare class FloatType extends NumberType {
    constructor(name?: string);
}
export declare class DoubleType extends NumberType {
    constructor(name?: string);
}
export declare const number: (name?: string) => NumberType;
export declare const short: (name?: string) => ShortType;
export declare const integer: (name?: string) => IntegerType;
export declare const long: (name?: string) => LongType;
export declare const float: (name?: string) => FloatType;
export declare const double: (name?: string) => DoubleType;
//# sourceMappingURL=number-type.d.ts.map