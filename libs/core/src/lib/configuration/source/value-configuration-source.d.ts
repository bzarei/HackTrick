import { ConfigurationSource } from "../configuration-source";
/**
 * <code>ValueConfigurationSource</code> is a simple source given a static value.
 */
export declare class ValueConfigurationSource implements ConfigurationSource {
    private value;
    /**
     * create a new <code>ValueConfigurationSource</code>
     * @param value the value object
     */
    constructor(value: any);
    load(): Promise<any>;
}
//# sourceMappingURL=value-configuration-source.d.ts.map