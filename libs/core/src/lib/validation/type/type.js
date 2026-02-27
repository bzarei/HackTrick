import { __decorate, __metadata } from "tslib";
import "reflect-metadata";
import { get, set } from "../../lang";
import { StringBuilder } from "../../util";
import { ValidationContext } from "../validation-context";
import { ValidationError } from "../validation-error";
class Patch {
    evaluate;
    // data
    object;
    property;
    constructor(object, property, evaluate) {
        this.evaluate = evaluate;
        this.object = object;
        this.property = property;
    }
    // public
    resolve() {
        this.set(this.evaluate());
    }
    // private
    set(value) {
        this.object[this.property] = value;
    }
}
export const Constraint = () => {
    return (target, propertyKey, descriptor) => {
        // mark method
        Reflect.defineMetadata("isFluentConstraint", true, target, propertyKey);
        // get parameter types (using reflect-metadata)
        const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey) || [];
        // get parameter names (from function text)
        const fn = descriptor.value;
        const paramNames = fn
            .toString()
            .match(/\(([^)]*)\)/)?.[1]
            .split(",")
            .map(p => p.trim())
            .filter(Boolean) || [];
        // combine names and types, filter out optional info parameters
        const params = paramNames
            .map((name, i) => ({
            name: name.replace(/\?.*$/, ''), // remove ? and everything after
            type: paramTypes[i],
            isOptional: name.includes('?')
        }))
            .filter(p => !p.name.includes('info')) // exclude info parameters
            .map(p => ({ name: p.name, type: p.type }));
        // store metadata with type info
        const existing = Reflect.getOwnMetadata("fluentConstraints", target) || [];
        existing.push({
            name: propertyKey,
            params
        });
        Reflect.defineMetadata("fluentConstraints", existing, target);
    };
};
export class Type {
    name;
    // static data
    static cache = {};
    static factories = new Map();
    static patches = [];
    static timeout = false;
    // static methods
    static getTypes() {
        return Array.from(Type.factories.keys());
    }
    static getConstraints(typeName) {
        const type = this.factories.get(typeName);
        if (!type) {
            console.warn(`Type '${typeName}' not found in factories`);
            return [];
        }
        return type.constraints;
    }
    static registerFactory(typeName, typeClass) {
        const constraints = [];
        let proto = typeClass.prototype;
        const seen = new Set();
        // walk prototype chain (important!)
        while (proto && proto !== Object.prototype) {
            const local = Reflect.getOwnMetadata("fluentConstraints", proto) || [];
            for (const c of local) {
                // child overrides parent
                if (!seen.has(c.name)) {
                    seen.add(c.name);
                    constraints.push({
                        ...c
                    });
                }
            }
            proto = Object.getPrototypeOf(proto);
        }
        this.factories.set(typeName, {
            typeClass,
            constraints
        });
    }
    static create(typeName, constraints) {
        const entry = this.factories.get(typeName);
        if (!entry)
            throw new Error(`Unknown type: ${typeName}`);
        const instance = new entry.typeClass();
        if (constraints) {
            for (const [name, value] of Object.entries(constraints)) {
                if (typeof instance[name] !== "function") {
                    throw new Error(`Unknown constraint: ${name}`);
                }
                if (value === true) {
                    instance[name]();
                }
                else {
                    instance[name](value);
                }
            }
        }
        return instance;
    }
    static register(constraint) {
        set(this.cache, constraint.name, constraint);
        return this;
    }
    static get(type) {
        // execute possible pending patches
        this.resolve();
        // is it cached?
        const constraint = get(this.cache, type);
        return constraint;
    }
    static resolve() {
        let patch;
        while ((patch = this.patches.shift()))
            patch.resolve();
        this.timeout = false;
    }
    static patch(object, property, evaluate) {
        this.patches.push(new Patch(object, property, evaluate));
        if (!this.timeout) {
            this.timeout = true;
            setTimeout(() => {
                this.resolve();
            }, 0);
        }
    }
    // instance data
    tests = [];
    message;
    // protected
    constructor(name) {
        this.name = name;
        if (name)
            Type.register(this);
    }
    baseType = "string";
    literalType(type) {
        this.baseType = type;
        this.test({
            type: type,
            name: "type",
            params: {
                type: type,
            },
            break: true,
            check(object) {
                return typeof object == type;
            },
        });
    }
    // public
    toJSON() {
        const constraints = {};
        for (const test of this.tests) {
            // skip the literal type check
            if (test.name === "type")
                continue;
            if (!test.params || Object.keys(test.params).length === 0) {
                constraints[test.name] = true;
            }
            else if (Object.keys(test.params).length === 1) {
                // unwrap single param (length → 1, in → ["12"])
                constraints[test.name] = Object.values(test.params)[0];
            }
            else {
                // fallback: keep full params object
                constraints[test.name] = test.params;
            }
        }
        return {
            [this.baseType]: constraints
        };
    }
    validate(object) {
        const context = new ValidationContext();
        this.check(object, context);
        if (context.violations.length > 0)
            throw new ValidationError(context.violations);
    }
    isValid(object) {
        const context = new ValidationContext();
        this.check(object, context);
        return context.violations.length == 0;
    }
    // fluent: not here!
    errorMessage(message) {
        this.message = message;
        return this;
    }
    test(test) {
        this.tests.push(test);
        return this;
    }
    required() {
        const typeTest = this.tests[0];
        typeTest.ignore = false;
        return this;
    }
    optional() {
        const typeTest = this.tests[0];
        typeTest.ignore = true;
        return this;
    }
    nullable() {
        const typeTest = this.tests[0];
        typeTest.ignore = true;
        return this;
    }
    params4(constraint) {
        for (const test of this.tests)
            if (test.name === constraint)
                return test.params;
        return undefined;
    }
    toString() {
        const builder = new StringBuilder();
        builder.append(this.baseType).append(" ");
        for (const test of this.tests) {
            if (test.name !== "type") {
                builder.append(test.name);
                if (test.params) {
                    for (const key of Object.keys(test.params)) {
                        builder.append(" ");
                        builder.append(key);
                        builder.append("=");
                        builder.append(test.params[key]);
                    }
                } // if
            }
        }
        return builder.toString();
    }
    // protected
    check(object, context) {
        for (const test of this.tests) {
            if (!test.check(object)) {
                // remember violation
                if (test.ignore !== true)
                    context.violations.push({
                        type: test.type,
                        name: test.name,
                        params: test.params,
                        path: context.path,
                        value: object,
                        message: test.message,
                    });
                if (test.break === true)
                    return;
            }
        }
    }
}
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Type)
], Type.prototype, "required", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Type)
], Type.prototype, "optional", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Type)
], Type.prototype, "nullable", null);
export const schema = (name, type) => {
    type.name = name;
    Type.register(type);
    return type;
};
//# sourceMappingURL=type.js.map