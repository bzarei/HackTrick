import {Type, Constraint} from "./type"
import type {ConstraintInfo} from "./type"

/**
 * this constraint class adds specific checks for booleans.
 */
export class BooleanType extends Type<boolean> {
    // constructor

    constructor(name?: string) {
        super(name)

        this.literalType("boolean")
    }

    // fluent

    @Constraint()
    isTrue(info?: ConstraintInfo): BooleanType {
        this.test({
            type: "boolean",
            name: "isTrue",
            params: {},
            ...info,
            check(object: boolean): boolean {
                return object === true
            },
        })

        return this
    }

    @Constraint()
    isFalse(info?: ConstraintInfo): BooleanType {
        this.test({
            type: "boolean",
            name: "isFalse",
            params: {},
            ...info,
            check(object: boolean): boolean {
                return object === false
            },
        })

        return this
    }
}

 Type.registerFactory("boolean", BooleanType);

/**
 * return a new constraint based on boolean values
 */
export const boolean = (name?: string) => new BooleanType(name)
