/**
 * Error thrown when an authentication request fails (non-2xx status code) or
 * when the response body is not as expected.
 */
export default class AuthenticationRequestFailedError extends Error {
    /**
     * The response that caused the error.
     */
    #response: Response;
    /**
     * The constructor for AuthenticationRequestFailedError.
     * @param response The response that caused the error.
     * @param responseBody The body of the response, formatted as a string;
     * @param reason Optional reason for the failure.
     */
    constructor(response: Response, responseBody: string, reason?: string) {
        super(
            (reason
                ? reason
                : `Request failed with status ${response.status} ${response.statusText}.`) +
                `Response body:\n\n${responseBody}`
        );

        this.name = 'AuthenticationRequestFailedError';
        this.#response = response;
    }

    /**
     * The response that caused the error.
     */
    get response() {
        return this.#response;
    }
}
