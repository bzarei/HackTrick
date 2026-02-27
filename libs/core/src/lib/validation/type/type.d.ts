import "reflect-metadata";
import { Test } from "../test";
import { ValidationContext } from "../validation-context";
export interface ConstraintInfo {
    message?: string;
}
export interface ConstraintMethodDescriptor {
    name: string;
    params: {
        name: string;
        type: any;
    }[];
}
export declare const Constraint: () => MethodDecorator;
export declare class Type<T> {
    name?: string | undefined;
    static cache: {};
    private static factories;
    private static patches;
    private static timeout;
    static getTypes(): string[];
    static getConstraints(typeName: string): ConstraintMethodDescriptor[];
    static registerFactory(typeName: string, typeClass: {
        new (): Type<any>;
    }): void;
    static create(typeName: string, constraints?: Record<string, any>): Type<any>;
    static register(constraint: Type<any>): typeof Type;
    static get(type: string): Type<any> | undefined;
    private static resolve;
    static patch(object: any, property: string, evaluate: () => any): void;
    tests: Test<T>[];
    message?: string;
    protected constructor(name?: string | undefined);
    baseType: string;
    protected literalType(type: string): void;
    toJSON(): Record<string, any>;
    validate(object: T): void;
    isValid(object: T): boolean;
    errorMessage(message: string): Type<T>;
    test(test: Test<T>): Type<T>;
    required(): Type<T>;
    optional(): Type<T>;
    nullable(): Type<T>;
    params4(constraint: string): any | undefined;
    toString(): string;
    check(object: T, context: ValidationContext): void;
}
export declare const schema: (name: string, type: Type<any>) => Type<any>;
//# sourceMappingURL=type.d.ts.map