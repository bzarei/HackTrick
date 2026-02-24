import { AspectTarget } from "../aspect-target"
import { AspectConfig } from "../aspect-config"
import { AspectManager } from "../aspect-manager"
import { AspectType } from "../aspect-type.enum"
import { AroundAspect } from "../aspect/"

/**
 * any method decorated with this decorator will act as an around aspect for the specified target methods.
 * "Around" methods will be executed after all before aspects and before the after methods
 * An around aspect needs to declare single {@link Invocation} argument. Within the method a call to <code>proceed()</code>
 * of the current invocation will call the next around aspect and finally the original method.
 * Since around methods could need to follow  specific order, the <code>order</code> property of the configuration aspect is used to sort
 * different around aspects. Sxmaller order come first.
 * @param config the specification of the methods which should integrate this method as an aspect
 */
export function around(config: AspectTarget | AspectConfig): any {
    return (target: any, property: string, descriptor: PropertyDescriptor) => {
        if (config instanceof AspectTarget) {
            AspectManager.registerAspect(
                new AroundAspect(target.constructor, descriptor.value, {
                    type: AspectType.AROUND,
                    target: config,
                })
            )
        } else {
            AspectManager.registerAspect(new AroundAspect(target.constructor, descriptor.value, config))
        }
    }
}
