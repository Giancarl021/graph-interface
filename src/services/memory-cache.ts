import { CacheService } from '../interfaces';

interface MemoryCacheItem {
    expiration: Date;
    value: any;
}

interface MemoryCacheItems {
    [key: string]: MemoryCacheItem;
}

function MemoryCache(
    defaultExpirationTimeSpan?: number
): Exclude<CacheService, null> {
    const _defaultExpirationTimeSpan = defaultExpirationTimeSpan ?? 3600;

    const values: MemoryCacheItems = {};

    async function get<T>(key: string): Promise<T> {
        if (!(await has(key))) throw new Error('Cache item not found');

        const item = values[key];

        return item.value as T;
    }

    async function set<T>(
        key: string,
        value: T,
        expiresIn?: number
    ): Promise<void> {
        expiresIn = expiresIn ?? _defaultExpirationTimeSpan;

        const expiration = new Date(Date.now());
        expiration.setSeconds(expiration.getSeconds() + expiresIn);

        values[key] = {
            expiration,
            value
        };

        await Promise.resolve();
    }

    async function expire(key: string): Promise<void> {
        delete values[key];
        await Promise.resolve();
    }

    async function has(key: string): Promise<boolean> {
        if (!values.hasOwnProperty(key)) return false;

        if (Date.now() >= values[key].expiration.getTime()) {
            await expire(key);
            return false;
        }

        return true;
    }

    return {
        get,
        set,
        expire,
        has
    };
}

export default MemoryCache;
