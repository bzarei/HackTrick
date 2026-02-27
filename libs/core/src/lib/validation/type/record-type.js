import { Type } from "./type";
/**
 * this constraint class adds specific checks for records ( e.g. mappings of string properties to value types ) .
 */
export class RecordType extends Type {
    value;
    // constructor
    constructor(value, name) {
        super(name);
        this.value = value;
        this.test({
            type: "record",
            name: "type",
            params: {
                type: "record",
            },
            break: true,
            check(object) {
                return typeof object == "object";
            },
        });
    }
    // override constraint
    check(object, context) {
        // super will check the object
        super.check(object, context);
        // check elements
        if (object !== undefined && this.value) {
            const path = context.path;
            // check all properties
            for (const property of Object.getOwnPropertyNames(object)) {
                context.path = path + "." + property;
                this.value.check(Reflect.get(object, property), context);
            } // for
            context.path = path;
        }
    }
}
export const record = (constraint, name) => new RecordType(constraint, name);
//# sourceMappingURL=record-type.js.map