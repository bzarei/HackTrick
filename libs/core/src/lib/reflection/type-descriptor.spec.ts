import "reflect-metadata"

import { TypeDescriptor } from "./type-descriptor"

import { ConsoleTrace, TraceLevel, Tracer } from "../tracer"

new Tracer({
        enabled: true,
        trace: new ConsoleTrace("%d [%p]: %m\n"), // d(ate), l(evel), p(ath), m(message)
        paths: {
            type: TraceLevel.FULL,
        },
    });


const typeDecorator = (): any => {
    return function create(target: any) {
        TypeDescriptor.forType(target).addDecorator(typeDecorator)
    }
}
const methodDecorator = function (test: string): any {
 
    return (target: any, property: string, descriptor: PropertyDescriptor) => {
        TypeDescriptor.forType(target.constructor).addMethodDecorator(target, property, methodDecorator, test)
    }
}

const propertyDecorator = (): any => {
    return function (target: any, propertyKey: string) {
        TypeDescriptor.forType(target.constructor).addPropertyDecorator(target, propertyKey, propertyDecorator)
    }
}

class Base {
      @propertyDecorator()
    base = ""

 @methodDecorator("test")
 f() {}
}

@typeDecorator()
class Test extends Base {
    @propertyDecorator()
    id = ""

    @methodDecorator("test")
    async foo(message: string): Promise<string> {
        return Promise.resolve("")
    }
    @methodDecorator("test")
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    bar(): void {}

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    baz(): Promise<number> {
        return Promise.resolve<number>(1)
    }
}

describe("TypeDescriptor", () => {
    it("should analyze", () => {
        const descriptor = TypeDescriptor.forType(Test)

        console.log(descriptor)

        const m = descriptor.getMethods()
        const p = descriptor.getProperties()

         const methodParams = Reflect.getMetadata(
      'design:paramtypes',
      Test.prototype,
      'foo'
    );
    const returnType = Reflect.getMetadata(
      'design:returntype',
      Test.prototype,
      'foo'
    );

    descriptor.toString();

        const test = descriptor.create()

        //.method();

        expect(test).toBeDefined()
        expect(test.id).toBeDefined()
    })

    it("should analyze", () => {
        const descriptor = TypeDescriptor.forType(Test)

        expect(descriptor.decorators.length).toBe(1)
        expect(descriptor.decorators[0].decorator).toBe(typeDecorator)

        expect(descriptor.getMethods().length).toBe(3)

        const foo = descriptor.getMethod("foo")!

        expect(foo.decorators.length).toBe(1)
        expect(foo.decorators[0].decorator).toBe(methodDecorator)
        expect(foo.async).toBe(true)

        expect(descriptor.getProperties().length).toBe(1)

        expect(descriptor.getField("id")?.decorators.length).toBe(1)
        expect(descriptor.getField("id")?.decorators[0]).toBe(propertyDecorator)

        //

        const baz = descriptor.getMethod("baz")!
        expect(baz.async).toBe(true)
    })
})
