import type CacheService from '../interfaces/CacheService.js';

export type AccessTokenProviderInstance = ReturnType<
    typeof AccessTokenProvider
>;

interface Options {
    useCache: boolean;
    cacheService: CacheService;
}

export default function AccessTokenProvider(options: Options) {
    async function getAccessToken(): Promise<string> {}

    return {
        getAccessToken
    };
}
