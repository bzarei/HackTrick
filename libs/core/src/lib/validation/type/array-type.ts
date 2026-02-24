import { ValidationContext } from "../validation-context"

import { Type, Constraint } from "./type"
import type { ConstraintInfo } from "./type"

/**
 * this constraint class adds specific checks for arrays.
 */
export class ArrayType<T extends Array<any>> extends Type<T> {
    // constructor

    constructor(public element: Type<any>) {
        super()

        this.test({
            type: "array",
            name: "type",
            params: {
                type: "array",
            },
            break: true,
            check(object: T): boolean {
                return Array.isArray(object)
            },
        })
    }

    // fluent

    @Constraint()
    min(min: number, info?: ConstraintInfo): ArrayType<T> {
        this.test({
            type: "array",
            name: "min",
            params: {
                min: min,
            },
            ...info,
            check(object: Array<T>): boolean {
                return object.length >= min
            },
        })

        return this
    }

    @Constraint()
    max(max: number, info?: ConstraintInfo): ArrayType<T> {
        this.test({
            type: "array",
            name: "max",
            params: {
                max: max,
            },
            ...info,
            check(object: Array<T>): boolean {
                return object.length <= max
            },
        })

        return this
    }

    // override constraint

    override check(object: T, context: ValidationContext) {
        // super will check the object

        super.check(object, context)

        // check elements

        if (object !== undefined && this.element) {
            const path = context.path

            // check all properties

            let index = 0
            for (const element of object) {
                context.path = path + "[" + index + "]"

                this.element!.check(element, context)

                index++
            } // for

            context.path = path
        }
    }
}

export const array = <T>(constraint: Type<T>) => new ArrayType(constraint)
