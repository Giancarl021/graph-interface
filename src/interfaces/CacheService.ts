/**
 * Interface for a cache service.
 * This service provides a way to store access tokens
 */
export default interface CacheService {
    /**
     * Retrieves a value from the cache.
     * Must throw if the key does not exist.
     * @param key The key to retrieve.
     * @returns The value associated with the key.
     * @throws {CacheKeyNotFoundError} If the key does not exist.
     */
    get<T>(key: string): T | Promise<T>;
    /**
     * Stores a value in the cache.
     * @param key The key to store.
     * @param value The value to store.
     * @param expiration Optional expiration time in seconds. If not provided, the value
     * will not expire.
     * @returns void or a Promise that resolves to void.
     */
    set<T>(key: string, value: T, expiration?: number): void | Promise<void>;
    /**
     * Explicitly expires a key in the cache, independently of the expiration time.
     * @param key The key to expire.
     * @returns void or a Promise that resolves to void.
     * @throws {CacheKeyNotFoundError} If the key does not exist.
     */
    expire(key: string): void | Promise<void>;
    /**
     * Checks if a key exists in the cache.
     * @param key The key to check.
     * @returns True if the key exists, false otherwise. Can be a Promise that resolves to a boolean.
     */
    has(key: string): boolean | Promise<boolean>;
}
