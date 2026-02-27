import { ValidationContext } from "../validation-context";
import { Type } from "./type";
/**
 * this constraint class adds specific checks for records ( e.g. mappings of string properties to value types ) .
 */
export declare class RecordType<T> extends Type<T> {
    value: Type<any>;
    constructor(value: Type<any>, name?: string);
    check(object: T, context: ValidationContext): void;
}
export declare const record: <T>(constraint: Type<T>, name?: string) => RecordType<unknown>;
//# sourceMappingURL=record-type.d.ts.map