import type GraphInterfaceCacheService from '../interfaces/GraphInterfaceCacheService.js';

/**
 * Stored item in the memory cache service.
 * It represents a value and the time it expires.
 */
interface MemoryCacheItem {
    value: unknown;
    expiresOn: Date;
}

export default function GraphInterfaceMemoryCache(): GraphInterfaceCacheService {
    const store = new Map<string, MemoryCacheItem>();

    async function expire(key: string) {
        if (!(await has(key)))
            throw new Error(`Key ${key} does not exist in the cache.`);

        store.delete(key);
    }

    async function has(key: string): Promise<boolean> {
        await Promise.resolve();
        const exists = store.has(key);

        if (!exists) return false;

        const now = new Date();
        const item = store.get(key) as MemoryCacheItem;

        if (now >= item.expiresOn) {
            store.delete(key);
            return false;
        }

        return true;
    }

    async function get<T>(key: string): Promise<T> {
        if (!(await has(key)))
            throw new Error(`Key ${key} does not exist in the cache.`);

        const item = store.get(key) as MemoryCacheItem;

        return item.value as T;
    }

    async function set<T>(
        key: string,
        value: T,
        expiresIn: number
    ): Promise<void> {
        await Promise.resolve();
        const now = new Date();
        const expiresOn = new Date(now.getTime() + expiresIn);

        store.set(key, { value, expiresOn });
    }

    return {
        expire,
        has,
        get,
        set
    };
}
