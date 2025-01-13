import type {
    CacheService,
    AccessTokenResponse,
    KeyMapper,
    HttpHeaders,
    Credentials,
    GraphOptions,
    TokenOptions,
    RawOptions,
    UnitOptions,
    ListOptions,
    MassiveOptions,
    PartialMassiveOptions,
    MassiveResult,
    Logger,
    AuthenticationProvider,
    RequestOptions,
    ListGeneratorOptions,
    ListGeneratorPage
} from './src/interfaces';
import type Nullable from './src/interfaces/util/Nullable';

import axios from 'axios';
import type {
    AxiosResponse,
    AxiosError,
    Method,
    AxiosRequestConfig
} from 'axios';

import fill from 'fill-object';
import chunk from 'callback-chunk';
import isAbsoluteUrl from './src/lib/is-absolute-url';
import formBody from './src/services/form-body';
import constants from './src/util/constants';
import hashRequest from './src/services/request-hasher';
import resourceBuilder from './src/services/resource-builder';
import { toUnitOptions } from './src/util/decayOptions';

const TOKEN_CACHE_KEY = 'INTERNAL::TOKEN_CACHE_KEY';
const BATCH_REQUEST_SIZE = 20;

type Response = Record<string, any>;

type IdentifiableUrls = Record<string, string>;
interface ListResponse<T> {
    '@odata.context': string;
    '@odata.nextLink'?: string;
    value: T[];
}

interface BatchRequestItem {
    url: string;
    method: Method;
    headers: Nullable<HttpHeaders>;
    body: any;
    id: string;
}

