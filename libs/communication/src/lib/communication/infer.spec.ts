export type Maybe<T> = T | null | undefined

export type Defined<T> = T extends undefined ? never : T
export type AnyObject = { [k: string]: any }
export type NotNull<T> = T extends null ? never : T
export type NotUndefined<T> = T extends undefined ? never : T

class Schema<T> {
    //declare
    type!: T

    // here?

    //required(): Schema<NotNull<T>> {
    //    return this as Schema<NotNull<T>>
    //}
}

class NumberSchema<T extends Maybe<number> | number> extends Schema<T> {
    constructor() {
        super()
    }

    required(): NumberSchema<NotUndefined<NotNull<number>>> {
        return new NumberSchema<number>()
    }

    optional(): NumberSchema<Maybe<number>> {
        return this as NumberSchema<Maybe<number>>
    }
}

class StringSchema<T extends Maybe<string> | string> extends Schema<T> {
    //req : boolean = false
    constructor() {
        super()
    }

    optional(): StringSchema<Maybe<string>> {
        return this as StringSchema<Maybe<string>>
    }

    required(): StringSchema<NotUndefined<NotNull<string>>> {
        return this as StringSchema<NotUndefined<NotNull<string>>>
    }
}

export type TypeFromShape<S extends ObjectShape<any>> = {
    [K in keyof S]: InferType<S[K]>
}

export type ObjectShape<T extends Maybe<AnyObject>> = {
    [field in keyof T]-?: Schema<T[field]>
}

class ObjectSchema<T extends Maybe<AnyObject>> extends Schema<T> {
    constructor(public shape: ObjectShape<T>) {
        super()
    }
}

//NOPE doesnt work export type InferType<T> = T extends Schema<any> ? T["type"]: never
//NOPE doesnt work export type InferType<T> = T extends Schema<infer P> ? P : never

export type InferType<T> = T extends ObjectSchema<any>
    ? TypeFromShape<T["shape"]>
    : T extends Schema<infer R>
    ? R // T['type']
    : never
// functions

const string = (): StringSchema<string | undefined> => new StringSchema<string | undefined>()
const number = (): NumberSchema<number | undefined> => new NumberSchema<number | undefined>()
const object = <T extends ObjectShape<any>>(shape: T): ObjectSchema<TypeFromShape<T>> => {
    return new ObjectSchema<TypeFromShape<T>>(shape as any)
}

describe("inference", () => {
    it("should work", () => {
        const priceSchema = new ObjectSchema({
            currency: string().required(),
            value: number().required(),
        })

        const schema = new ObjectSchema({
            age: number().required(),
            name: string().required(),
            optionalString: string().required(), //.optional(),
            price: object({
                currency: string().required(),
                value: number().required(),
            }),
        })

        const bla: InferType<typeof schema> = {
            age: 1,
            name: "k",
            optionalString: "k",
            price: {
                currency: "1",
                value: 1,
            },
        }

        bla.age = 1;

        console.log(bla)

        const numberSchema = number()
        const optionalNumberSchema = number().optional()
        const requiredNumberSchema = number().required()

        const num: InferType<typeof numberSchema> = undefined
        const optNum: InferType<typeof optionalNumberSchema> = undefined
        const reqNum: InferType<typeof requiredNumberSchema> = 42 // should not work with undefined

        const price: InferType<typeof priceSchema> = { currency: "EUR", value: 1 } // ok, at least i have the shape, and now?
    })
})
