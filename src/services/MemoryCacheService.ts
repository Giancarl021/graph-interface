import CacheKeyNotFoundError from '../errors/CacheKeyNotFoundError.js';
import type CacheService from '../interfaces/CacheService.js';

interface CacheEntry {
    value: unknown;
    expiresOn: Date;
}

export default function MemoryCacheService(): CacheService {
    const store = new Map<string, CacheEntry>();

    function expire(key: string): void {
        store.delete(key);
    }

    function has(key: string): boolean {
        if (!store.has(key)) return false;

        const entry = store.get(key);

        if (!entry) {
            expire(key);
            return false;
        }

        if (entry.expiresOn < new Date()) {
            expire(key);
            return false;
        }

        return true;
    }

    function get<T>(key: string): T {
        if (!has(key)) {
            throw new CacheKeyNotFoundError(key);
        }

        const entry = store.get(key) as CacheEntry;
        return entry.value as T;
    }

    function set(key: string, value: unknown, ttl: number): void {
        const expiresOn = new Date(Date.now() + ttl * 1000);
        store.set(key, { value, expiresOn });
    }

    return {
        expire,
        has,
        get,
        set
    };
}
