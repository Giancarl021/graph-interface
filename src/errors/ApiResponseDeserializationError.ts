export default class ApiResponseDeserializationError extends Error {
    #response: Response;
    constructor(response: Response, responseBody: string) {
        super(
            `Response deserialization to JSON failed. Response status: ${response.status} ${response.statusText}. Response body:\n\n${responseBody}`
        );

        this.name = 'ApiResponseDeserializationError';
        this.#response = response;
    }

    get response() {
        return this.#response;
    }
}
