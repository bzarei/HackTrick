import { AspectConfig } from "../aspect-config"
import { AspectManager } from "../aspect-manager"
import { AroundAspect, BeforeAfterAspect } from "../aspect/"
import { AspectType } from "../aspect-type.enum"

/**
 * any method decorated with this decorator can be used as aspects for the specified target methods.
 * Available aspects are
 * <ul>
 *     <li>before: called sequentially before all other aspects including the original method</li>
 *     <li>after: called sequentially after all other aspects including the original method</li>
 *     <li>around: called after all before aspects and before all after aspects. Around advices are chained by calling proceed() ond the invocation object,
 *     will invoke either the next around aspect or finally the original method</li>
 *     <li>error: called in case of caught exceptions</li>
 * </ul>
 * @param config the specification of the methods which should integrate this method as an aspect
 */
export function aspect(config: AspectConfig): any {
    return (target: any, property: string, descriptor: PropertyDescriptor) => {
        if (config.type === AspectType.AROUND)
            AspectManager.registerAspect(new AroundAspect(target.constructor, descriptor.value, config))
        else AspectManager.registerAspect(new BeforeAfterAspect(target.constructor, descriptor.value, config))
    }
}
