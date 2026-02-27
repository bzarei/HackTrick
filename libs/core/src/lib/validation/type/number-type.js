import { __decorate, __metadata } from "tslib";
import { Type, Constraint } from "./type";
/**
 * this constraint class adds specific checks for numbers.
 */
export class NumberType extends Type {
    // constructor
    constructor(name) {
        super(name);
        this.literalType("number");
    }
    // fluent api
    min(min, info) {
        this.test({
            type: "number",
            name: "min",
            params: {
                min: min,
            },
            ...info,
            check(object) {
                return object >= min;
            },
        });
        return this;
    }
    max(max, info) {
        this.test({
            type: "number",
            name: "max",
            params: {
                max: max,
            },
            ...info,
            check(object) {
                return object <= max;
            },
        });
        return this;
    }
    lessThan(number, info) {
        this.test({
            type: "number",
            name: "lessThan",
            params: {
                number: number,
            },
            ...info,
            check(object) {
                return object < number;
            },
        });
        return this;
    }
    lessThanEquals(number, info) {
        this.test({
            type: "number",
            name: "lessThanEquals",
            params: {
                number: number,
            },
            ...info,
            check(object) {
                return object <= number;
            },
        });
        return this;
    }
    greaterThan(number, info) {
        this.test({
            type: "number",
            name: "greaterThan",
            params: {
                number: number,
            },
            ...info,
            check(object) {
                return object > number;
            },
        });
        return this;
    }
    greaterThanEquals(number, info) {
        this.test({
            type: "number",
            name: "greaterThanEquals",
            params: {
                number: number,
            },
            ...info,
            check(object) {
                return object >= number;
            },
        });
        return this;
    }
    format(format, info) {
        this.test({
            type: "number",
            name: "format",
            params: {
                format: format,
            },
            ...info,
            check(object) {
                return true; // TODO add...
            },
        });
        return this;
    }
    precision(precision, info) {
        this.test({
            type: "number",
            name: "precision",
            params: {
            //format: format,
            },
            ...info,
            check(object) {
                return true; // TODO add...
            },
        });
        return this;
    }
    scale(scale, info) {
        this.test({
            type: "number",
            name: "scale",
            params: {
            //format: format,
            },
            ...info,
            check(object) {
                return true; // TODO add...
            },
        });
        return this;
    }
}
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", NumberType)
], NumberType.prototype, "min", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", NumberType)
], NumberType.prototype, "max", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", NumberType)
], NumberType.prototype, "lessThan", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", NumberType)
], NumberType.prototype, "lessThanEquals", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", NumberType)
], NumberType.prototype, "greaterThan", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", NumberType)
], NumberType.prototype, "greaterThanEquals", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", NumberType)
], NumberType.prototype, "format", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", NumberType)
], NumberType.prototype, "precision", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", NumberType)
], NumberType.prototype, "scale", null);
Type.registerFactory("number", NumberType);
// more
export class ShortType extends NumberType {
    // static block
    static {
        Type.registerFactory("short", ShortType);
    }
    // constructor
    constructor(name) {
        super(name);
    }
}
export class IntegerType extends NumberType {
    // static block
    static {
        Type.registerFactory("integer", IntegerType);
    }
    // constructor
    constructor(name) {
        super(name);
    }
}
export class LongType extends NumberType {
    // static block
    static {
        Type.registerFactory("long", LongType);
    }
    // constructor
    constructor(name) {
        super(name);
    }
}
export class FloatType extends NumberType {
    // static block
    static {
        Type.registerFactory("float", FloatType);
    }
    // constructor
    constructor(name) {
        super(name);
    }
}
export class DoubleType extends NumberType {
    // static block
    static {
        Type.registerFactory("double", DoubleType);
    }
    // constructor
    constructor(name) {
        super(name);
    }
}
// functions
export const number = (name) => new NumberType(name);
export const short = (name) => new ShortType(name);
export const integer = (name) => new IntegerType(name);
export const long = (name) => new LongType(name);
export const float = (name) => new FloatType(name);
export const double = (name) => new DoubleType(name);
//# sourceMappingURL=number-type.js.map