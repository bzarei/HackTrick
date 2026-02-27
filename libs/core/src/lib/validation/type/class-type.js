import { Type } from "./type";
/**
 * this constraint class adds specific checks for a specific class instances.
 */
export class ClassType extends Type {
    // constructor
    constructor(type, name) {
        super(name);
        this.test({
            type: "class",
            name: "type",
            params: {
                type: "type",
            },
            break: true,
            check(object) {
                return object instanceof type;
            },
        });
    }
}
export const type = (type, name) => new ClassType(type, name);
//# sourceMappingURL=class-type.js.map