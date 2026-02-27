/**
 * simple generic lru cache for string keys.
 */
export class LRUCache {
    maxEntries;
    // instance data
    values = new Map();
    // constructor
    /**
     * create a new <code>LRUCache</code>
     * @param maxEntries the maximum number of entries.
     */
    constructor(maxEntries = 20) {
        this.maxEntries = maxEntries;
    }
    // public
    /**
     * get the stored value for the key.
     * @param key the key
     */
    get(key) {
        const hasKey = this.values.has(key);
        let entry = undefined;
        if (hasKey) {
            // peek the entry, re-insert for LRU strategy
            entry = this.values.get(key);
            this.values.delete(key);
            this.values.set(key, entry);
        }
        return entry;
    }
    /**
     * store the value under the key
     * @param key the key
     * @param value the value
     */
    put(key, value) {
        if (this.values.size >= this.maxEntries) {
            // least-recently used cache eviction strategy
            const keyToDelete = this.values.keys().next().value;
            this.values.delete(keyToDelete);
        }
        this.values.set(key, value);
        return value;
    }
}
//# sourceMappingURL=LRUCache.js.map