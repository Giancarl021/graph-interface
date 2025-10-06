/**
 * Error thrown when the maximum number of request attempts is exceeded.
 */
export default class TooManyRequestAttemptsError extends Error {
    /**
     * The response from the last failed attempt.
     */
    #response: Response;
    /**
     * The constructor for TooManyRequestAttemptsError.
     * @param attempts The number of attempts made.
     * @param response The response from the last failed attempt.
     * @param responseBody The body of the response from the last failed attempt, formatted as a string;
     */
    constructor(attempts: number, response: Response, responseBody: string) {
        super(
            `Request failed with status ${response.status} - ${response.statusText} after ${attempts} attempts. Response body:\n\n${responseBody}`
        );

        this.name = 'TooManyRequestAttemptsError';
        this.#response = response;
    }

    /**
     * The response from the last failed attempt.
     */
    get lastResponse() {
        return this.#response;
    }
}
