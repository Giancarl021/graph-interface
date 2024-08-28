/**
 * A Cache Service interface to store data during the client
 * execution to avoid making unnecessary requests to the Graph API.
 * It's recommended to use in-memory strategies to store the data,
 * considering the data will be read frequently and does not need to
 * be persisted.
 */
interface GraphInterfaceCacheService {
    /**
     * Manually expire a entry in the cache service.
     * @param key The key of the item to be expired.
     * @returns A Promise that resolves when the item is expired. It will
     * reject if the item does not exist.
     */
    expire: (key: string) => Promise<void>;
    /**
     * Check if a key exists in the cache service.
     * @param key The key of the item to check.
     * @returns A promise that resolves to `true` if the key exists
     * or `false` if it does not.
     */
    has: (key: string) => Promise<boolean>;
    /**
     * Get a value from the cache service.
     * @param key The key of the item to get.
     * @typeparam T The type of the value to get.
     * @returns A promise that resolves to the value of the key.
     * It must reject if the item does not exist.
     */
    get: <T>(key: string) => Promise<T>;
    /**
     * Set a value in the cache service.
     * @param key The key of the item to set.
     * @param value The value to set.
     * @param expiration The time in **milliseconds** to expire the item.
     * @typeparam T The type of the value to set.
     * @returns A promise that resolves when the item is set.
     */
    set: <T>(key: string, value: T, expiresIn: number) => Promise<void>;
}

export default GraphInterfaceCacheService;
