/**
 * Default constants used throughout the library.
 */
export default {
    /**
     * Default settings for handling specific cases
     */
    defaults: {
        /**
         * Maximum number of retry attempts for handling 429 Too Many Requests responses.
         */
        maximumTooManyRequestsAttempts: 3,
        /**
         * Wait time in milliseconds before retrying a request after receiving a 429 Too Many Requests response
         * if a `Retry-After` header is not provided.
         */
        tooManyRequestsWaitTimeMs: 1000 // 1 second
    },
    /**
     * Settings for batch requests
     */
    batch: {
        /**
         * Number of requests to be sent in each batch. Default is `20`.
         */
        requestsPerBatch: 20
    }
} as const;
