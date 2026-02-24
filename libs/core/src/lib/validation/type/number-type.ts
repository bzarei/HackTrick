import {Type, Constraint} from "./type"
import type {ConstraintInfo} from "./type"

/**
 * this constraint class adds specific checks for numbers.
 */
export class NumberType extends Type<number> {
    // constructor

    constructor(name?: string) {
        super(name)

        this.literalType("number")
    }

    // fluent api

    @Constraint()
    min(min: number, info?: ConstraintInfo): NumberType {
        this.test({
            type: "number",
            name: "min",
            params: {
                min: min,
            },
            ...info,
            check(object: number): boolean {
                return object >= min
            },
        })

        return this
    }

    @Constraint()
    max(max: number, info?: ConstraintInfo): NumberType {
        this.test({
            type: "number",
            name: "max",
            params: {
                max: max,
            },
            ...info,
            check(object: number): boolean {
                return object <= max
            },
        })

        return this
    }

    @Constraint()
    lessThan(number: number, info?: ConstraintInfo): NumberType {
        this.test({
            type: "number",
            name: "lessThan",
            params: {
                number: number,
            },
            ...info,
            check(object: number): boolean {
                return object < number
            },
        })

        return this
    }

    @Constraint()
    lessThanEquals(number: number, info?: ConstraintInfo): NumberType {
        this.test({
            type: "number",
            name: "lessThanEquals",
            params: {
                number: number,
            },
            ...info,
            check(object: number): boolean {
                return object <= number
            },
        })

        return this
    }

    @Constraint()
    greaterThan(number: number, info?: ConstraintInfo): NumberType {
        this.test({
            type: "number",
            name: "greaterThan",
            params: {
                number: number,
            },
            ...info,
            check(object: number): boolean {
                return object > number
            },
        })

        return this
    }

    @Constraint()
    greaterThanEquals(number: number, info?: ConstraintInfo): NumberType {
        this.test({
            type: "number",
            name: "greaterThanEquals",
            params: {
                number: number,
            },
            ...info,
            check(object: number): boolean {
                return object >= number
            },
        })

        return this
    }

    @Constraint()
    format(format: string, info?: ConstraintInfo): NumberType {
        this.test({
            type: "number",
            name: "format",
            params: {
                format: format,
            },
            ...info,
            check(object: number): boolean {
                return true // TODO add...
            },
        })

        return this
    }

    @Constraint()
    precision(precision: number, info?: ConstraintInfo): NumberType {
        this.test({
            type: "number",
            name: "precision",
            params: {
                //format: format,
            },
            ...info,
            check(object: number): boolean {
                return true // TODO add...
            },
        })

        return this
    }

    @Constraint()
    scale(scale: number, info?: ConstraintInfo): NumberType {
        this.test({
            type: "number",
            name: "scale",
            params: {
                //format: format,
            },
            ...info,
            check(object: number): boolean {
                return true // TODO add...
            },
        })

        return this
    }

    /*

    private scaleAndPrecision(value: number) {
        const x = value.toString();

        const scale = x.indexOf('.');
        if (scale == -1)
          return {
            scale: 0,
            precision: x.length
          };
        else
          return {
            scale: scale,
            precision: x.length - scale - 1
          };
      }*/
}

Type.registerFactory("number", NumberType);

// more

export class ShortType extends NumberType {
    // static block

    static {
        Type.registerFactory("short", ShortType);
    }

    // constructor

    constructor(name?: string) {
        super(name)
    }
}

export class IntegerType extends NumberType {
    // static block

    static {
        Type.registerFactory("integer", IntegerType);
    }

    // constructor

    constructor(name?: string) {
        super(name)
    }
}

export class LongType extends NumberType {
    // static block

    static {
        Type.registerFactory("long", LongType);
    }

    // constructor

    constructor(name?: string) {
        super(name)
    }
}

export class FloatType extends NumberType {
    // static block

    static {
        Type.registerFactory("float", FloatType);
    }

    // constructor

    constructor(name?: string) {
        super(name)
    }
}

export class DoubleType extends NumberType {
    // static block

    static {
        Type.registerFactory("double", DoubleType);
    }

    // constructor

    constructor(name?: string) {
        super(name)
    }
}

// functions

export const number = (name?: string) => new NumberType(name)

export const short = (name?: string) => new ShortType(name)
export const integer = (name?: string) => new IntegerType(name)
export const long = (name?: string) => new LongType(name)
export const float = (name?: string) => new FloatType(name)
export const double = (name?: string) => new DoubleType(name)
