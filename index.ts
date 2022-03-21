import { CacheService, AccessTokenResponse, KeyMapper, HttpHeaders, Credentials, GraphOptions, TokenOptions, UnitOptions, ListOptions } from './src/interfaces';
import Nullable from './src/interfaces/util/Nullable';
import axios, { AxiosResponse, AxiosError, Method, AxiosRequestConfig } from 'axios';
import fill from 'fill-object';
import isAbsoluteUrl from './src/lib/is-absolute-url';
import formBody from './src/services/form-body';
import Constants from './src/util/constants';
import hashRequest from './src/services/request-hasher';

const TOKEN_CACHE_KEY = 'INTERNAL::TOKEN_CACHE_KEY';
const BATCH_REQUEST_SIZE = 20;

interface Response {
    [key: string]: any;
}

interface ListResponse<T> {
    '@odata.context': string;
    '@odata.nextLink'?: string;
    value: T[];
}

export = function GraphInterface(credentials: Credentials, options?: Partial<GraphOptions>) {
    const _options = fill(options ?? {}, Constants.options.main) as GraphOptions;
    const endpoint = `https://graph.microsoft.com/${_options.version}`;
    const batchEndpoint = `${endpoint}/$batch`;

    if (_options.cacheService === undefined) {
        _options.cacheAccessTokenByDefault = false;
    }

    async function getAccessToken(options?: Partial<TokenOptions>): Promise<string> {
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

        const requestOptions: AxiosRequestConfig = {
            url: `https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: formBody({
                client_id: credentials.clientId,
                client_secret: credentials.clientSecret,
                grant_type: 'client_credentials',
                scope: 'https://graph.microsoft.com/.default'
            })
        };

        const token = await request<AccessTokenResponse>(requestOptions, Constants.keyMappers.accessToken);

        if (opt.useCache) {
            const cache = getCacheService();

            await log('Caching access token');
            await cache.set(TOKEN_CACHE_KEY, token, token.expiresIn);
        }

        await log('Returning access token');
        return token.accessToken;
    }

    async function unit<T>(resource: string, options?: Partial<UnitOptions>): Promise<T> {
        checkResource(resource);

        const opt = fill(options ?? {}, Constants.options.unit) as UnitOptions;
        const hash: string = opt.useCache ? hashRequest(resource, opt) : '';

        if (opt.useCache) {
            const cache = getCacheService();

            if (await cache.has(hash)) {
                await log('Returning cached unit response');
                return (await cache.get<T>(hash));
            }
        }

        if (!isAbsoluteUrl(resource)) {
            resource = `${endpoint}${resource.startsWith('/') ? resource : `/${resource}`}`;
        }

        const headers: HttpHeaders = {};

        const token = await getAccessToken();

        headers['Authorization'] = `Bearer ${token}`;

        for (const header in opt.headers) {
            headers[header] = opt.headers[header];
        }

        const requestConfig: AxiosRequestConfig<Response> = {
            headers,
            url: resource,
            method: opt.method as Method,
            data: opt.body
        };

        await log('Sending unit request');
        const result: T = await request<T>(requestConfig, opt.keyMapper);

        if (opt.useCache) {
            const cache = getCacheService();
            await log('Caching unit response');
            await cache.set(hash, result);
        }

        await log('Returning unit response');
        return result;
    }

    async function list<T>(resource: string, options?: Partial<ListOptions>): Promise<T[]> {
        checkResource(resource);

        const opt = fill(options ?? {}, Constants.options.list) as ListOptions;

        if (opt.limit === 0) {
            return [];
        }

        const hash: string = opt.useCache ? hashRequest(resource, opt) : '';

        if (opt.useCache) {
            const cache = getCacheService();

            if (await cache.has(hash)) {
                await log('Returning cached list response');
                return (await cache.get<T[]>(hash));
            }
        }

        const unitOptions = decayOptions();
        const offset = opt.offset ?? 0;
        const result: T[] = [];

        let response: ListResponse<T>;
        let index = 0;
        let nextUri: string = resource;
        const hasFinished = (index: number) => {
            if (!opt.limit) return false;

            return ((index - offset) === (opt.limit ?? 0))
        };

        do {
            response = await unit<ListResponse<T>>(nextUri, unitOptions);

            if (index >= offset) result.push(...response.value);

            nextUri = response['@odata.nextLink'] ?? '';
            index++;
        } while (Boolean(nextUri) && !hasFinished(index));

        if (opt.useCache) {
            const cache = getCacheService();

            await log('Caching list response');
            await cache.set(hash, result);
        }

        await log('Returning list response');
        return result;

        function decayOptions(): UnitOptions {
            return {
                body: opt.body,
                headers: opt.headers,
                keyMapper: opt.keyMapper,
                method: opt.method,
                useCache: false
            };
        }
    }

    async function massive<T>(resourcePattern: string): Promise<{ [binder: string]: T }> {
        throw new Error('Not implemented');
    }

    async function request<T>(options: AxiosRequestConfig<Response>, keyMapper?: Nullable<KeyMapper>): Promise<T> {
        let response: AxiosResponse<Response>;
        try {
            response = await axios(options);
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

        if (!keyMapper) return response.data as T;

        if (typeof response.data !== 'object') throw new Error('Response data is not an object');

        const result = map(response.data, keyMapper);

        return result as T;

        function map(object: Response, mapper: KeyMapper): Response {
            const result: Response = {};
            for (const key in mapper) {
                const mapping = mapper[key];

                if (object.hasOwnProperty(key)) {
                    if (typeof mapping === 'object') {
                        result[mapping.name] = map(object[key], mapping.value);
                    } else {
                        result[mapping] = object[key];
                    }
                }
            }

            return result;
        }
    }

    function getCacheService(): CacheService {
        if (_options.cacheService === undefined) throw new Error('Cache service is not defined');

        return _options.cacheService;
    }

    async function log(message: string): Promise<void> {
        if (_options.logger !== undefined) await _options.logger(message);
    }

    function checkResource(resource: string) {
        if (!resource || resource.trim() === '') throw new Error('Resource cannot be empty');
    }

    return {
        getAccessToken,
        unit,
        list,
        massive
    };
}