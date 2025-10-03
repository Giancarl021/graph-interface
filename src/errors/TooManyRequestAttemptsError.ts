import getResponseBody from '../util/getResponseBody.js';

export default class TooManyRequestAttemptsError extends Error {
    #response: Response;
    constructor(attempts: number, response: Response, responseBody: string) {
        super(
            `Request failed with status ${response.status} - ${response.statusText} after ${attempts} attempts. Response body:\n\n${responseBody}`
        );

        this.name = 'TooManyRequestAttemptsError';
        this.#response = response;
    }

    get lastResponse() {
        return this.#response;
    }
}
