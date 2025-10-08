import type AuthenticationProvider from './AuthenticationProvider.js';
import type CacheService from './CacheService.js';

/**
 * A factory function type for creating AuthenticationProvider instances.
 * The factory takes a CacheService instance as an argument and returns
 * an AuthenticationProvider instance.
 * @param apiUrl The base URL for the API to be accessed.
 * @param cacheService The cache service to be used by the authentication provider.
 * @returns An instance of AuthenticationProvider.
 */
type AuthenticationProviderFactory<Extensions extends Record<any, any> = {}> =
    ((apiUrl: string, cacheService: CacheService) => AuthenticationProvider) &
        Extensions;

export default AuthenticationProviderFactory;
