import CacheKeyNotFoundError from '../errors/CacheKeyNotFoundError.js';
import type CacheService from '../interfaces/CacheService.js';

export default function NullCacheService(): CacheService {
    function _noOp() {}

    function has(key: string) {
        return false;
    }

    function get<T>(key: string): T {
        throw new CacheKeyNotFoundError(key);
    }

    return {
        has,
        get,
        expire: _noOp,
        set: _noOp
    };
}
