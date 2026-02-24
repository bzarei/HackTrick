import { AspectTarget } from "../aspect-target"
import { AspectConfig } from "../aspect-config"
import { AspectManager } from "../aspect-manager"
import { ErrorAspect } from "../aspect/"
import { AspectType } from "../aspect-type.enum"

/**
 * any method decorated with this decorator will act as an error aspect for the specified target methods.
 * "Error" aspects will be executed in case of target methods throwing an error which will be stored in the {@link Invocation} object.
 * An error aspect needs to declare single {@link Invocation} argument
 * @param config the specification of the methods which should integrate this method as an aspect
 */
export function error(config: AspectTarget | AspectConfig): any {
    return (target: any, property: string, descriptor: PropertyDescriptor) => {
        if (config instanceof AspectTarget) {
            AspectManager.registerAspect(
                new ErrorAspect(target.constructor, descriptor.value, {
                    type: AspectType.ERROR,
                    target: config,
                })
            )
        } else {
            AspectManager.registerAspect(new ErrorAspect(target.constructor, descriptor.value, config))
        }
    }
}
