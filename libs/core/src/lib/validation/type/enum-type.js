import { Type } from "./type";
const enumObject = (e) => {
    const copy = { ...e };
    Object.values(e).forEach((value) => typeof value === "number" && delete copy[value]);
    return copy;
};
const enumKeys = (e) => {
    return Object.keys(enumObject(e));
};
const enumValues = (e) => {
    return [...Object.values(enumObject(e))];
};
/**
 * this constraint class adds specific checks for a specific class instances.
 */
export class EnumType extends Type {
    type;
    // instance data
    keys;
    values;
    // constructor
    constructor(type, name) {
        super(name);
        this.type = type;
        this.keys = enumKeys(type);
        this.values = enumValues(type);
        const isEnum = (object) => {
            return this.values.includes(object);
        };
        this.test({
            type: "enum",
            name: "type",
            params: {
                enum: type,
            },
            break: true,
            check(object) {
                return isEnum(object);
            },
        });
    }
}
export const enumeration = (type, name) => new EnumType(type, name);
//# sourceMappingURL=enum-type.js.map