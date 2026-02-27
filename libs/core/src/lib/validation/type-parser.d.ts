import { Type } from "./type";
export declare class TypeParser {
    private static normalizeType;
    static supportsConstraint(type: string, keyword: string): boolean;
    static supportedConstraints(type: string): string[];
    static constraintArguments(type: string, constraint: string): string[];
    private static parseConstraint;
    private static constraint4;
    static parse(type: string, constraintSpec: string | undefined): any;
}
export declare const ptype: (type: string) => Type<any>;
//# sourceMappingURL=type-parser.d.ts.map