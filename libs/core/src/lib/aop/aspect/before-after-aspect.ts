import { AspectFunc } from "../aspect"
import { AdviceAspect } from "./advice-aspect"
import { AspectConfig } from "../aspect-config"

export class BeforeAfterAspect extends AdviceAspect {
    // constructor

    constructor(constructorFunction: any, func: AspectFunc, config: AspectConfig) {
        super(constructorFunction, func, config)
    }
}
