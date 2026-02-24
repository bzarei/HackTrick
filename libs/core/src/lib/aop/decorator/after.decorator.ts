import { AspectTarget } from "../aspect-target"
import { AspectConfig } from "../aspect-config"
import { AspectManager } from "../aspect-manager"
import { BeforeAfterAspect } from "../aspect/"
import { AspectType } from "../aspect-type.enum"

/**
 * any method decorated with this decorator will act as an after aspect for the specified target methods.
 * "After" methods will be executed after all other - before and around - aspects including the original
 * method for both successful executions as well as error cases.
 * An after aspect needs to declare single {@link Invocation} argument
 * @param config the specification of the methods which should integrate this method as an aspect
 */
export function after(config: AspectTarget | AspectConfig): any {
    return (target: any, property: string, descriptor: PropertyDescriptor) => {
        if (config instanceof AspectTarget) {
            AspectManager.registerAspect(
                new BeforeAfterAspect(target.constructor, descriptor.value, {
                    type: AspectType.AFTER,
                    target: config,
                })
            )
        } else {
            AspectManager.registerAspect(new BeforeAfterAspect(target.constructor, descriptor.value, config))
        }
    }
}
