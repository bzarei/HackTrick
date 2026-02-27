import { __decorate, __metadata } from "tslib";
import { Type, Constraint } from "./type";
/**
 * this constraint class adds specific checks for dates.
 */
export class DateType extends Type {
    // constructor
    constructor(name) {
        super(name);
        this.test({
            type: "date",
            name: "type",
            params: {
                type: "date",
            },
            break: true,
            check(object) {
                return typeof object == "object" && object.constructor.name === "Date";
            },
        });
    }
    // fluent
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
    format(format, info) {
        this.test({
            type: "date",
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
    __metadata("design:paramtypes", [Date, Object]),
    __metadata("design:returntype", DateType)
], DateType.prototype, "min", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date, Object]),
    __metadata("design:returntype", DateType)
], DateType.prototype, "max", null);
__decorate([
    Constraint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", DateType)
], DateType.prototype, "format", null);
Type.registerFactory("date", DateType);
export const date = (name) => new DateType(name);
//# sourceMappingURL=date-type.js.map