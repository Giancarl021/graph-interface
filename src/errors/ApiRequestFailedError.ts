/**
 * Error thrown when an API request fails (non-2xx status code).
 */
export default class ApiRequestFailedError extends Error {
    /**
     * The response that caused the error.
     */
    #response: Response;
    /**
     * The constructor for ApiRequestFailedError.
     * @param response The response that caused the error.
     * @param responseBody The body of the response, formatted as a string;
     */
    constructor(response: Response, responseBody: string) {
        super(
            `Request failed with status ${response.status} ${response.statusText}. Response body:\n\n${responseBody}`
        );

        this.name = 'ApiRequestFailedError';
        this.#response = response;
    }

    /**
     * The response that caused the error.
     */
    get response() {
        return this.#response;
    }
}
