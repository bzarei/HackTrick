import { Type } from "./type";
/**
 * Validation type for literal union types (e.g., 'value1' | 'value2' | 'value3')
 * This is different from EnumType which expects an enum object at runtime.
 */
export class OneOfType extends Type {
    // constructor
    constructor(allowedValues, name) {
        super(name);
        this.test({
            type: "oneOf",
            name: "type",
            params: {
                values: allowedValues,
            },
            break: true,
            check(object) {
                return allowedValues.includes(object);
            },
        });
    }
}
/**
 * Creates a validation type for a union of literal values
 * Usage: oneOf('count', 'sum', 'avg')
 */
export const oneOf = (...values) => new OneOfType(values);
//# sourceMappingURL=one-of-type.js.map