import { AspectTarget } from "../aspect-target"
import { AspectConfig } from "../aspect-config"
import { AspectManager } from "../aspect-manager"
import { BeforeAfterAspect } from "../aspect/"
import { AspectType } from "../aspect-type.enum"

/**
 * any method decorated with this decorator will act as an before aspect for the specified target methods.
 * "Before" methods will be executed before all other - around and after - aspects including the original
 * method for both successful executions as well as error cases.
 * A before aspect needs to declare single {@link Invocation} argument
 * @param config the specification of the methods which should integrate this method as an aspect
 */
export function before(config: AspectTarget | AspectConfig): any {
    return (target: any, property: string, descriptor: PropertyDescriptor) => {
        if (config instanceof AspectTarget) {
            const aspectTarget = config as AspectTarget

            AspectManager.registerAspect(
                new BeforeAfterAspect(target.constructor, descriptor.value, {
                    type: AspectType.BEFORE,
                    target: aspectTarget,
                })
            )
        } else {
            AspectManager.registerAspect(new BeforeAfterAspect(target.constructor, descriptor.value, config))
        }
    }
}
