import { Invocation } from "../invocation"
import { Aspect, AspectFunc } from "../aspect"
import { AspectType } from "../aspect-type.enum"

export class MethodAspect extends Aspect {
    // constructor

    constructor(func: AspectFunc) {
        super(func, { type: AspectType.METHOD })
    }

    // override

    invoke(invocation: Invocation): any {
        return (invocation.result = this.func.apply(invocation.target, invocation.args))
    }
}
