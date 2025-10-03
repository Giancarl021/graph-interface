export default class ApiRequestFailedError extends Error {
    #response: Response;
    constructor(response: Response, responseBody: string) {
        super(
            `Request failed with status ${response.status} ${response.statusText}. Response body:\n\n${responseBody}`
        );

        this.name = 'ApiRequestFailedError';
        this.#response = response;
    }

    get response() {
        return this.#response;
    }
}
