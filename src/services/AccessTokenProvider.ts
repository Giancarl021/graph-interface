import NullCacheService from './NullCacheService.js';
import AuthenticationRequestFailedError from '../errors/AuthenticationRequestFailedError.js';
import getResponseBody from '../util/getResponseBody.js';

import type AuthenticationProviderFactory from '../interfaces/AuthenticationProviderFactory.js';
import type CacheService from '../interfaces/CacheService.js';
import type AccessTokenResponse from '../interfaces/AccessTokenResponse.js';

export type AccessTokenProviderInstance = ReturnType<
    typeof AccessTokenProvider
>;

interface Options {
    /**
     * The base URL for the API to be accessed.
     */
    apiUrl: string;
    /**
     * Whether to use caching for access tokens.
     */
    useCache: boolean;
    /**
     * The cache service to be used if caching is enabled.
     */
    cacheService: CacheService;
    /**
     * The factory function to create an authentication provider.
     */
    authenticationProviderFactory: AuthenticationProviderFactory;
}

/**
 * Creates an access token provider that fetches and caches access tokens.
 * The provider uses the given authentication provider factory to create
 * an authentication provider, which is then used to obtain access tokens.
 * @param options Configuration options for the access token provider.
 * @returns An object with a method to get the access token.
 */
export default function AccessTokenProvider(options: Options) {
    const authProvider = options.authenticationProviderFactory(
        options.apiUrl,
        options.useCache ? options.cacheService : NullCacheService()
    );

    const cacheKey = authProvider.getCredentialsHash();

    /**
     * Retrieves an access token, using the cache if enabled and available.
     * @returns A promise that resolves to the access token string.
     * @throws {AuthenticationRequestFailedError} if the authentication request fails
     * or the response is invalid.
     */
    async function getAccessToken(): Promise<string> {
        if (options.useCache && (await options.cacheService.has(cacheKey))) {
            return await options.cacheService.get<string>(cacheKey);
        }

        const authRequest = authProvider.getAuthenticationRequest();
        const response = await fetch(authRequest);

        if (!response.ok) {
            throw new AuthenticationRequestFailedError(
                response,
                await getResponseBody(response)
            );
        }

        const data = (await response.json()) as AccessTokenResponse;

        if (
            !('access_token' in data) ||
            typeof data.access_token !== 'string' ||
            data.access_token.length === 0
        ) {
            throw new AuthenticationRequestFailedError(
                response,
                await getResponseBody(response),
                "Invalid access token response: missing or invalid 'access_token' property"
            );
        }

        if (!('expires_in' in data) || typeof data.expires_in !== 'number') {
            throw new AuthenticationRequestFailedError(
                response,
                await getResponseBody(response),
                "Invalid access token response: missing or invalid 'expires_in' property"
            );
        }

        if (options.useCache) {
            await options.cacheService.set(
                cacheKey,
                data.access_token,
                data.expires_in
            );
        }

        return data.access_token;
    }

    return {
        /**
         * Retrieves an access token, using the cache if enabled and available.
         * @returns A promise that resolves to the access token string.
         * @throws {AuthenticationRequestFailedError} if the authentication request fails
         * or the response is invalid.
         */
        getAccessToken
    };
}
