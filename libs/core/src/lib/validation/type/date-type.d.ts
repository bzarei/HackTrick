import { Type } from "./type";
import type { ConstraintInfo } from "./type";
/**
 * this constraint class adds specific checks for dates.
 */
export declare class DateType extends Type<Date> {
    constructor(name?: string);
    min(min: Date, info?: ConstraintInfo): DateType;
    max(max: Date, info?: ConstraintInfo): DateType;
    format(format: string, info?: ConstraintInfo): DateType;
}
export declare const date: (name?: string) => DateType;
//# sourceMappingURL=date-type.d.ts.map