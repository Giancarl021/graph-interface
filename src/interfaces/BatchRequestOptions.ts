import type ApiRequestOptions from './ApiRequestOptions.js';

/**
 * Options for batch requests.
 */
export default interface BatchRequestOptions
    extends Partial<ApiRequestOptions> {
    /**
     * The values to be interpolated in the resource URL template for each request.
     * Each object in the array represents a set of values for one request.
     * The keys in the object should match the placeholders in the resource URL template.
     * The values can be of type string, number, boolean, Date, or BigInt.
     *
     * Example:
     * ```ts
     * const resourceTemplate = 'users/{userId}/messages/{messageId}';
     * const values = [
     *   { userId: 'user1', messageId: 'msg1' },
     *   { userId: 'user2', messageId: 'msg2' },
     *   { userId: 'user3', messageId: 'msg3' }
     * ];
     * ```
     *
     * `Date` and `BigInt` values will be converted to ISO string and string respectively.
     * If a value is of another type, it will be converted to string using `String(value)`.
     *
     * `null`, `undefined` or missing values will throw an error before any request is made.
     *
     * > **Note:** The resource URL template should use `{key}` syntax for placeholders. Example: `resource/{id}/type={type}`
     */
    values: Record<string, string | number | boolean | Date | BigInt>[];
    /**
     * Headers to be sent with the `$batch` request (Not the individual requests).
     */
    batchRequestHeaders?: this['headers'];
    /**
     * Maximum number of attempts for each request batch operation. An attempt is
     * counted when the number of failures is the same as the amount of requests in the batch.
     * For example, considering the `maximumConsecutiveAttempts` value of `3`:
     * - First batch: 8 requests, 2 succeed, 6 fail
     * - Second batch: 6 requests, 2 succeeds, 4 fail
     * - Third batch: 4 requests, 0 succeeds, 4 fail (1 attempt)
     * - Fourth batch: 4 requests, 0 succeeds, 4 fail (2 attempts)
     * - Fifth batch: 4 requests, 2 succeeds, 2 fail (3 attempts)
     * - **End of cycle, no more attempts**
     *
     * The result of the cycle can be configured in the `partialResults` option.
     *
     * Default is `3`. If set to `0`, there will be no retries.
     */
    maximumConsecutiveAttempts?: number;
    /**
     * Number of requests to be sent in each cycle. Default is `50`.
     */
    requestsPerAttempt?: number;
    /**
     * Whether to return partial results if some requests fail after all attempts.
     * If set to `false`, the whole batch operation will fail if there are failed requests.
     * If set to `true`, the successful requests will be returned, and the failed ones will be omitted.
     *
     * Default is `false`.
     */
    partialResults?: boolean;
    /**
     * Waiting time between each batch attempt in milliseconds. Default is `0` (no waiting time).
     * The wait set by this option is applied only between attempts, not between individual requests within a batch.
     * The wait is cummulative with the request duration and if there is any `Retry-After` header in the response,
     * meaning that if a request takes `200ms` to complete and returns a `429 - Too Many Requests` with a `Retry-After` header of
     * 5 seconds and the `waitTimeBetweenAttempts` is set to `1000ms`,
     * the next attempt will be made after `6200ms` (5000ms + 200ms + 1000ms).
     *
     * Default is `0`.
     */
    waitTimeBetweenAttempts?: number;
}
