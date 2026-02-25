/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import 'reflect-metadata'

import { TraceLevel, Tracer } from "../tracer"
import { StringBuilder } from "../util"
import { GType } from "../lang"
/**
 * Generic type for class references
 *
export interface GType<T> extends Function {
    new (...args: any[]): T
}*/

enum PropertyType {
    FIELD,
    CONSTRUCTOR,
    METHOD,
}

export abstract class PropertyDescriptor {
    public decorators: DecoratorDescriptor[] = []

    protected constructor(public name: string, public type: PropertyType) {}

    addDecorator(decorator: Function, args: any[]) {
        this.decorators.push({ decorator, arguments: args })
    }

    hasDecorator(decorator: Function): boolean {
        return this.decorators.some(spec => spec.decorator === decorator)
    }

    getDecorator(decorator: Function): DecoratorDescriptor | undefined {
        return this.decorators.find(spec => spec.decorator === decorator)
    }


    abstract report(builder: StringBuilder): void
}

export interface DecoratorDescriptor {
    decorator: Function
    arguments: any[]
}

export class MethodDescriptor extends PropertyDescriptor {
    // instance data

    public async = false

    get paramTypes(): any[] {
        if (this.type === PropertyType.CONSTRUCTOR) {
            return Reflect.getMetadata('design:paramtypes', this.owner) || []
        }

        return Reflect.getMetadata(
            'design:paramtypes',
            this.owner.prototype,
            this.name
        ) || []
    }

    get returnType(): any {
        if (this.type === PropertyType.CONSTRUCTOR) {
            return this.owner
        }

        return Reflect.getMetadata(
            'design:returntype',
            this.owner.prototype,
            this.name
        )
    }

    // constructor

    constructor(
        name: string,
        public method: Function,
        type: PropertyType,
        private owner: GType<any>
    ) {
        super(name, type)

        this.async = method.constructor.name === 'AsyncFunction'
    }

    // public

    report(builder: StringBuilder): void {
        for (const spec of this.decorators)
            builder.append("\t@").append(spec.decorator.name).append("()\n")

        builder
            .append("\t")
            .append(this.async ? "async " : "")
            .append(this.name)
            .append("(")
            .append(this.paramTypes.map(p => p?.name ?? 'any').join(', '))
            .append(")")

        if (this.returnType) builder.append(": ").append(this.returnType.name)

        builder.append("\n")
    }
}

export class FieldDescriptor extends PropertyDescriptor {
    public propertyType: any

    constructor(name: string) {
        super(name, PropertyType.FIELD)
    }

    report(builder: StringBuilder): void {
        for (const decorator of this.decorators)
            builder.append("\t@").append(decorator.decorator.name).append("()\n")

        builder.append("\t").append(this.name)

        if (this.propertyType) builder.append(": ").append(this.propertyType.name)

        builder.append("\n")
    }
}

export interface Decorator<T = any> {
    decorate(type: TypeDescriptor<T>, instance: T): void
}



export class TypeDescriptor<T> {
    // Static factory

    private static globalRegistry = new WeakMap<GType<any>, TypeDescriptor<any>>();

    static forType<T>(type: GType<T>): TypeDescriptor<T> {
        let descriptor = TypeDescriptor.globalRegistry.get(type);
        if (!descriptor) {
            descriptor = new TypeDescriptor<T>(type);
            TypeDescriptor.globalRegistry.set(type, descriptor);
        }
        return descriptor;
    }

    // instance data

    public decorators: DecoratorDescriptor[] = []
    private properties: Record<string, PropertyDescriptor> = {}

    // constructor

    private constructor(public type: GType<T>) {
        if (Tracer.ENABLED) Tracer.Trace("type", TraceLevel.HIGH, "create type descriptor for {0}", type.name)
        this.analyze(type)
    }

    // public

    public create(...args: any[]): T {
        return new this.type(...args)
    }

    public addDecorator(decorator: Function, ...args: any[]): this {
        this.decorators.push({decorator, arguments: args})

        return this
    }

    public hasDecorator(decorator: Function): boolean {
        return this.decorators.some(d => d.decorator === decorator)
    }

    public getDecorator(decorator: Function): DecoratorDescriptor | undefined {
        return this.decorators.find(d => d.decorator === decorator)
    }


    public addMethodDecorator(target: any, property: string, decorator: Function, ...args: any[]): this {
        let method = this.getMethod(property)
        if (!method) {
            const desc = Object.getOwnPropertyDescriptor(target, property)
            if (desc && typeof desc.value === 'function') {
                method = new MethodDescriptor(property, desc.value, PropertyType.METHOD, target.constructor)
                this.properties[property] = method
            }
        }

        if (method) {
            method.addDecorator(decorator, args)
        }
        return this
    }

    public addPropertyDecorator(target: any, property: string, decorator: Function, ...args: any[]): this {
        let descriptor = this.getField(property)
        if (!descriptor) {
            descriptor = new FieldDescriptor(property)
            this.properties[property] = descriptor
            descriptor.propertyType = Reflect.getMetadata('design:type', target, property)
        }

        descriptor.addDecorator(decorator, args)

        return this
    }

    public getConstructor(): MethodDescriptor {
        return this.properties['constructor'] as MethodDescriptor
    }

    public getMethods(): MethodDescriptor[] {
        return Object.values(this.properties).filter(p => p.type === PropertyType.METHOD) as MethodDescriptor[]
    }

    public getFields(): FieldDescriptor[] {
        return Object.values(this.properties).filter(p => p.type === PropertyType.FIELD) as FieldDescriptor[]
    }

    public getProperties(): FieldDescriptor[] {
        return this.getFields()
    }

    public getMethod(name: string): MethodDescriptor | undefined {
        const p = this.properties[name]
        return p instanceof MethodDescriptor ? p : undefined
    }

    public getField(name: string): FieldDescriptor | undefined {
        const p = this.properties[name]
        return p instanceof FieldDescriptor ? p : undefined
    }

    private analyze(type: GType<T>) {

        // constructor descriptor
        this.properties['constructor'] =
            new MethodDescriptor('constructor', type, PropertyType.CONSTRUCTOR, type)

        // 🔥 walk prototype chain for inheritance
        let proto = type.prototype

        while (proto && proto !== Object.prototype) {

            const descriptors = Object.getOwnPropertyDescriptors(proto)

            for (const key of Object.keys(descriptors)) {
                if (key === 'constructor') continue

                const desc = descriptors[key]

                if (typeof desc.value === 'function') {
                    // method
                    if (!this.properties[key]) {
                        this.properties[key] =
                            new MethodDescriptor(
                                key,
                                desc.value,
                                PropertyType.METHOD,
                                proto.constructor as GType<any> // use the actual owner
                            )
                    }
                } else {
                    // field
                    if (!this.properties[key]) {
                        const fieldDesc = new FieldDescriptor(key)
                        fieldDesc.propertyType = Reflect.getMetadata('design:type', proto, key)
                        this.properties[key] = fieldDesc
                    }
                }
            }

            proto = Object.getPrototypeOf(proto)
        }
    }


    public toString(): string {
        const builder = new StringBuilder()
        for (const decorator of this.decorators) builder.append("@").append(decorator.decorator.name).append("()\n")

        builder.append("class ").append(this.type.name).append(" {\n")

        for (const field of this.getFields()) field.report(builder)
        for (const method of this.getMethods()) method.report(builder)

        builder.append("}\n")
        return builder.toString()
    }
}