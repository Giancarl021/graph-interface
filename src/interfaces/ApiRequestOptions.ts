/**
 * Common options for API requests.
 */
export default interface ApiRequestOptions {
    /**
     * Custom headers to include in the request. All headers will be converted to strings.
     */
    headers: Record<string, string | number | boolean | null>;
    /**
     * HTTP method to use for the request.
     */
    method:
        | 'GET'
        | 'POST'
        | 'PUT'
        | 'DELETE'
        | 'PATCH'
        | 'OPTIONS'
        | 'HEAD'
        | 'TRACE'
        | 'CONNECT';
    /**
     * Request body. If the body is an object, it will be serialized to JSON and the `Content-Type` header will be set to `application/json`.
     * If the body is a another valid `BodyInit` object or the `Content-Type` header is set to something else, the body will be sent as is.
     */
    body: RequestInit['body'] | object;
    /**
     * Query parameters to include in the request URL. All query parameters will be converted to strings.
     * If the resource URL already contains query parameters, these will be merged with the ones provided here, with
     * the ones provided here taking precedence in case of conflicts.
     */
    query: Record<string, string | number | boolean | null>;
    /**
     * If set, this access token will be used for the request instead of generating a new one.
     */
    withCustomAccessToken: string;
    /**
     * Maximum number of attempts to retry the request if a `429 - Too Many Requests` response is received.
     */
    maximumTooManyRequestsAttempts: number;
}
