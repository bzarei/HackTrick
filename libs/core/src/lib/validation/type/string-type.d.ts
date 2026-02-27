import { Type } from "./type";
import type { ConstraintInfo } from "./type";
/**
 * this constraint class adds specific checks for strings.
 */
export declare class StringType extends Type<string> {
    private static readonly EMAIL;
    constructor(name?: string);
    in(values: string[], info?: ConstraintInfo): StringType;
    length(length: number, info?: ConstraintInfo): StringType;
    min(min: number, info?: ConstraintInfo): StringType;
    max(max: number, info?: ConstraintInfo): StringType;
    nonEmpty(info?: ConstraintInfo): StringType;
    email(info?: ConstraintInfo): StringType;
    matches(re: RegExp, info?: ConstraintInfo): StringType;
    format(format: string, info?: ConstraintInfo): StringType;
}
export declare const string: (name?: string) => StringType;
//# sourceMappingURL=string-type.d.ts.map