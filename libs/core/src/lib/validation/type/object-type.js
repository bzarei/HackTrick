import { Type } from "./type";
/**
 * this constraint class adds specific checks for complex objects.
 */
export class ObjectType extends Type {
    shape;
    // constructor
    constructor(shape, name) {
        super(name);
        this.shape = shape;
        // add possible patches
        for (const property in shape)
            if (typeof shape[property] == "string")
                Type.patch(shape, property, () => Type.get(shape[property]));
        // add test
        this.test({
            type: "object",
            name: "type",
            params: {
                type: "object",
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
        // check properties
        if (object !== undefined) {
            const path = context.path;
            // check all properties
            for (const property in this.shape) {
                context.path = path === "" ? property : path + "." + property;
                this.shape[property].check(Reflect.get(object, property), context);
            } // for
            context.path = path;
        }
    }
}
export const object = (constraints, name) => new ObjectType(constraints, name);
//# sourceMappingURL=object-type.js.map