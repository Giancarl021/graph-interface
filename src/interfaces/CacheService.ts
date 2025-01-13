/**
 * CacheService interface, that defines the methods to interact with a cache service
 */
interface CacheService {
    /**
     * Get a value from the cache
     * @param key The key of the desired value
     * @returns The value of the key
     * @throws If the key is not found
     */
    get<T>(key: string): Promise<T>;
    /**
     * Set a new value in the cache, optionally with an expiration time
     * @param key The key of the value
     * @param value The value to store
     * @param expiration The expiration time of the value in seconds, optional
     * @returns A promise that resolves when the value is stored
     */
    set<T>(key: string, value: T, expiration?: number): Promise<void>;
    /**
     * Expire a value from the cache
     * @param key The key of the value to expire
     * @returns A promise that resolves when the value is expired
     */
    expire(key: string): Promise<void>;
    /**
     * Check if a key exists in the cache
     * @param key The key to check
     * @returns A promise that resolves with a boolean indicating if the key exists
     */
    has(key: string): Promise<boolean>;
}

export default CacheService;
