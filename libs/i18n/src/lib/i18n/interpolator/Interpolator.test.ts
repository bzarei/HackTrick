import { Environment, module, create, Module } from "@novx/core"
import { LocaleManager } from "../../locale"
import { Interpolator } from "./Interpolator"

@module()
class TestModule extends Module {
    @create()
    localeManager() : LocaleManager {
        return  new LocaleManager({ locale: "en" })
    }
}


describe("interpolator", () => {
    let environment : Environment
    let interpolator: Interpolator

    beforeAll(() => {
        environment = new Environment({module: TestModule})

        interpolator = environment.get(Interpolator)
    })

    it("should interpolate", () => {
        let value = interpolator.interpolate("Hello {world}!", { world: "world" })

        expect(value).toBe("Hello world!")

        value = interpolator.interpolate("price: {price:number(style: 'currency', currency: 'EUR')}", { price: 1 })

        expect(value).toBe("price: €1.00")
    })
})
