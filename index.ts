import axios, { AxiosResponse, AxiosError } from 'axios';
import fill from 'fill-object';
import { AuthenticationProvider, CacheService, Logger, AccessTokenResponse, KeyMapper } from './src/interfaces';
import formBody from './src/services/form-body';
import Constants from './src/util/constants';

const TOKEN_CACHE_KEY = 'INTERNAL::TOKEN_CACHE_KEY';
const BATCH_REQUEST_SIZE = 20;

interface Credentials {
    clientId: string;
    clientSecret: string;
    tenantId: string;
}

interface Options {
    version: string;
    logger?: Logger;
    authenticationProvider?: AuthenticationProvider;
    cacheService?: CacheService;
    cacheAccessTokenByDefault: boolean;
}

interface Response {
    [key: string]: any;
}

interface TokenOptions {
    useCache: boolean;
}

type GraphOptions = Partial<Options>;
type GraphTokenOptions = Partial<TokenOptions>;

export default function (credentials: Credentials, options?: GraphOptions) {
    const _options: Options = fill(options ?? {}, Constants.options.main) as Options;
    const endpoint = `https://graph.microsoft.com/${_options.version}`;
    const batchEndpoint = `${endpoint}/$batch`;

    if (_options.cacheService === undefined) {
        _options.cacheAccessTokenByDefault = false;
    }

    async function getAccessToken(options?: GraphTokenOptions): Promise<string> {
        const opt = fill(options ?? {}, { useCache: _options.cacheAccessTokenByDefault }) as TokenOptions;

        if (opt.useCache) {
            const cache = getCacheService();
            if (await cache.has(TOKEN_CACHE_KEY)) {
                await log('Returning cached access token');
                return (await cache.get<AccessTokenResponse>(TOKEN_CACHE_KEY)).accessToken;
            }
        }

        if (_options.authenticationProvider !== undefined) {
            await log('Retrieving access token from custom authentication provider');

            const token = await _options.authenticationProvider(credentials);

            if (opt.useCache) {
                const cache = getCacheService();
                await log('Caching access token');
                await cache.set(TOKEN_CACHE_KEY, token, token.expiresIn);
            }

            await log('Returning access token from custom authentication provider');

            return token.accessToken;
        }
        
        await log('Requesting new access token');

        let response: AxiosResponse<Response>;

        try {
            response = await axios.post(`https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`, formBody({
                client_id: credentials.clientId,
                client_secret: credentials.clientSecret,
                grant_type: 'client_credentials',
                scope: 'https://graph.microsoft.com/.default'
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
        } catch (_err) {
            const err = _err as AxiosError;

            if (err.response?.data) {
                throw new Error(`Failed to request access token: ${err.response.status} - ${err.response.statusText}\n${typeof err.response.data === 'object' ? JSON.stringify(err.response.data, null, 2) : err.response.data}`);
            }

            if (err.response) {
                throw new Error(`Failed to request access token: ${err.response?.status} - ${err.response?.statusText}`);
            }

            throw new Error(`Failed to request access token: ${err.message}`);
        }

        const token = mapResponse<AccessTokenResponse>(response.data, Constants.keyMappers.accessToken);

        if (opt.useCache) {
            const cache = getCacheService();

            await log('Caching access token');
            await cache.set(TOKEN_CACHE_KEY, token, token.expiresIn);
        }

        return token.accessToken;
    }

    function mapResponse<T>(response: Response, keyMapper: KeyMapper): T {
        const result: Response = {};

        if (typeof response !== 'object') throw new Error('Response is not an object');

        for (const key in keyMapper) {
            const originalKey = keyMapper[key];

            if (response.hasOwnProperty(originalKey)) result[key] = response[originalKey];
        }

        return result as T;
    }

    function getCacheService(): CacheService {
        if (_options.cacheService === undefined) throw new Error('Cache service is not defined');

        return _options.cacheService;
    }
    
    async function log(message: string) : Promise<void> {
        if (_options.logger !== undefined) await _options.logger(message);
    }


    return {
        getAccessToken
    };
}

export {
    AuthenticationProvider,
    CacheService,
    Logger,
    Credentials,
    AccessTokenResponse,
    Options,
    TokenOptions,
    GraphOptions
}