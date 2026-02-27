/**
 * simple generic lru cache for string keys.
 */
export declare class LRUCache<T> {
    private maxEntries;
    private values;
    /**
     * create a new <code>LRUCache</code>
     * @param maxEntries the maximum number of entries.
     */
    constructor(maxEntries?: number);
    /**
     * get the stored value for the key.
     * @param key the key
     */
    get(key: string): T | undefined;
    /**
     * store the value under the key
     * @param key the key
     * @param value the value
     */
    put(key: string, value: T): T;
}
//# sourceMappingURL=LRUCache.d.ts.map