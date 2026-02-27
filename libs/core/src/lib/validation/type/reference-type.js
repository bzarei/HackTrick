import { Type } from "./type";
/**
 * this constraint relates to referenced object schema
 */
export class ReferenceType extends Type {
    type;
    // instance data
    schema;
    // constructor
    constructor(type) {
        super();
        this.type = type;
        this.schema = type;
        this.test({
            type: "ref",
            name: "type",
            params: {
                ref: type,
            },
            break: true,
            check(object) {
                return typeof object == "object";
            },
        });
    }
    // override
    check(object, context) {
        // super will check the object
        super.check(object, context);
        // check properties
        if (object !== undefined) {
            const path = context.path;
            // recursion
            this.schema.check(object, context);
            // done
            context.path = path;
        }
    }
}
export const reference = (type) => new ReferenceType(type);
//# sourceMappingURL=reference-type.js.map