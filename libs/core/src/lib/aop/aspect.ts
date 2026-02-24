import { AspectTarget } from "./aspect-target"
import { MethodDescriptor, TypeDescriptor } from "../reflection"
import { Invocation } from "./invocation"
import { AspectType } from "./aspect-type.enum"
import { AspectConfig } from "./aspect-config"
import { Predicate } from "./aspect-manager"
import { AdviceAspect } from "./aspect/"


export type AspectFunc = Function //(...args: any[]) => any;//(joinPoint: JoinPoint) => any;
//type Func = (...args: any[]) => any

export abstract class Aspect {
    // instance data

    type: AspectType
    private targets: AspectTarget | undefined
    order: number
    private readonly enabledIf: string | undefined

    // constructor

    protected constructor(public func: AspectFunc, public config: AspectConfig) {
        this.type = config.type
        this.targets = config.target
        this.order = config.order || 0
        this.enabledIf = config.enabledIf
    }

    // public

    matches(typeDescriptor: TypeDescriptor<any>, method: MethodDescriptor, accept: Predicate): boolean {
        if (this.enabledIf !== undefined && !accept(this.enabledIf!)) return false

        if ( this instanceof AdviceAspect) {
            if ((this as AdviceAspect).adviceInstance === typeDescriptor.type) 
                return false;
        }

        return this.targets?.matchesMethod(typeDescriptor, method) || false
    }

    // abstract

    abstract invoke(invocation: Invocation): any
}
