import { Type } from "./type"
import { ValidationContext } from "../validation-context"
import { ObjectType } from "./object-type"

/**
 * this constraint relates to referenced object schema
 */
export class ReferenceType<T> extends Type<T> {
    // instance data

    private schema: ObjectType<T>

    // constructor

    constructor(public type: ObjectType<T>) {
        super()

        this.schema = type

        this.test({
            type: "ref",
            name: "type",
            params: {
                ref: type,
            },
            break: true,
            check(object: T): boolean {
                return typeof object == "object"
            },
        })
    }

    // override

    override check(object: T, context: ValidationContext) {
        // super will check the object

        super.check(object, context)

        // check properties

        if (object !== undefined) {
            const path = context.path

            // recursion

            this.schema.check(object, context)

            // done

            context.path = path
        }
    }
}

export const reference = (type: any) => new ReferenceType(type)
