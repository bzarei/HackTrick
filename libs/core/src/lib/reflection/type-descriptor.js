/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import 'reflect-metadata';
import { TraceLevel, Tracer } from "../tracer";
import { StringBuilder } from "../util";
/**
 * Generic type for class references
 *
export interface GType<T> extends Function {
    new (...args: any[]): T
}*/
var PropertyType;
(function (PropertyType) {
    PropertyType[PropertyType["FIELD"] = 0] = "FIELD";
    PropertyType[PropertyType["CONSTRUCTOR"] = 1] = "CONSTRUCTOR";
    PropertyType[PropertyType["METHOD"] = 2] = "METHOD";
})(PropertyType || (PropertyType = {}));
export class PropertyDescriptor {
    name;
    type;
    decorators = [];
    constructor(name, type) {
        this.name = name;
        this.type = type;
    }
    addDecorator(decorator, args) {
        this.decorators.push({ decorator, arguments: args });
    }
    hasDecorator(decorator) {
        return this.decorators.some(spec => spec.decorator === decorator);
    }
    getDecorator(decorator) {
        return this.decorators.find(spec => spec.decorator === decorator);
    }
}
export class MethodDescriptor extends PropertyDescriptor {
    method;
    owner;
    // instance data
    async = false;
    get paramTypes() {
        if (this.type === PropertyType.CONSTRUCTOR) {
            return Reflect.getMetadata('design:paramtypes', this.owner) || [];
        }
        return Reflect.getMetadata('design:paramtypes', this.owner.prototype, this.name) || [];
    }
    get returnType() {
        if (this.type === PropertyType.CONSTRUCTOR) {
            return this.owner;
        }
        return Reflect.getMetadata('design:returntype', this.owner.prototype, this.name);
    }
    // constructor
    constructor(name, method, type, owner) {
        super(name, type);
        this.method = method;
        this.owner = owner;
        this.async = method.constructor.name === 'AsyncFunction';
    }
    // public
    report(builder) {
        for (const spec of this.decorators)
            builder.append("\t@").append(spec.decorator.name).append("()\n");
        builder
            .append("\t")
            .append(this.async ? "async " : "")
            .append(this.name)
            .append("(")
            .append(this.paramTypes.map(p => p?.name ?? 'any').join(', '))
            .append(")");
        if (this.returnType)
            builder.append(": ").append(this.returnType.name);
        builder.append("\n");
    }
}
export class FieldDescriptor extends PropertyDescriptor {
    propertyType;
    constructor(name) {
        super(name, PropertyType.FIELD);
    }
    report(builder) {
        for (const decorator of this.decorators)
            builder.append("\t@").append(decorator.decorator.name).append("()\n");
        builder.append("\t").append(this.name);
        if (this.propertyType)
            builder.append(": ").append(this.propertyType.name);
        builder.append("\n");
    }
}
export class TypeDescriptor {
    type;
    // Static factory
    static globalRegistry = new WeakMap();
    static forType(type) {
        let descriptor = TypeDescriptor.globalRegistry.get(type);
        if (!descriptor) {
            descriptor = new TypeDescriptor(type);
            TypeDescriptor.globalRegistry.set(type, descriptor);
        }
        return descriptor;
    }
    // instance data
    decorators = [];
    properties = {};
    // constructor
    constructor(type) {
        this.type = type;
        if (Tracer.ENABLED)
            Tracer.Trace("type", TraceLevel.HIGH, "create type descriptor for {0}", type.name);
        this.analyze(type);
    }
    // public
    create(...args) {
        return new this.type(...args);
    }
    addDecorator(decorator, ...args) {
        this.decorators.push({ decorator, arguments: args });
        return this;
    }
    hasDecorator(decorator) {
        return this.decorators.some(d => d.decorator === decorator);
    }
    getDecorator(decorator) {
        return this.decorators.find(d => d.decorator === decorator);
    }
    addMethodDecorator(target, property, decorator, ...args) {
        let method = this.getMethod(property);
        if (!method) {
            const desc = Object.getOwnPropertyDescriptor(target, property);
            if (desc && typeof desc.value === 'function') {
                method = new MethodDescriptor(property, desc.value, PropertyType.METHOD, target.constructor);
                this.properties[property] = method;
            }
        }
        if (method) {
            method.addDecorator(decorator, args);
        }
        return this;
    }
    addPropertyDecorator(target, property, decorator, ...args) {
        let descriptor = this.getField(property);
        if (!descriptor) {
            descriptor = new FieldDescriptor(property);
            this.properties[property] = descriptor;
            descriptor.propertyType = Reflect.getMetadata('design:type', target, property);
        }
        descriptor.addDecorator(decorator, args);
        return this;
    }
    getConstructor() {
        return this.properties['constructor'];
    }
    getMethods() {
        return Object.values(this.properties).filter(p => p.type === PropertyType.METHOD);
    }
    getFields() {
        return Object.values(this.properties).filter(p => p.type === PropertyType.FIELD);
    }
    getProperties() {
        return this.getFields();
    }
    getMethod(name) {
        const p = this.properties[name];
        return p instanceof MethodDescriptor ? p : undefined;
    }
    getField(name) {
        const p = this.properties[name];
        return p instanceof FieldDescriptor ? p : undefined;
    }
    analyze(type) {
        // constructor descriptor
        this.properties['constructor'] =
            new MethodDescriptor('constructor', type, PropertyType.CONSTRUCTOR, type);
        // 🔥 walk prototype chain for inheritance
        let proto = type.prototype;
        while (proto && proto !== Object.prototype) {
            const descriptors = Object.getOwnPropertyDescriptors(proto);
            for (const key of Object.keys(descriptors)) {
                if (key === 'constructor')
                    continue;
                const desc = descriptors[key];
                if (typeof desc.value === 'function') {
                    // method
                    if (!this.properties[key]) {
                        this.properties[key] =
                            new MethodDescriptor(key, desc.value, PropertyType.METHOD, proto.constructor // use the actual owner
                            );
                    }
                }
                else {
                    // field
                    if (!this.properties[key]) {
                        const fieldDesc = new FieldDescriptor(key);
                        fieldDesc.propertyType = Reflect.getMetadata('design:type', proto, key);
                        this.properties[key] = fieldDesc;
                    }
                }
            }
            proto = Object.getPrototypeOf(proto);
        }
    }
    toString() {
        const builder = new StringBuilder();
        for (const decorator of this.decorators)
            builder.append("@").append(decorator.decorator.name).append("()\n");
        builder.append("class ").append(this.type.name).append(" {\n");
        for (const field of this.getFields())
            field.report(builder);
        for (const method of this.getMethods())
            method.report(builder);
        builder.append("}\n");
        return builder.toString();
    }
}
//# sourceMappingURL=type-descriptor.js.map