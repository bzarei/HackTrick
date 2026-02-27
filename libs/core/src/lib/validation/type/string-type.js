import { __decorate, __metadata } from "tslib";
import { Type, Constraint } from "./type";
/**
 * this constraint class adds specific checks for strings.
 */
export class StringType extends Type {
    // static data
    static EMAIL = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    // constructor
    constructor(name) {
        super(name);
        this.literalType("string");
    }
    // fluent api
    in(values, info) {
        this.test({
            type: "string",
            name: "in",
            params: { values },
            ...info,
            check(object) {
                return values.includes(object);
            },
        });
        return this;
    }
    length(length, info) {
        this.test({
            type: "string",
            name: "length",
            params: {
                length: length,
            },
            ...info,
            check(object) {
                return object.length === length;
            },
        });
        return this;
    }
    min(min, info) {
        this.test({
            type: "string",
            name: "min",
            params: {
                min: min,
            },
            ...info,
            check(object) {
                return object.length >= min;
            },
        });
        return this;
    }
    max(max, info) {
        this.test({
            type: "string",
            name: "max",
            params: {
                max: max,
            },
            ...info,
            check(object) {
                return object.length <= max;
            },
        });
        return this;
    }
    nonEmpty(info) {
        this.test({
            type: "string",
            name: "nonEmpty",
            params: {},
            ...info,
            check(object) {
                return object.trim().length > 0;
            },
        });
        return this;
    }
    email(info) {
        this.test({
            type: "string",
            name: "email",
            params: {},
            ...info,
            check(object) {
                return object.search(StringType.EMAIL) !== -1;
            },
        });
        return this;
    }
    matches(re, info) {
        this.test({
            type: "string",
            name: "matches",
            params: {
                re: re,
            },
            ...info,
            check(object) {
                return object.search(re) !== -1;
            },
        });
        return this;
    }
    format(format, info) {
        this.test({
            type: "string",
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
}
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", StringType)
], StringType.prototype, "in", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", StringType)
], StringType.prototype, "length", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", StringType)
], StringType.prototype, "min", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", StringType)
], StringType.prototype, "max", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", StringType)
], StringType.prototype, "nonEmpty", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", StringType)
], StringType.prototype, "email", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegExp, Object]),
    __metadata("design:returntype", StringType)
], StringType.prototype, "matches", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", StringType)
], StringType.prototype, "format", null);
Type.registerFactory("string", StringType);
export const string = (name) => new StringType(name);
//# sourceMappingURL=string-type.js.map