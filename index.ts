import { CacheService, AccessTokenResponse, KeyMapper, HttpHeaders, Credentials, GraphOptions, TokenOptions, UnitOptions, ListOptions, MassiveOptions, PartialMassiveOptions } from './src/interfaces';
import Nullable from './src/interfaces/util/Nullable';
import axios, { AxiosResponse, AxiosError, Method, AxiosRequestConfig } from 'axios';
import fill from 'fill-object';
import chunk from 'callback-chunk';
import isAbsoluteUrl from './src/lib/is-absolute-url';
import formBody from './src/services/form-body';
import Constants from './src/util/constants';
import hashRequest from './src/services/request-hasher';
import resourceBuilder from './src/services/resource-builder';

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

interface MassiveResult<T> {
    [binder: string]: Nullable<T>;
}

interface IdentifiableUrls {
    [id: string]: string;
}

interface BatchRequestItem {
    url: string;
    method: Method;
    headers: Nullable<HttpHeaders>;
    body: any;
    id: string;
}

interface BatchResponse {
    responses: BatchResponseItem[]
    isSuccessful: boolean;
    rejectedIds: string[]
}

interface BatchResult {
    resolved: BatchResponseItem[];
    rejected: string[];
}

interface BatchResponseItem {
    id: string;
    status: number;
    headers: HttpHeaders;
    body: any;
}

type BatchRequestOptions = AxiosRequestConfig<Response> & Required<Pick<AxiosRequestConfig<Response>, 'headers' | 'url' | 'method'>>
type BatchRequestCallback = () => Promise<BatchResponse>;

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

    async function massive<T>(resourcePattern: string, options: PartialMassiveOptions): Promise<MassiveResult<T>> {
        checkResource(resourcePattern, 'resourcePattern');

        const opt = fill(options, Constants.options.massive) as MassiveOptions;

        validadeOptions(opt);

        const hash: string = opt.useCache ? hashRequest(resourcePattern, opt) : '';

        if (opt.useCache) {
            const cache = getCacheService();

            if (await cache.has(hash)) {
                await log('Returning cached massive response');
                return (await cache.get<{ [ binder: string ]: T }>(hash));
            }
        }

        await log('Generating individual urls');
        const values = normalizeValues(opt.values as Exclude<typeof opt.values, null>);
        let resources = resourceBuilder(resourcePattern, values);
        let l = resources.length;
        const urls: IdentifiableUrls = {};

        const binderList = values[opt.binderIndex];
        const results: MassiveResult<T> = {};
        let attempts = 0;

        await log('Generating individual requests');

        let requests: BatchRequestItem[] = resources.map((resource, index) => ({
            url: resource,
            method: opt.method as Method,
            headers: opt.headers,
            body: opt.body,
            id: binderList[index]
        }));

        requests.forEach(request => urls[request.id] = request.url);

        do {
            await log('Packaging requests into Graph batch requests');
            const packages = pack(requests);

            await log('Sending batch requests');
            const responses = await chunk(packages, opt.requestsPerAttempt);

            await log('Resolving batch responses');
            const result = unpack(responses);

            for (const item of result.resolved) {
                results[item.id] = item.body as T;
            }

            if (resources.length === result.rejected.length) {
                await log('All requests failed');
                attempts++;
            }

            if (attempts >= opt.attempts) {
                await log('Maximum attempts reached, nullifying errors');

                if (!opt.nullifyErrors) throw new Error('Maximum attempts reached');

                for (const item of result.rejected) {
                    results[item] = null;
                }

                break;
            }

            resources = result.rejected;
            l = resources.length;

            if (l > 0) {
                await log('Generating individual requests');
                requests = rebind(resources);
            }
        } while (resources.length > 0);

        if (opt.useCache) {
            const cache = getCacheService();

            await log('Caching massive response');
            await cache.set(hash, results);
        }

        await log('Returning massive response');
        return results;

        function validadeOptions(options: MassiveOptions) {
            if (!options.values) throw new Error('values is required');
            let size: number | null = null;

            for (const item of options.values) {
                if (size === null) {
                    size = item.length;
                    continue;
                }

                if (size !== item.length) throw new Error('All values arrays must have the same length');
            }

            if (size === 0) throw new Error('values arrays cannot be empty');

            if (options.binderIndex >= options.values.length) throw new Error('binderIndex must be less than values length');
        }

        function normalizeValues(values: string[] | string[][]): string[][] {
            if (Array.isArray(values[0])) return values as string[][];

            return [ values ] as string[][];
        }

        function pack(requestItems: (Nullable<BatchRequestItem>)[]): BatchRequestCallback[] {
            const requests = requestItems.filter(request => request !== null) as BatchRequestItem[];
            const packages: BatchRequestCallback[] = [];

            for (let i = 0; i < l; i += BATCH_REQUEST_SIZE) {
                const requestOptions: BatchRequestOptions = {
                    method: 'POST',
                    url: batchEndpoint,
                    headers: opt.batchRequestHeaders
                };
                
                const block = requests.slice(i, Math.min(i + BATCH_REQUEST_SIZE, l));

                requestOptions.data = {
                    requests: block
                };

                packages.push(async () => {
                    const options = {
                        ...requestOptions,
                        headers: {
                            ...requestOptions.headers,
                            'Authorization': `Bearer ${await getAccessToken()}`
                        }
                    };

                    let response: BatchResponse;
                    try {
                        response = await request<BatchResponse>(options);
                    } catch (err) {
                        return {
                            responses: [],
                            isSuccessful: false,
                            rejectedIds: block.map(item => item.id)
                        }
                    }

                    return {
                        responses: response.responses,
                        isSuccessful: true,
                        rejectedIds: []
                    };
                });
            }

            return packages;
        }

        function unpack(responses: BatchResponse[]): BatchResult {
            const result: BatchResult = {
                resolved: [],
                rejected: []
            };

            for (const response of responses) {
                if (!response.isSuccessful) {
                    result.rejected.push(...response.rejectedIds);
                    continue;
                }

                for (const item of response.responses) {
                    const isSuccessful = item.status >= 200 && item.status <= 299;

                    if (isSuccessful) {
                        result.resolved.push(item);
                    } else {
                        result.rejected.push(item.id);
                    }
                }
            }

            return result;
        }

        function rebind(resources: string[]): BatchRequestItem[] {
            return resources.map(resource => ({
                url: urls[resource],
                method: opt.method as Method,
                headers: opt.headers,
                body: opt.body,
                id: resource
            }));
        }
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

    function checkResource(resource: string, variableName?: string) {
        if (!resource || resource.trim() === '') throw new Error(`${variableName ?? 'resource'} cannot be empty`);
    }

    return {
        getAccessToken,
        unit,
        list,
        massive
    };
}