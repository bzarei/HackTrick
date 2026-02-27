import { __decorate, __metadata } from "tslib";
import { Type, Constraint } from "./type";
/**
 * this constraint class adds specific checks for booleans.
 */
export class BooleanType extends Type {
    // constructor
    constructor(name) {
        super(name);
        this.literalType("boolean");
    }
    // fluent
    isTrue(info) {
        this.test({
            type: "boolean",
            name: "isTrue",
            params: {},
            ...info,
            check(object) {
                return object === true;
            },
        });
        return this;
    }
    isFalse(info) {
        this.test({
            type: "boolean",
            name: "isFalse",
            params: {},
            ...info,
            check(object) {
                return object === false;
            },
        });
        return this;
    }
}
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", BooleanType)
], BooleanType.prototype, "isTrue", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", BooleanType)
], BooleanType.prototype, "isFalse", null);
Type.registerFactory("boolean", BooleanType);
/**
 * return a new constraint based on boolean values
 */
export const boolean = (name) => new BooleanType(name);
//# sourceMappingURL=boolean-type.js.map