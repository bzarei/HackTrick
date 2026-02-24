
import { AdviceAspect } from "./advice-aspect"
import { AspectConfig } from "../aspect-config"
import { AspectFunc } from "../aspect"

export class ErrorAspect extends AdviceAspect {
    // constructor

    constructor(constructorFunction: any, func: AspectFunc, config: AspectConfig) {
        super(constructorFunction, func, config)
    }
}
