import AsyncStream from '@giancarl021/async-stream';
import TooManyRequestAttemptsError from '../errors/TooManyRequestAttemptsError.js';
import ApiRequestFailedError from '../errors/ApiRequestFailedError.js';
import ApiResponseDeserializationError from '../errors/ApiResponseDeserializationError.js';
import PaginateRequestOptions from '../interfaces/PaginateRequestOptions.js';
import FaultyPagePaginationError from '../errors/FaultyPagePaginationError.js';
import getResponseBody from '../util/getResponseBody.js';
import delay from '../util/delay.js';
import constants from '../util/constants.js';

import type ApiRequestOptions from '../interfaces/ApiRequestOptions.js';
import type RawRequestOptions from '../interfaces/RawRequestOptions.js';
import type SingleRequestOptions from '../interfaces/SingleRequestOptions.js';

/**
 * Client options
 */
interface Options {
    /**
     * Base URL for the API (e.g. 'https://management.azure.com')
     */
    baseUrl: string;
    /**
     * Function that generates an access token for the API requests
     * @returns A promise that resolves to the access token
     */
    accessTokenGenerator: () => Promise<string>;
}

/**
 * Type representing an instance of the ApiClient
 */
export type ApiClientInstance = ReturnType<typeof ApiClient>;

/**
 * Client for making API requests, providing methods for raw (non-JSON) requests, as well
 * as paginated requests and batch requests.
 * @param clientOptions Client options
 * @returns An object with methods for making API requests
 */
