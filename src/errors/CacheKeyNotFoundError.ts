/**
 * Error thrown when a cache key is not found.
 */
export default class CacheKeyNotFoundError extends Error {
    /**
     * The key that was not found.
     */
    #key: string;
    /**
     * Creates a new CacheKeyNotFoundError.
     * @param key The key that was not found.
     */
    constructor(key: string) {
        super(`Cache key not found: ${key}`);
        this.name = 'CacheKeyNotFoundError';
        this.#key = key;
    }

    /**
     * The key that was not found.
     */
    get key() {
        return this.#key;
    }
}
