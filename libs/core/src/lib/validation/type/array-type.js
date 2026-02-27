import { __decorate, __metadata } from "tslib";
import { Type, Constraint } from "./type";
/**
 * this constraint class adds specific checks for arrays.
 */
export class ArrayType extends Type {
    element;
    // constructor
    constructor(element) {
        super();
        this.element = element;
        this.test({
            type: "array",
            name: "type",
            params: {
                type: "array",
            },
            break: true,
            check(object) {
                return Array.isArray(object);
            },
        });
    }
    // fluent
    min(min, info) {
        this.test({
            type: "array",
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
            type: "array",
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
    // override constraint
    check(object, context) {
        // super will check the object
        super.check(object, context);
        // check elements
        if (object !== undefined && this.element) {
            const path = context.path;
            // check all properties
            let index = 0;
            for (const element of object) {
                context.path = path + "[" + index + "]";
                this.element.check(element, context);
                index++;
            } // for
            context.path = path;
        }
    }
}
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", ArrayType)
], ArrayType.prototype, "min", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", ArrayType)
], ArrayType.prototype, "max", null);
export const array = (constraint) => new ArrayType(constraint);
//# sourceMappingURL=array-type.js.map