interface BatchResponse {
    responses: BatchResponseItem[];
    isSuccessful: boolean;
    rejectedIds: string[];
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

type BatchRequestOptions = AxiosRequestConfig<Response> &
    Required<Pick<AxiosRequestConfig<Response>, 'headers' | 'url' | 'method'>>;
type BatchRequestCallback = () => Promise<BatchResponse>;

export default function GraphInterface(
    credentials: Credentials,
    options?: Partial<GraphOptions>
) {
    const _options = fill(
        options ?? {},
        constants.options.main
    ) as GraphOptions;
    const endpoint = `https://graph.microsoft.com/${_options.version}`;
    const batchEndpoint = `${endpoint}/$batch`;

    if (_options.cacheService === undefined) {
        _options.cacheAccessTokenByDefault = false;
    }

    async function getAccessToken(
        options?: Partial<TokenOptions>
    ): Promise<string> {
        const opt = fill(options ?? {}, {
            useCache: _options.cacheAccessTokenByDefault
        }) as TokenOptions;

        const hash = opt.useCache
            ? hashRequest(TOKEN_CACHE_KEY, { credentials, options: opt })
            : '';

        if (opt.useCache) {
            const cache = _getCacheService();
            if (await cache.has(hash)) {
                await _log('Returning cached access token');
                return (await cache.get<AccessTokenResponse>(hash)).accessToken;
            }
        }

        if (_options.authenticationProvider !== undefined) {
            await _log(
                'Retrieving access token from custom authentication provider'
            );

            const token = await _options.authenticationProvider(credentials);

            if (opt.useCache) {
                const cache = _getCacheService();
                await _log('Caching access token');
                await cache.set(hash, token, token.expiresIn);
            }

            await _log(
                'Returning access token from custom authentication provider'
            );

            return token.accessToken;
        }

        await _log('Requesting new access token');

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

        const token = await _request<AccessTokenResponse>(
            requestOptions,
            constants.keyMappers.accessToken
        );

        if (opt.useCache) {
            const cache = _getCacheService();

            await _log('Caching access token');
            await cache.set(hash, token, token.expiresIn);
        }

        await _log('Returning access token');
        return token.accessToken;
    }

    async function raw(
        resource: string,
        options: RawOptions
    ): Promise<ArrayBuffer> {
        _checkResource(resource);

        const opt = fill(options ?? {}, constants.options.raw) as RawOptions;
        const hash: string = opt.useCache ? hashRequest(resource, opt) : '';

        if (opt.useCache) {
            const cache = _getCacheService();

            if (await cache.has(hash)) {
                await _log('Returning cached raw response');
                return await cache.get<ArrayBuffer>(hash);
            }
        }

        if (!isAbsoluteUrl(resource)) {
            resource = `${endpoint}${resource.startsWith('/') ? resource : `/${resource}`}`;
        }

        const headers: HttpHeaders = {};

        const token = opt.customAccessToken ?? (await getAccessToken());

        headers['Authorization'] = `Bearer ${token}`;

        for (const header in opt.headers) {
            headers[header] = opt.headers[header];
        }

        const requestConfig: AxiosRequestConfig<Response> = {
            headers,
            url: resource,
            method: opt.method as Method,
            data: opt.body,
            responseType: 'arraybuffer'
        };

        await _log('Sending raw request');
        const result = await _request<ArrayBuffer>(requestConfig);

        if (opt.useCache) {
            const cache = _getCacheService();
            await _log('Caching raw response');
            await cache.set(hash, result);
        }

        await _log('Returning raw response');
        return result;
    }

    async function unit<T>(
        resource: string,
        options?: Partial<UnitOptions>
    ): Promise<T> {
        _checkResource(resource);

        const opt = fill(options ?? {}, constants.options.unit) as UnitOptions;
        const hash: string = opt.useCache ? hashRequest(resource, opt) : '';

        if (opt.useCache) {
            const cache = _getCacheService();

            if (await cache.has(hash)) {
                await _log('Returning cached unit response');
                return await cache.get<T>(hash);
            }
        }

        if (!isAbsoluteUrl(resource)) {
            resource = `${endpoint}${resource.startsWith('/') ? resource : `/${resource}`}`;
        }

        const headers: HttpHeaders = {};

        const token = opt.customAccessToken ?? (await getAccessToken());

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

        await _log('Sending unit request');
        const result: T = await _request<T>(requestConfig, opt.keyMapper);

        if (opt.useCache) {
            const cache = _getCacheService();
            await _log('Caching unit response');
            await cache.set(hash, result);
        }

        await _log('Returning unit response');
        return result;
    }

    async function list<T>(
        resource: string,
        options?: Partial<ListOptions>
    ): Promise<T[]> {
        _checkResource(resource);

        const opt = fill(options ?? {}, constants.options.list) as ListOptions;

        if (opt.limit === 0) {
            return [];
        }

        const hash: string = opt.useCache ? hashRequest(resource, opt) : '';

        if (opt.useCache) {
            const cache = _getCacheService();

            if (await cache.has(hash)) {
                await _log('Returning cached list response');
                return await cache.get<T[]>(hash);
            }
        }

        const unitOptions = toUnitOptions(opt);
        const offset = opt.offset ?? 0;
        const result: T[] = [];

        let response: ListResponse<T>;
        let index = 0;
        let nextUri: string = opt.startingFromToken
            ? resource.includes('?')
                ? `${resource}&$skipToken=${opt.startingFromToken}`
                : `${resource}?$skipToken=${opt.startingFromToken}`
            : resource;
        let loop: boolean = false;
        const hasFinished = (index: number) => {
            if (!opt.limit) return false;

            return index - offset === (opt.limit ?? 0);
        };

        const waiter = !opt.waitingTimeBetweenPages
            ? async () => {}
            : async () => {
                  await _log(
                      `Waiting ${opt.waitingTimeBetweenPages}ms before next page`
                  );
                  await new Promise(resolve =>
                      setTimeout(resolve, opt.waitingTimeBetweenPages)
                  );
              };

        do {
            response = await unit<ListResponse<T>>(nextUri, unitOptions);

            if (index >= offset) result.push(...response.value);

            nextUri = response['@odata.nextLink'] ?? '';
            index++;
            loop = Boolean(nextUri) && !hasFinished(index);

            if (loop) await waiter();
        } while (loop);

        if (opt.useCache) {
            const cache = _getCacheService();

            await _log('Caching list response');
            await cache.set(hash, result);
        }

        await _log('Returning list response');
        return result;
    }

    async function* createListGenerator<T>(
        resource: string,
        options?: Partial<ListGeneratorOptions>
    ): AsyncIterator<ListGeneratorPage<T>> {
        _checkResource(resource);

        const opt = fill(
            options ?? {},
            constants.options.listGenerator
        ) as ListGeneratorOptions;

        if (opt.limit === 0) return;

        const unitOptions = toUnitOptions(opt);
        const offset = opt.offset ?? 0;

        let response: ListResponse<T>;
        let index = 0;
        let nextUri: string = opt.startingFromToken
            ? resource.includes('?')
                ? `${resource}&$skipToken=${opt.startingFromToken}`
                : `${resource}?$skipToken=${opt.startingFromToken}`
            : resource;
        let loop: boolean = false;
        const hasFinished = (index: number) => {
            if (!opt.limit) return false;

            return index - offset === (opt.limit ?? 0);
        };

        const waiter = !opt.waitingTimeBetweenPages
            ? async () => {}
            : async () => {
                  await _log(
                      `Waiting ${opt.waitingTimeBetweenPages}ms before next page`
                  );
                  await new Promise(resolve =>
                      setTimeout(resolve, opt.waitingTimeBetweenPages)
                  );
              };

        do {
            response = await unit<ListResponse<T>>(nextUri, unitOptions);

            if (index >= offset) {
                yield {
                    items: response.value,
                    pageTokens: {
                        current: nextUri,
                        next: response['@odata.nextLink'] ?? null
                    }
                };
            }

            nextUri = response['@odata.nextLink'] ?? '';
            index++;
            loop = Boolean(nextUri) && !hasFinished(index);

            if (loop) await waiter();
        } while (loop);

        await _log('Finished list generator');
    }

    async function massive<T>(
        resourcePattern: string,
        options: PartialMassiveOptions
    ): Promise<MassiveResult<T>> {
        _checkResource(resourcePattern, 'resourcePattern');

        const opt = fill(options, constants.options.massive) as MassiveOptions;

        validadeOptions(opt);

        const hash: string = opt.useCache
            ? hashRequest(resourcePattern, opt)
            : '';

        if (opt.useCache) {
            const cache = _getCacheService();

            if (await cache.has(hash)) {
                await _log('Returning cached massive response');
                return await cache.get<{ [binder: string]: T }>(hash);
            }
        }

        await _log('Generating individual urls');
        const values = normalizeValues(
            opt.values as Exclude<typeof opt.values, null>
        );
        let resources = resourceBuilder(resourcePattern, values);
        let l = resources.length;
        const urls: IdentifiableUrls = {};

        const waiter = !opt.waitingTimeBetweenBatches
            ? async () => {}
            : async () => {
                  await _log(
                      `Waiting ${opt.waitingTimeBetweenBatches}ms before next batch`
                  );
                  await new Promise(resolve =>
                      setTimeout(resolve, opt.waitingTimeBetweenBatches)
                  );
              };

        const binderList = values[opt.binderIndex];
        const results: MassiveResult<T> = {};
        let attempts = 0;
        let loop: boolean = false;

        await _log('Generating individual requests');

        let requests: BatchRequestItem[] = resources.map((resource, index) => ({
            url: resource,
            method: opt.method as Method,
            headers: opt.headers,
            body: opt.body,
            id: binderList[index]
        }));

        requests.forEach(request => (urls[request.id] = request.url));

        do {
            await _log('Packaging requests into Graph batch requests');
            const packages = pack(requests);

            await _log('Sending batch requests');
            const responses = await chunk(packages, opt.requestsPerAttempt);

            await _log('Resolving batch responses');
            const result = unpack(responses);

            for (const item of result.resolved) {
                results[item.id] = item.body as T;
            }

            if (resources.length === result.rejected.length) {
                await _log('All requests failed');
                attempts++;
            }

            if (attempts >= opt.attempts) {
                await _log('Maximum attempts reached, nullifying errors');

                if (!opt.nullifyErrors)
                    throw new Error('Maximum attempts reached');

                for (const item of result.rejected) {
                    results[item] = null;
                }

                break;
            }

            resources = result.rejected;
            l = resources.length;
            loop = l > 0;

            if (loop) {
                await _log('Generating individual requests');
                requests = rebind(resources);
                await waiter();
            }
        } while (loop);

        if (opt.useCache) {
            const cache = _getCacheService();

            await _log('Caching massive response');
            await cache.set(hash, results);
        }

        await _log('Returning massive response');
        return results;

        function validadeOptions(options: MassiveOptions) {
            if (!options.values) throw new Error('values is required');
            let size: number | null = null;

            for (const item of options.values) {
                if (size === null) {
                    size = item.length;
                    continue;
                }

                if (size !== item.length)
                    throw new Error(
                        'All values arrays must have the same length'
                    );
            }

            if (size === 0) throw new Error('values arrays cannot be empty');

            if (options.binderIndex >= options.values.length)
                throw new Error('binderIndex must be less than values length');
        }

        function normalizeValues(values: string[] | string[][]): string[][] {
            if (Array.isArray(values[0])) return values as string[][];

            return [values] as string[][];
        }

        function pack(
            requestItems: Nullable<BatchRequestItem>[]
        ): BatchRequestCallback[] {
            const requests = requestItems.filter(
                request => request !== null
            ) as BatchRequestItem[];
            const packages: BatchRequestCallback[] = [];

            for (let i = 0; i < l; i += BATCH_REQUEST_SIZE) {
                const requestOptions: BatchRequestOptions = {
                    method: 'POST',
                    url: batchEndpoint,
                    headers: opt.batchRequestHeaders
                };

                const block = requests.slice(
                    i,
                    Math.min(i + BATCH_REQUEST_SIZE, l)
                );

                requestOptions.data = {
                    requests: block
                };

                packages.push(async () => {
                    requestOptions.headers['Authorization'] =
                        `Bearer ${opt.customAccessToken ?? (await getAccessToken())}`;

                    let response: BatchResponse;
                    try {
                        response =
                            await _request<BatchResponse>(requestOptions);
                    } catch (err) {
                        return {
                            responses: [],
                            isSuccessful: false,
                            rejectedIds: block.map(item => item.id)
                        };
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
                    const isSuccessful =
                        item.status >= 200 && item.status <= 299;

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

    async function _request<T>(
        options: AxiosRequestConfig<Response>,
        keyMapper?: Nullable<KeyMapper>
    ): Promise<T> {
        let response: AxiosResponse<Response>;
        try {
            response = await axios(options);
        } catch (_err) {
            const err = _err as AxiosError;

            if (err.response?.data) {
                throw new Error(
                    `Failed to request access token: ${err.response.status} - ${err.response.statusText}\n${typeof err.response.data === 'object' ? JSON.stringify(err.response.data, null, 2) : err.response.data}`
                );
            }

            if (err.response) {
                throw new Error(
                    `Failed to request access token: ${err.response?.status} - ${err.response?.statusText}`
                );
            }

            throw new Error(`Failed to request access token: ${err.message}`);
        }

        if (!keyMapper) return response.data as T;

        if (typeof response.data !== 'object')
            throw new Error('Response data is not an object');

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

    function _getCacheService(): CacheService {
        if (_options.cacheService === undefined)
            throw new Error('Cache service is not defined');

        return _options.cacheService;
    }

    async function _log(message: string): Promise<void> {
        if (_options.logger !== undefined) await _options.logger(message);
    }

    function _checkResource(resource: string, variableName?: string) {
        if (!resource || resource.trim() === '')
            throw new Error(`${variableName ?? 'resource'} cannot be empty`);
    }

    return {
        getAccessToken,
        raw,
        unit,
        list,
        createListGenerator,
        massive
    };
}

export type {
    CacheService,
    Logger,
    AuthenticationProvider,
    AccessTokenResponse,
    KeyMapper,
    RequestOptions,
    HttpHeaders,
    Credentials,
    GraphOptions,
    TokenOptions,
    RawOptions,
    UnitOptions,
    ListOptions,
    MassiveOptions,
    PartialMassiveOptions,
    MassiveResult
};
