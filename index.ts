import fillObject from 'fill-object';
import chunk from 'callback-chunk';
import hashObject from './src/util/hashObject.js';
import constants from './src/util/constants.js';

import type GraphInterfaceAccessTokenResponse from './src/interfaces/GraphInterfaceAccessTokenResponse.js';
import type GraphInterfaceAuthenticationProvider from './src/interfaces/GraphInterfaceAuthenticationProvider.js';
import type GraphInterfaceCacheService from './src/interfaces/GraphInterfaceCacheService.js';
import type GraphInterfaceCredentials from './src/interfaces/GraphInterfaceCredentials.js';
import type GraphInterfaceLogger from './src/interfaces/GraphInterfaceLogger.js';
import type GraphInterfaceOptions from './src/interfaces/GraphInterfaceOptions.js';
import type { FilledGraphInterfaceOptions } from './src/interfaces/GraphInterfaceOptions.js';
import type GraphInterfaceTokenOptions from './src/interfaces/GraphInterfaceTokenOptions.js';

type GraphInterfaceClient = ReturnType<typeof GraphInterface>;

export default function GraphInterface(
    credentials: GraphInterfaceCredentials,
    options: GraphInterfaceOptions = {}
) {
    const _options: FilledGraphInterfaceOptions = fillObject(
        options,
        constants.defaultOptions.main
    );

    const _log: GraphInterfaceLogger =
        _options.logger?.bind(_options) ?? (() => {});

    const tokenKey = `GRAPH_INTERFACE::INTERNAL::${hashObject(credentials)}/ACCESS_TOKEN`;
    const endpoint = `${constants.endpoints.baseUrl}/${_options.version}`;
    const batchEndpoint = `${endpoint}/${constants.endpoints.batchResource}`;

    if (options.cacheService === null) {
        _options.cacheService = null;
        _options.cacheAccessTokenByDefault = false;
    }

    async function getAccessToken(options?: GraphInterfaceTokenOptions) {
        const tokenOptions = options ?? constants.defaultOptions.token;
        if (tokenOptions.useCache) {
            _assertCacheService();

            if (await _options.cacheService!.has(tokenKey)) {
                _log('Returning cached access token');

                return (
                    await _options.cacheService!.get<GraphInterfaceAccessTokenResponse>(
                        tokenKey
                    )
                ).accessToken;
            }
        }

        if (_options.authenticationProvider) {
            _log('Retrieving access token from custom authentication provider');

            const customToken =
                await _options.authenticationProvider(credentials);

            if (tokenOptions.useCache) {
                _assertCacheService();

                _log('Caching custom access token');

                await _options.cacheService!.set(
                    tokenKey,
                    customToken,
                    customToken.expiresIn * 1000
                );
            }

            _log('Returning access token from custom authentication provider');

            return customToken.accessToken;
        }

        const body = new URLSearchParams({
            client_id: credentials.clientId,
            client_secret: credentials.clientSecret,
            scope: constants.authentication.scope,
            grant_type: constants.authentication.grantType
        });

        _log('Requesting new access token');

        const response = await fetch(
            `https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body.toString()
            }
        );

        await _catchResponse(response);

        const token =
            (await response.json()) as GraphInterfaceAccessTokenResponse;

        if (tokenOptions.useCache) {
            _assertCacheService();

            _log('Caching access token');

            await _options.cacheService!.set(
                tokenKey,
                token,
                token.expiresIn * 1000
            );
        }

        _log('Returning access token');
        return token.accessToken;
    }

    function _assertCacheService() {
        if (!_options.cacheService)
            throw new Error(
                'No cache service provided while attempting to access it'
            );
    }

    async function _catchResponse(response: Response) {
        if (response.ok) return;

        _log('Failed to complete request');

        let responseString: string;

        try {
            responseString = await response.clone().text();
        } catch {
            responseString = '(no body)';
        }

        throw new Error(
            `Failed to complete request with Error ${response.status} - ${response.statusText}: ${responseString}`
        );
    }

    return {
        getAccessToken,
        
    }
}

export type {
    GraphInterfaceAccessTokenResponse,
    GraphInterfaceAuthenticationProvider,
    GraphInterfaceCacheService,
    GraphInterfaceCredentials,
    GraphInterfaceLogger,
    GraphInterfaceOptions,
    GraphInterfaceTokenOptions,
    GraphInterfaceClient
};
