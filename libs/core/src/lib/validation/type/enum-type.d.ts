import { Type } from "./type";
/**
 * this constraint class adds specific checks for a specific class instances.
 */
export declare class EnumType<T extends Record<string, number | string>> extends Type<T> {
    type: T;
    keys: any[];
    private values;
    constructor(type: T, name?: string);
}
export declare const enumeration: (type: any, name?: string) => EnumType<any>;
//# sourceMappingURL=enum-type.d.ts.map