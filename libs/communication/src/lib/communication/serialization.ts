import {
    ArrayType,
    BooleanType,
    DateType,
    EnumType,
    NumberType,
    ObjectType,
    OneOfType,
    RecordType, ReferenceType,
    StringType,
    Type
} from "@novx/core";

// serialization

/**
 * A <code>TypeSerialization</code> covers the necessary transformation logic in order to serialize and deserialize objects
 * suitable for http calls
 * @param S the object type within the application
 * @param T the object type in the "transport" representation
 */
export interface TypeSerialization<S, T> {
    /**
     * serialize the passed object given a specific format
     * @param format the form according to open-api
     * @param value the value
     * @return tha possibly transformed object
     */
    serialize(format: string, value: S):T

    /**
     * deserialize the passed object given a specific format
     * @param format the form according to open-api
     * @param value the value
     * @return tha possibly transformed object
     */
    deserialize(format: string, value: T): S
}

export abstract class AbstractTypeSerialization<S, T> implements TypeSerialization<S, T> {
    // constructor

    serialize(format: string, value: S): T {
        throw new Error("Method not implemented.")
    }

    deserialize(format: string, value: T): S {
        throw new Error("Method not implemented.")
    }

    // protected

    protected serialization(
        serialization: Serialization,
        type: string | TypeSerialization<any, any>
    ): TypeSerialization<any, any> {
        if (typeof type === "string") return serialization.serialization(type)
        else return type
    }
}

class NoopSerialization extends AbstractTypeSerialization<any, any> {
    // implement AbstractTypeSerialization

    override serialize(format: string, value: any): any {
        return value
    }

    override deserialize(format: string, value: any): any {
        return value
    }
}


type EnumKeys<Enum> = Exclude<keyof Enum, number>

const enumObject = <Enum extends Record<string, number | string>>(e: Enum) => {
    const copy = { ...e } as { [K in EnumKeys<Enum>]: Enum[K] }
    Object.values(e).forEach((value) => typeof value === "number" && delete copy[value])
    return copy
}

const enumKeys = <Enum extends Record<string, number | string>>(e: Enum) => {
    return Object.keys(enumObject(e)) as EnumKeys<Enum>[]
}

const enumValues = <Enum extends Record<string, number | string>>(e: Enum) => {
    return [...Object.values(enumObject(e))] as Enum[EnumKeys<Enum>][]
}

export class EnumSerialization extends AbstractTypeSerialization<any, string> {
    // instance data

    private readonly keys: (string | symbol)[]
    private readonly values: any[]

    // constructor

    constructor(enumeration: any) {
        super()

        this.keys = enumKeys(enumeration) // always strings!
        this.values = enumValues(enumeration) // either strings or numbers
    }

    // implement TypeSerialization

    override deserialize(format: string, value: string): any {
        return this.values[this.keys.indexOf(value)]
    }

    override serialize(format: string, value: any): string {
        return this.keys[this.values.indexOf(value)] as string
    }
}

export class ArraySerialization<T, P> extends AbstractTypeSerialization<Array<T>, Array<P>> {
    // instance data

    private elementSerialization: TypeSerialization<T, P>

    // constructor

    constructor(serialization: Serialization, type: string | TypeSerialization<any, any>) {
        super() // dunno yet

        this.elementSerialization = this.serialization(serialization, type)
    }

    // implement TypeSerialization

    override deserialize(format: string, value: Array<P>): Array<T> {
        const result = []

        for (const element of value) result.push(this.elementSerialization.deserialize(format, element))

        return result
    }

    override serialize(format: string, value: Array<T>): Array<P> {
        const result = []

        for (const element of value) result.push(this.elementSerialization.serialize(format, element))

        return result
    }
}

export class DateSerialization extends AbstractTypeSerialization<Date, string> {
    // constructor

    constructor() {
        super()
    }

    // implement TypeSerialization

    override deserialize(format: string, value: string): Date {
        return new Date(value)
    }

    override serialize(format: string, value: Date): string {
        return value.toISOString()
    }
}

export class MapSerialization extends AbstractTypeSerialization<any, any> {
    // instance data

    private elementSerialization: TypeSerialization<any, any>

    // constructor

    constructor(serialization: Serialization, type: string | TypeSerialization<any, any>) {
        super() // dunno yet...

        this.elementSerialization = this.serialization(serialization, type)
    }

    // implement TypeSerialization

    override deserialize(format: string, value: any): any {
        const result: any = value // {}

        for (const property in value) result[property] = this.elementSerialization.deserialize(format, value[property])

        return result
    }

    override serialize(format: string, value: any): any {
        const result: any = {}

        for (const property in value) result[property] = this.elementSerialization.serialize(format, value[property])

        return result
    }
}


export class ObjectSerialization extends AbstractTypeSerialization<any, any> {
    // instance data

    private properties: string[] = []
    private types: Type<any>[] = []
    private format: string[] = []
    private operations: TypeSerialization<any, any>[] = []

    // constructor

    constructor(serialization: Serialization, schema: ObjectType<any>) {
        super()

        this.types = this.fromConstraint(serialization, schema)
    }

    // private

    private fromConstraint(serialization: Serialization, constraint: ObjectType<any>) {
        for (const property in constraint.shape) {
            const type = constraint.shape[property]

            const format = ""
            //TODO if (propertyConstraint.params4("format")) format = propertyConstraint.params4("format")?.format

            this.format.push(format)
            // @ts-expect-error: dunno
            this.types.push(type)
            this.properties.push(property)
            // @ts-expect-error: dunno
            this.operations.push(serialization.fromConstraint(type))
        } // for

        return this.types
    }

