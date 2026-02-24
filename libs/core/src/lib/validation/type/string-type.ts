import {Type, Constraint} from "./type"
import type {ConstraintInfo} from "./type"

/**
 * this constraint class adds specific checks for strings.
 */
export class StringType extends Type<string> {
    // static data

    private static readonly EMAIL =
        /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

    // constructor

    constructor(name?: string) {
        super(name)

        this.literalType("string")
    }

    // fluent api

    @Constraint()
    in(values: string[], info?: ConstraintInfo): StringType {
        this.test({
            type: "string",
            name: "in",
            params: { values },
            ...info,
            check(object: string): boolean {
                return values.includes(object)
            },
        })

        return this
    }

    @Constraint()
    length(length: number, info?: ConstraintInfo): StringType {
        this.test({
            type: "string",
            name: "length",
            params: {
                length: length,
            },
            ...info,
            check(object: string): boolean {
                return object.length === length
            },
        })

        return this
    }

    @Constraint()
    min(min: number, info?: ConstraintInfo): StringType {
        this.test({
            type: "string",
            name: "min",
            params: {
                min: min,
            },
            ...info,
            check(object: string): boolean {
                return object.length >= min
            },
        })

        return this
    }

    @Constraint()
    max(max: number, info?: ConstraintInfo): StringType {
        this.test({
            type: "string",
            name: "max",
            params: {
                max: max,
            },
            ...info,
            check(object: string): boolean {
                return object.length <= max
            },
        })

        return this
    }

    @Constraint()
    nonEmpty(info?: ConstraintInfo): StringType {
        this.test({
            type: "string",
            name: "nonEmpty",
            params: {},
            ...info,
            check(object: string): boolean {
                return object.trim().length > 0
            },
        })

        return this
    }

    @Constraint()
    email(info?: ConstraintInfo): StringType {
        this.test({
            type: "string",
            name: "email",
            params: {},
            ...info,
            check(object: string): boolean {
                return object.search(StringType.EMAIL) !== -1
            },
        })

        return this
    }

    @Constraint()
    matches(re: RegExp, info?: ConstraintInfo): StringType {
        this.test({
            type: "string",
            name: "matches",
            params: {
                re: re,
            },
            ...info,
            check(object: string): boolean {
                return object.search(re) !== -1
            },
        })

        return this
    }

    @Constraint()
    format(format: string, info?: ConstraintInfo): StringType {
        this.test({
            type: "string",
            name: "format",
            params: {
                format: format,
            },
            ...info,
            check(object: string): boolean {
                return true // TODO add...
            },
        })

        return this
    }
}

Type.registerFactory("string",StringType);

export const string = (name?: string) => new StringType(name)
