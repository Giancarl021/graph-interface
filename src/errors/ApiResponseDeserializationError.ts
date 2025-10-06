/**
 * Error thrown when an API response cannot be deserialized to JSON.
 */
export default class ApiResponseDeserializationError extends Error {
    /**
     * The response that failed to be deserialized.
     */
    #response: Response;
    /**
     * The constructor for ApiResponseDeserializationError.
     * @param response The response that failed to be deserialized.
     * @param responseBody The body of the response, formatted as a string;
     */
    constructor(response: Response, responseBody: string) {
        super(
            `Response deserialization to JSON failed. Response status: ${response.status} ${response.statusText}. Response body:\n\n${responseBody}`
        );

        this.name = 'ApiResponseDeserializationError';
        this.#response = response;
    }

    /**
     * The response that failed to be deserialized.
     */
    get response() {
        return this.#response;
    }
}