    // implement TypeSerialization

    override deserialize(format: string, object: any): any {
        const result: any = object //{}

        for (let i = 0; i < this.types.length; i++) {
            //const type = this.types[i]
            const property = this.properties[i]
            format = this.format[i]
            const operation = this.operations[i]
            let value = object[property]

            if (operation && value)
                result[property] = value = operation.deserialize(format, value)
            else
                result[property] = value

            // TODO !

            //type.validate(value)
        }

        return result
    }

    override serialize(format: string, object: any): any {
        const result: any = {}

        for (let i = 0; i < this.properties.length; i++) {
            const property = this.properties[i]
            const operation = this.operations[i]
            const value = object[property]

            if (operation && value) result[property] = operation.serialize(format, value)
            else result[property] = value
        }

        return result
    }
}

/**
 * this is the main class that keeps track of all registered schemas and the corresponding transformation steps
 */
export class Serialization {
    // constants

    private static readonly NOOP = new NoopSerialization()

    private static readonly PRIMITIVES = ["integer", "number", "string", "boolean", "date"]

    // static methods

    static fromJSON<T>(type: string, format: string, rawData: string): T {
        return Serialization.deserialize<T>(type, format, JSON.parse(rawData))
    }

    static asJSON(type: string, format: string, value: any): string {
        return JSON.stringify(this.serialize(type, format, value))
    }

    static serialize<T>(type: string, format: string, value: T): any {
        return Serialization.This.serialization(type).serialize(format, value)
    }

    static deserialize<T>(type: string, format: string, value: any): T {
        return Serialization.This.serialization(type).deserialize(format, value) as T
    }

    // static data

    static This: Serialization

    // instance data

    private serializationCache: { [type: string]: TypeSerialization<any, any> } = {}
    // constructor

    constructor() {
        Serialization.This = this

        this.cache("integer", new NoopSerialization())
        this.cache("number", new NoopSerialization())
        this.cache("boolean", new NoopSerialization())
        this.cache("string", new NoopSerialization())
        this.cache("date", new DateSerialization())
    }

    // private

    private cache(type: string, serialization: TypeSerialization<any, any>): TypeSerialization<any, any> {
        if (serialization instanceof NoopSerialization) {
            return (this.serializationCache[type] = serialization)
        }
        else {

            return (this.serializationCache[type] = serialization)
        }
    }

    public fromConstraint(constraint: Type<any>): TypeSerialization<any, any> {
        if ((constraint as any)["$serialization"]) return (constraint as any)["$serialization"] as TypeSerialization<any, any>

        let serialization: TypeSerialization<any, any> | undefined = undefined

        // string

        if (constraint instanceof StringType) serialization = this.serialization("string")
        // number
        else if (constraint instanceof NumberType) serialization = this.serialization("number")
        // date
        else if (constraint instanceof DateType) serialization = this.serialization("date")
        // boolean
        else if (constraint instanceof BooleanType) serialization = this.serialization("boolean")
        // enum
        else if (constraint instanceof EnumType) serialization = new EnumSerialization(constraint.type)
        // oneOf (literal union types)
        else if (constraint instanceof OneOfType) serialization = Serialization.NOOP
        // array
        else if (constraint instanceof ArrayType)
            serialization = new ArraySerialization(this, this.fromConstraint(constraint.element))
        // record
        else if (constraint instanceof RecordType)
            serialization = new MapSerialization(this, this.fromConstraint(constraint.value))
        // ref

        else if (constraint instanceof ReferenceType) serialization = this.fromConstraint(constraint.type)

        // object
        else if (constraint instanceof ObjectType) serialization = new ObjectSerialization(this, constraint)

        if (serialization) {
            ;(constraint as any)["$serialization"] = serialization

            return serialization
        }
        else throw new Error(`unsupported constraint `)
    }

    // public

    serialization(type: string): TypeSerialization<any, any> {
        // is it cached?

        const serialization = this.serializationCache[type]

        if (serialization) return serialization

        const constraint = Type.get(type)
        if (constraint) {
            const serialization = this.fromConstraint(constraint)

            return this.cache(type, serialization)
        }

        // is it a known primitive type that is not registered

        if (Serialization.PRIMITIVES.includes(type))
            // ...
            return this.cache(type, Serialization.NOOP)

        // we still need this code, since the string representations are generated in the [de]serialize calls within the services

        // is it an array

        if (type.startsWith("Array<")) {
            const elementType = type.substring(6, type.length - 1)
            return this.cache(type, new ArraySerialization(this, this.serialization(elementType)))
        }

        // is it a map

        if (type.startsWith("{ [key: string]")) {
            const elementType = type.substring(17, type.length - 3)

            return this.cache(type, new MapSerialization(this, this.serialization(elementType)))
        }

        // is it a type union, like "'CLOUD_BASE' | 'CLOUD_HEAT', ..."

        if (type.includes("|")) {
            if (type.includes("'")) return this.cache(type, this.serialization("string"))
            else return this.cache(type, this.serialization("number"))
        }

        // i give up

        throw new Error(`dont know how to serialize objects of type ${type}`)
    }

    clearCache() {
        this.serializationCache = {}
    }
}