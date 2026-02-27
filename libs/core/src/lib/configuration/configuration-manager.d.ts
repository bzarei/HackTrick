import { ConfigurationSource } from "./configuration-source";
/**
 * <code>ConfigurationManager</code> is a main class that fetches and organizes configuration values that are fetched by so called
 * <code>ConfigurationSource</code> objects during application startup
 */
export declare class ConfigurationManager {
    private static This;
    /**
     * return the singleton instance.
     */
    static getSingleton(): ConfigurationManager;
    private readonly sources;
    private values;
    /**
     * create a new <code>ConfigurationManager</code> given a list of sources that will contribute values
     * @param sources list of <code>ConfigurationSource</code>'s
     */
    constructor(...sources: ConfigurationSource[]);
    /**
     * add a new <code>ConfigurationSource</code> as a source for configuration values
     * @param source the source
     */
    addSource(source: ConfigurationSource): ConfigurationManager;
    private loadSource;
    private addValues;
    /**
     * load all registered sources.
     */
    load(): Promise<any>;
    /**
     * get a configuration value
     * @param key the key
     * @param defaultValue possible default value, if the value is not known
     */
    get<T>(key: string, defaultValue?: T | undefined): T | undefined;
}
//# sourceMappingURL=configuration-manager.d.ts.map