export default function ApiClient(clientOptions: Options) {
    /**
     * Compose the full URL for the request, merging any existing query parameters in the resource URL with the provided ones.
     * @param baseUrl The base URL for the API.
     * @param resource The resource URL or path.
     * @param query Optional query parameters to include in the request URL.
     * @returns The full URL for the request.
     */
    function _composeUrl(
        baseUrl: string,
        resource: string,
        query?: ApiRequestOptions['query']
    ): string {
        if (isAbsoluteUrl(resource)) {
            return resource;
        }

        const queryParts: string[] = [];

        // Extract existing query parameters from resource URL
        const existingQuery = resource
            .split('?')[1]
            .split('#')[0]
            .split('&')
            .filter(part => Boolean(part.trim()))
            .reduce(
                (acc, part) => {
                    const [key, value] = part
                        .trim()
                        .split('=')
                        .map(decodeURIComponent);
                    acc[key] = value ?? null;

                    return acc;
                },
                {} as Record<string, string | null>
            );

        // Merge existing query parameters with new ones, new ones take precedence
        const queryEntries = Object.entries({
            ...existingQuery,
            ...(query ?? {})
        });

        for (const [key, value] of queryEntries) {
            const _key = encodeURIComponent(key);

            if (value === null || value === undefined) {
                queryParts.push(_key);
                continue;
            }

            queryParts.push(`${_key}=${encodeURIComponent(String(value))}`);
        }

        const queryString = queryParts.length ? '?' + queryParts.join('&') : '';

        const url = `${baseUrl.replace(/\/+$/, '')}/${resource
            .replace(/^\/+/, '')
            .replace(/\?$/, '')}${queryString}`;

        return url;

        /**
         * Check if a URL is absolute
         * @param url The URL to check
         * @returns `true` if the URL is absolute, `false` otherwise
         */
        function isAbsoluteUrl(url: string): boolean {
            return /^https?:\/\//i.test(url);
        }
    }

    /**
     * Create a fetch Request object for the API request
     * @param resource The resource URL or path
     * @param localOptions Request options
     * @returns The fetch Request object
     */
    async function _createRequest(
        resource: string,
        localOptions: Partial<ApiRequestOptions>
    ): Promise<Request> {
        // Construct URL, if absolute URL is provided, use it as is
        const url = _composeUrl(
            clientOptions.baseUrl,
            resource,
            localOptions.query
        );

        const headers = composeHeaders(localOptions.headers ?? {});
        let jsonBody = isJsonBody(localOptions.body);

        // Set content-type header if body is JSON and content-type is not already set
        if (jsonBody && !('content-type' in headers)) {
            headers['content-type'] = 'application/json;charset=utf-8';
            // If body is JSON but content-type is set to something else, don't treat body as JSON
        } else if (
            !headers['content-type'].toLowerCase().includes('application/json')
        ) {
            jsonBody = false;
        }

        // Set authorization header
        headers['authorization'] =
            `Bearer ${localOptions.withCustomAccessToken ? localOptions.withCustomAccessToken : await clientOptions.accessTokenGenerator()}`;

        return new Request(url, {
            method: localOptions.method ?? 'GET',
            headers: new Headers(headers),
            body: jsonBody
                ? JSON.stringify(localOptions.body)
                : (localOptions.body as RequestInit['body'] | undefined)
        });

        /**
         * Compose headers, converting all values to strings and lowercasing header names.
         * @param headers Headers to compose
         * @returns Composed headers
         */
        function composeHeaders(headers: ApiRequestOptions['headers']) {
            const _headers: Record<string, string> = {};

            for (const key in headers) {
                const value = headers[key];
                const _key = key.toLowerCase();
                const _value =
                    value !== null && value !== undefined ? String(value) : '';

                _headers[_key] = _value;
            }

            return _headers;
        }

        /**
         * Check if the body is a JSON object (not null, not a primitive, not a Blob, not a FormData, etc.)
         * @param body The body to check
         * @returns `true` if the body is a JSON object, `false` otherwise
         */
        function isJsonBody(body: unknown): body is object {
            return (
                body !== null &&
                typeof body === 'object' &&
                !(
                    body instanceof Blob ||
                    body instanceof ArrayBuffer ||
                    ArrayBuffer.isView(body) ||
                    body instanceof FormData ||
                    body instanceof URLSearchParams ||
                    body instanceof ReadableStream
                )
            );
        }
    }

    /**
     * Factory function to create a function that checks if the pagination loop is finished based on the `take` parameter.
     * @param take The maximum number of items to take, or undefined for no limit
     * @returns A function that takes the current index and returns `true` if the loop is finished, `false` otherwise
     */
    function _isLoopFinishedFactory(
        take: number | undefined
    ): (index: number) => boolean {
        {
            if (typeof take === 'undefined') return () => false;

            return i => i >= take;
        }
    }

    /**
     * Make a raw API request, returns the fetch Response object
     * @param resource The resource URL or path
     * @param options Request options
     * @returns The fetch Response object
     * @throws {ApiRequestFailedError} If the request fails with a non-2xx status code (except 429)
     * @throws {TooManyRequestAttemptsError} If the request fails with a 429 status code after the maximum number of attempts
     */
    async function raw(
        resource: string,
        options?: RawRequestOptions
    ): Promise<Response> {
        const request = await _createRequest(resource, options ?? {});
        const maximumTooManyRequestsAttempts =
            options?.maximumTooManyRequestsAttempts ??
            constants.defaults.maximumTooManyRequestsAttempts;

        let response: Response;
        let attempts = 1;

        do {
            response = await fetch(request);

            // If response is successful, return it
            if (response.ok) {
                return response;
            }

            // If response is not 429, throw error
            if (response.status !== 429) {
                throw new ApiRequestFailedError(
                    response,
                    await getResponseBody(response)
                );
            }

            // If response is 429, retry after specified timeout
            const retryAfter = Number(response.headers.get('retry-after') ?? 0);
            const retryAfterMs = !isNaN(retryAfter)
                ? Math.max(
                      retryAfter * 1000,
                      constants.defaults.tooManyRequestsWaitTimeMs
                  )
                : constants.defaults.tooManyRequestsWaitTimeMs;

            await delay(retryAfterMs);

            attempts++;
        } while (attempts <= maximumTooManyRequestsAttempts);

        throw new TooManyRequestAttemptsError(
            attempts - 1,
            response,
            await getResponseBody(response)
        );
    }

    /**
     * Make a single API request, returns the response body deserialized to JSON.
     * @param resource The resource URL or path
     * @param options Request options
     * @returns The response body deserialized to JSON, or undefined if the response has no body
     * @throws {ApiRequestFailedError} If the request fails with a non-2xx status code (except 429)
     * @throws {TooManyRequestAttemptsError} If the request fails with a 429 status code after the maximum number of attempts
     * @throws {ApiResponseDeserializationError} If the response body cannot be deserialized to JSON
     */
    async function single<T = unknown>(
        resource: string,
        options: SingleRequestOptions
    ): Promise<T | undefined> {
        // If response has no body (204 No Content or content-length is 0), return undefined
        // if there is a serialization error
        let unsureOfResponseBody = false;
        const response = await raw(resource, options);

        if (
            (response.headers.get('content-length') ?? '0') === '0' ||
            response.status === 204 ||
            response.bodyUsed
        ) {
            unsureOfResponseBody = true;
        }

        try {
            const json = await response.json();

            return json as T;
        } catch (error) {
            if (unsureOfResponseBody) {
                return undefined;
            }

            throw new ApiResponseDeserializationError(
                response,
                await getResponseBody(response)
            );
        }
    }

    /**
     * Paginate through a resource, returns an array of all items.
     * @param resource The resource URL or path
     * @param options Request options
     * @returns An array of all items
     * @throws {ApiRequestFailedError} If any request fails with a non-2xx status code (except 429)
     * @throws {TooManyRequestAttemptsError} If any request fails with a 429 status code after the maximum number of attempts
     * @throws {ApiResponseDeserializationError} If any response body cannot be deserialized to JSON
     * @throws {FaultyPagePaginationError} If a faulty page is encountered during pagination
     */
    async function paginate<TPage, TItem>(
        resource: string,
        options: PaginateRequestOptions<TPage, TItem>
    ): Promise<TItem[]> {
        if (options.take === 0) {
            return [];
        }

        let nextUrl: string | undefined = _composeUrl(
            clientOptions.baseUrl,
            resource,
            options.query
        );
        let pageIndex = 0;
        let currentOptions: PaginateRequestOptions<TPage, TItem> = options;
        const skip = options.skip ?? 0;
        const hasFinished = _isLoopFinishedFactory(options.take);
        const getOptions = options.getOptions ?? (options => options);

        const result: TItem[] = [];

        while (nextUrl && !hasFinished(pageIndex)) {
            const page = await single<TPage>(nextUrl, currentOptions);

            if (!page) throw new FaultyPagePaginationError(pageIndex);

            const items = options.getItems(page);
            nextUrl = options.getNextPageLink(nextUrl, page);

            if (pageIndex >= skip) {
                result.push(...items);
            }

            pageIndex++;
            currentOptions = getOptions(currentOptions, page);
        }

        return result;
    }

    /**
     * Create a page generator for a resource, returns an async generator that yields arrays of items for each page.
     * @param resource The resource URL or path
     * @param options Request options
     * @returns An async generator that yields arrays of items for each page
     * @throws {ApiRequestFailedError} If any request fails with a non-2xx status code (except 429)
     * @throws {TooManyRequestAttemptsError} If any request fails with a 429 status code after the maximum number of attempts
     * @throws {ApiResponseDeserializationError} If any response body cannot be deserialized to JSON
     * @throws {FaultyPagePaginationError} If a faulty page is encountered during pagination
     */
    function createPageGenerator<TPage, TItem>(
        resource: string,
        options: PaginateRequestOptions<TPage, TItem>
    ): AsyncStream<TItem[]> {
        if (options.take === 0) {
            return AsyncStream.empty<TItem[]>();
        }

        async function* generator(): AsyncGenerator<TItem[]> {
            let nextUrl: string | undefined = _composeUrl(
                clientOptions.baseUrl,
                resource,
                options.query
            );
            let pageIndex = 0;
            let currentOptions: PaginateRequestOptions<TPage, TItem> = options;
            const skip = options.skip ?? 0;
            const hasFinished = _isLoopFinishedFactory(options.take);
            const getOptions = options.getOptions ?? (options => options);

            while (nextUrl && !hasFinished(pageIndex)) {
                const page = await single<TPage>(nextUrl, currentOptions);

                if (!page) throw new FaultyPagePaginationError(pageIndex);

                const items = options.getItems(page);
                nextUrl = options.getNextPageLink(nextUrl, page);

                if (pageIndex >= skip) {
                    yield items;
                }

                pageIndex++;
                currentOptions = getOptions(currentOptions, page);
            }
        }

        return new AsyncStream(generator());
    }

    async function batch() {}

    function createBatchPaginator<T = unknown>(): AsyncStream<T[]> {
        async function* generator() {
            yield [];
        }

        return new AsyncStream(generator());
    }

    return {
        /**
         * Make a raw API request, returns the fetch Response object
         * @param resource The resource URL or path
         * @param options Request options
         * @returns The fetch Response object
         * @throws {ApiRequestFailedError} If the request fails with a non-2xx status code (except 429)
         * @throws {TooManyRequestAttemptsError} If the request fails with a 429 status code after the maximum number of attempts
         */
        raw,
        /**
         * Make a single API request, returns the response body deserialized to JSON.
         * @param resource The resource URL or path
         * @param options Request options
         * @returns The response body deserialized to JSON, or undefined if the response has no body
         * @throws {ApiRequestFailedError} If the request fails with a non-2xx status code (except 429)
         * @throws {TooManyRequestAttemptsError} If the request fails with a 429 status code after the maximum number of attempts
         * @throws {ApiResponseDeserializationError} If the response body cannot be deserialized to JSON
         */
        single,
        /**
         * Paginate through a resource, returns an array of all items.
         * @param resource The resource URL or path
         * @param options Request options
         * @returns An array of all items
         * @throws {ApiRequestFailedError} If any request fails with a non-2xx status code (except 429)
         * @throws {TooManyRequestAttemptsError} If any request fails with a 429 status code after the maximum number of attempts
         * @throws {ApiResponseDeserializationError} If any response body cannot be deserialized to JSON
         * @throws {FaultyPagePaginationError} If a faulty page is encountered during pagination
         */
        paginate,
        /**
         * Create a page generator for a resource, returns an async generator that yields arrays of items for each page.
         * @param resource The resource URL or path
         * @param options Request options
         * @returns An async generator that yields arrays of items for each page
         * @throws {ApiRequestFailedError} If any request fails with a non-2xx status code (except 429)
         * @throws {TooManyRequestAttemptsError} If any request fails with a 429 status code after the maximum number of attempts
         * @throws {ApiResponseDeserializationError} If any response body cannot be deserialized to JSON
         * @throws {FaultyPagePaginationError} If a faulty page is encountered during pagination
         */
        createPageGenerator,
        batch,
        createBatchPaginator
    };
}
