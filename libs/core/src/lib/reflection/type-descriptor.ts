/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import 'reflect-metadata'

import { TraceLevel, Tracer } from "../tracer"
import { StringBuilder } from "../util"
import { GType } from "../lang"

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

    mergeDecoratorsFrom(parent: PropertyDescriptor) {
        for (const parentDec of parent.decorators) {
            if (!this.decorators.some(d => d.decorator === parentDec.decorator)) {
                this.decorators.push(parentDec)
            }
        }
    }

    abstract report(builder: StringBuilder): void
}

export interface DecoratorDescriptor {
    decorator: Function
    arguments: any[]
}

export class MethodDescriptor extends PropertyDescriptor {
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

    constructor(
        name: string,
        public method: Function,
        type: PropertyType,
        private owner: GType<any>
    ) {
        super(name, type)
        this.async = method.constructor.name === 'AsyncFunction'
    }

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
    static forType<T>(type: GType<T>): TypeDescriptor<T> {
        const proto = type.prototype as any
        if (!Object.prototype.hasOwnProperty.call(proto, '__descriptor')) {
            proto.__descriptor = new TypeDescriptor<T>(type)
        }
        return proto.__descriptor
    }

    public parent?: TypeDescriptor<any>
    public decorators: DecoratorDescriptor[] = []
    private properties: Record<string, PropertyDescriptor> = {}

    private constructor(public type: GType<T>) {
        if (Tracer.ENABLED) Tracer.Trace("type", TraceLevel.HIGH, "create type descriptor for {0}", type.name)

        // assign parent descriptor if superclass exists
        const parentProto = Object.getPrototypeOf(type.prototype)
        if (parentProto && parentProto.constructor !== Object) {
            this.parent = TypeDescriptor.forType(parentProto.constructor)
        }

        this.analyzeStructure(type)
        this.inheritFromParent()
    }

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
        if (method) method.addDecorator(decorator, args)
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

    public getMethods(filter : (method: MethodDescriptor) => boolean = (method) => true): MethodDescriptor[] {
        return Object.values(this.properties)
            .filter((p): p is MethodDescriptor => p.type === PropertyType.METHOD)
            .filter(filter)
    }

    public getFields(filter : (field: FieldDescriptor) => boolean = (field) => true): FieldDescriptor[] {
        return Object.values(this.properties)
         .filter((p): p is FieldDescriptor => p.type === PropertyType.FIELD)
         .filter(filter)
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

    /** Step 1: analyze only current type's structure */
    private analyzeStructure(type: GType<T>) {
        this.properties['constructor'] =
            new MethodDescriptor('constructor', type, PropertyType.CONSTRUCTOR, type)

        let proto = type.prototype
        while (proto && proto !== Object.prototype) {
            const descriptors = Object.getOwnPropertyDescriptors(proto)
            for (const key of Object.keys(descriptors)) {
                if (key === 'constructor') continue
                const desc = descriptors[key]
                if (typeof desc.value === 'function') {
                    if (!this.properties[key]) {
                        this.properties[key] = new MethodDescriptor(
                            key,
                            desc.value,
                            PropertyType.METHOD,
                            proto.constructor as GType<any>
                        )
                    }
                } else {
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

    /** Step 2: inherit decorators from parent TypeDescriptor */
    private inheritFromParent() {
        if (!this.parent) return

        for (const key of Object.keys(this.properties)) {
            const childProp = this.properties[key]
            const parentProp = this.parent.properties[key]
            if (childProp && parentProp) {
                childProp.mergeDecoratorsFrom(parentProp)
            }
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