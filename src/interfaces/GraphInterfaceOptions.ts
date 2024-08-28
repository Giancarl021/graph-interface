import type GraphInterfaceAuthenticationProvider from './GraphInterfaceAuthenticationProvider.js';
import type GraphInterfaceCacheService from './GraphInterfaceCacheService.js';
import type GraphInterfaceLogger from './GraphInterfaceLogger.js';

/**
 * Options for an GraphInterface client.
 * It allows to set the client behavior, such
 * as custom version and authentication method.
 */
interface GraphInterfaceOptions {
    /**
     * The version of the Graph API to use.
     * Can be `v1.0` or `beta`. The default is `v1.0`.
     */
    version?: 'v1.0' | 'beta';
    /**
     * The authentication provider to use to get access tokens.
     * If not provided, the client will use the credentials
     * provided to authenticate using the
     * [client credentials flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow).
     */
    authenticationProvider?: GraphInterfaceAuthenticationProvider;
    /**
     * A logger function to log messages of the client.
     * If no provided no messages will be logged.
     */
    logger?: GraphInterfaceLogger;
    /**
     * A cache service to store access tokens and other
     * data to avoid making unnecessary requests to the Graph API.
     * If not provided, the client will use the [`GraphInterfaceMemoryCache`](../services/GraphInterfaceMemoryCache.ts) service.
     * If set to `null`, the client will not use any cache service, and `cacheAccessTokenByDefault` will be set to `false`.
     */
    cacheService?: GraphInterfaceCacheService | null;
    /**
     * If true, the client will cache the access token by default.
     * It can be overridden in each manual request to an access token.
     * By default it's `true`.
     */
    cacheAccessTokenByDefault?: boolean;
}

export type FilledGraphInterfaceOptions = Required<
    Omit<GraphInterfaceOptions, 'authenticationProvider' | 'logger'>
> & {
    authenticationProvider: GraphInterfaceAuthenticationProvider | null;
    logger: GraphInterfaceLogger | null;
};

export default GraphInterfaceOptions;
