import type AuthenticationProvider from '../AuthenticationProvider';
import type CacheService from '../CacheService';
import type Logger from '../Logger';

/**
 * Options to create a GraphInterface instance
 */
interface GraphOptions {
    /**
     * The version of the Graph API to use, either `v1.0` or `beta`
     */
    version: 'v1.0' | 'beta';
    /**
     * The logger to use for logging internal operations. Useful for debugging
     */
    logger?: Logger;
    /**
     * The authentication provider to use to authenticate requests. Useful when needed a custom authentication process,
     * such as with oAuth 2.0 user-flow authentication. By default it authenticates using an oAuth 2.0 client credentials flow
     */
    authenticationProvider?: AuthenticationProvider;
    /**
     * The cache service to use to cache access tokens and other data. By default it uses an in-memory cache service
     */
    cacheService?: CacheService;
    /**
     * Whether to cache the access token by default. If set to `true`, it will cache the access token by default to reuse in
     * subsequent requests. If set to `false`, it will not cache the access token by default and will request a new one for
     * each request
     */
    cacheAccessTokenByDefault: boolean;
}

export default GraphOptions;
