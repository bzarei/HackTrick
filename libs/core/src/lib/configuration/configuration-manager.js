/**
 * <code>ConfigurationManager</code> is a main class that fetches and organizes configuration values that are fetched by so called
 * <code>ConfigurationSource</code> objects during application startup
 */
export class ConfigurationManager {
    // static data
    static This;
    // static methods
    /**
     * return the singleton instance.
     */
    static getSingleton() {
        return ConfigurationManager.This;
    }
    // instance data
    sources = [];
    values = {};
    // constructor
    /**
     * create a new <code>ConfigurationManager</code> given a list of sources that will contribute values
     * @param sources list of <code>ConfigurationSource</code>'s
     */
    constructor(...sources) {
        this.sources = sources;
        ConfigurationManager.This = this;
    }
    // public
    /**
     * add a new <code>ConfigurationSource</code> as a source for configuration values
     * @param source the source
     */
    addSource(source) {
        this.sources.push(source);
        return this;
    }
    async loadSource(source) {
        const values = await source.load();
        this.addValues(values);
    }
    addValues(values) {
        const isObject = (value) => {
            return typeof value === "object";
        };
        const merge = (values, target, path) => {
            for (const property of Object.getOwnPropertyNames(values)) {
                const value = values[property];
                if (isObject(value)) {
                    if (target[property])
                        merge(value, target[property], [...path, property]);
                    else
                        target[property] = value;
                }
                else {
                    //if (target[property]) console.log("override " + [...path, property].join(".")) // TODO
                    target[property] = value;
                }
            }
        };
        merge(values, this.values, []);
    }
    // administration
    /**
     * load all registered sources.
     */
    async load() {
        for (const source of this.sources)
            await this.loadSource(source);
        return this.values;
    }
    // public
    /**
     * get a configuration value
     * @param key the key
     * @param defaultValue possible default value, if the value is not known
     */
    get(key, defaultValue = undefined) {
        const path = key.split(".");
        let index = 0;
        const length = path.length;
        let object = this.values;
        while (object != null && index < length)
            object = Reflect.get(object, path[index++]);
        return index && index == length ? object : defaultValue;
    }
}
//# sourceMappingURL=configuration-manager.js.map