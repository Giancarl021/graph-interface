import Nullable from './util/Nullable';

type CacheGet = <T>(key: string) => Promise<T>;
type CacheSet = <T>(key: string, value: T, expiration?: number) => Promise<void>;
type CacheExpire = (key: string) => Promise<void>;
type CacheHas = (key: string) => Promise<boolean>;

interface CacheService {
    get: CacheGet;
    set: CacheSet;
    expire: CacheExpire;
    has: CacheHas;
}

export default CacheService;