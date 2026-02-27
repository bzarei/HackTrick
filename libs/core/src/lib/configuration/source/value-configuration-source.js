/**
 * <code>ValueConfigurationSource</code> is a simple source given a static value.
 */
export class ValueConfigurationSource {
    value;
    /**
     * create a new <code>ValueConfigurationSource</code>
     * @param value the value object
     */
    constructor(value) {
        this.value = value;
    }
    // implement
    load() {
        return Promise.resolve(this.value);
    }
}
//# sourceMappingURL=value-configuration-source.js.map