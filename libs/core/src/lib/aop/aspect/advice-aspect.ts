import { Invocation } from "../invocation"
import { Aspect, AspectFunc } from "../aspect"
import { AspectConfig } from "../aspect-config"

export abstract class AdviceAspect extends Aspect {
    // instance data

    adviceInstance: any

    // constructor

    protected constructor(constructorFunction: any, func: AspectFunc, config: AspectConfig) {
        super(func, config)

        this.adviceInstance = constructorFunction
    }

    // protected

    withInstance(instance: any) {
       // shallow clone: preserve all properties from the subclass

       const clone = Object.create(Object.getPrototypeOf(this)) as this;
       Object.assign(clone, this);

       // replace

       clone.adviceInstance = instance;

       // done

       return clone;
    }

    // override Aspect

    invoke(invocation: Invocation): any {
        return this.func.apply(this.adviceInstance, [invocation])
    }
}
