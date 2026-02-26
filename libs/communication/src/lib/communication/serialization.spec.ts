import {Serialization} from "./serialization";
import {array, date, enumeration, number, object, record, reference, schema, string} from "@novx/core";

interface Bar {
    name: string
    properties: { [key: string]: Color }
}

enum Color {
    RED = 1,
    GREEN,
    BLUE,
}

schema("Color", enumeration(Color))

enum StringColor {
    RED = "RED_COLOR",
    GREEN = "GREEN_COLOR",
    BLUE = "BLUE_COLOR",
}

schema("StringColor", enumeration(StringColor))

interface Foo {
    name: string
    number: number
    birthday: Date
    bar: Bar
    bars: Bar[]
    color: Color
    stringColor: StringColor
}

const BarSchema = schema("Bar", object({
    name: string(),
    properties: record(enumeration(Color)),
}))

const FooSchema = schema("Foo", object({
    name: string(),
    number: number().min(1).max(2),
    birthday: date().format("date-time"), // actually this is about serialization!
    color: enumeration(Color),
    stringColor: enumeration(StringColor),
    bar: reference(BarSchema),
    bars: array(BarSchema),
}))

describe("serialization", () => {
    new Serialization();

    it("should serialize literal types", () => {
        const serializedLiteral = Serialization.serialize("boolean", "format", true)
        const deserializedLiteral = Serialization.deserialize<boolean>("boolean", "format", serializedLiteral)

        expect(serializedLiteral).toBe(deserializedLiteral)
    })

    it("should serialize enums", () => {
        const serializedLiteral = Serialization.serialize("Color", "", Color.RED)

        expect(serializedLiteral).toBe("RED")
        const deserializedLiteral = Serialization.deserialize("Color", "", serializedLiteral)

        expect(deserializedLiteral).toBe(Color.RED)
    })

    it("should serialize string enums", () => {
        const serializedLiteral = Serialization.serialize("StringColor", "", StringColor.RED)

        expect(serializedLiteral).toBe("RED")
        const deserializedLiteral = Serialization.deserialize("StringColor", "", serializedLiteral)

        expect(deserializedLiteral).toBe(StringColor.RED)
    })

    it("should serialize string type unions", () => {
        const serializedLiteral = Serialization.serialize("'RED_COLOR' | 'GREEN_COLOR' | 'BLUE_COLOR'", "", StringColor.RED)
        const deserializedLiteral = Serialization.deserialize("'RED_COLOR' | 'GREEN_COLOR' | 'BLUE_COLOR'", "", serializedLiteral)

        expect(deserializedLiteral).toBeDefined()
        expect(deserializedLiteral).toBe(StringColor.RED)
    })

    it("should serialize literal arrays", () => {
        const serializedLiteral = Serialization.serialize("Array<number>", "", [1, 2, 3])
        const deserializedLiteral = Serialization.deserialize("Array<number>", "", serializedLiteral)

        expect(deserializedLiteral).toBeDefined()
        expect((deserializedLiteral as []).length).toBe(3)
    })

    it("should serialize literal maps", () => {
        const original = { a: 1, b: 2, c: 3 }
        const serialized = Serialization.serialize<any>("{ [key: string]: number; }", "", original)
        const deserialized = Serialization.deserialize("{ [key: string]: number; }", "", serialized)

        expect(deserialized).toBeDefined()
        //expect(deserialized["a"]).toBe(original["a"])
    })

    it("should serialize maps including arrays", () => {
        const original = { a: [1], b: [2], c: [3] }
        const serialized = Serialization.serialize<any>("{ [key: string]: Array<number>; }", "", original)
        const deserialized = Serialization.deserialize("{ [key: string]: Array<number>; }", "", serialized)

        expect(deserialized).toBeDefined()
        //expect((deserialized["a"] as [])[0]).toBe(original["a"][0])
    })

    it("should serialize complex types", () => {
        const foo: Foo = {
            number: 0,
            name: "andi",
            color: Color.BLUE,
            stringColor: StringColor.BLUE,
            birthday: new Date(),
            bar: {
                name: "Bar",
                properties: {
                    bla: Color.RED,
                    blu: Color.RED,
                },
            },
            bars: [
                {
                    name: "Bar",
                    properties: {
                        bla: Color.RED,
                        blu: Color.RED,
                    },
                },
            ],
        }

        let serialized = Serialization.serialize("Foo", "format", foo)
        let deserialized = Serialization.deserialize<Foo>("Foo", "format", serialized)

        // expect..

        expect(deserialized.name).toBe(foo.name)
        expect(deserialized.color).toBe(foo.color)
        expect(deserialized.stringColor).toBe(foo.stringColor)
        //expect(deserialized.birthday).toBe(foo.birthday)
        expect(deserialized.bar).toBeDefined()
        expect(deserialized.bar.name).toBe(foo.bar.name)
        expect(deserialized.bars.length).toBe(1)
        expect(deserialized.bars[0].name).toBe(foo.bars[0].name)
        //expect(deserialized.bars[0].properties.bla).toBe(foo.bars[0].properties.bla)

        // TEST

        const time = (func: () => void, loops: number) => {
            const start = new Date().getTime()

            try {
                for (let i = 0; i < loops; i++) func()
            } finally {
                const duration = new Date().getTime() - start
                const avg = duration / loops

                console.log(`${loops} loops in ${duration}ms, avg=${avg}`)
            }
        }

        const perf = true

        if (perf)
            time(() => {
                serialized = Serialization.serialize("Foo", "format", foo)
                deserialized = Serialization.deserialize<Foo>("Foo", "format", serialized)
            }, 100000)
    })
})