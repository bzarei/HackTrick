import { Type } from "./type";
export declare interface _Type<T> extends Function {
    new (...args: any[]): T;
}
/**
 * this constraint class adds specific checks for a specific class instances.
 */
export declare class ClassType extends Type<any> {
    constructor(type: _Type<any>, name?: string);
}
export declare const type: (type: _Type<any>, name?: string) => ClassType;
//# sourceMappingURL=class-type.d.ts.map