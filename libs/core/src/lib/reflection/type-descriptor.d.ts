import 'reflect-metadata';
import { StringBuilder } from "../util";
import { GType } from "../lang";
/**
 * Generic type for class references
 *
export interface GType<T> extends Function {
    new (...args: any[]): T
}*/
declare enum PropertyType {
    FIELD = 0,
    CONSTRUCTOR = 1,
    METHOD = 2
}
export declare abstract class PropertyDescriptor {
    name: string;
    type: PropertyType;
    decorators: DecoratorDescriptor[];
    protected constructor(name: string, type: PropertyType);
    addDecorator(decorator: Function, args: any[]): void;
    hasDecorator(decorator: Function): boolean;
    getDecorator(decorator: Function): DecoratorDescriptor | undefined;
    abstract report(builder: StringBuilder): void;
}
export interface DecoratorDescriptor {
    decorator: Function;
    arguments: any[];
}
export declare class MethodDescriptor extends PropertyDescriptor {
    method: Function;
    private owner;
    async: boolean;
    get paramTypes(): any[];
    get returnType(): any;
    constructor(name: string, method: Function, type: PropertyType, owner: GType<any>);
    report(builder: StringBuilder): void;
}
export declare class FieldDescriptor extends PropertyDescriptor {
    propertyType: any;
    constructor(name: string);
    report(builder: StringBuilder): void;
}
export interface Decorator<T = any> {
    decorate(type: TypeDescriptor<T>, instance: T): void;
}
export declare class TypeDescriptor<T> {
    type: GType<T>;
    private static globalRegistry;
    static forType<T>(type: GType<T>): TypeDescriptor<T>;
    decorators: DecoratorDescriptor[];
    private properties;
    private constructor();
    create(...args: any[]): T;
    addDecorator(decorator: Function, ...args: any[]): this;
    hasDecorator(decorator: Function): boolean;
    getDecorator(decorator: Function): DecoratorDescriptor | undefined;
    addMethodDecorator(target: any, property: string, decorator: Function, ...args: any[]): this;
    addPropertyDecorator(target: any, property: string, decorator: Function, ...args: any[]): this;
    getConstructor(): MethodDescriptor;
    getMethods(): MethodDescriptor[];
    getFields(): FieldDescriptor[];
    getProperties(): FieldDescriptor[];
    getMethod(name: string): MethodDescriptor | undefined;
    getField(name: string): FieldDescriptor | undefined;
    private analyze;
    toString(): string;
}
export {};
//# sourceMappingURL=type-descriptor.d.ts.map