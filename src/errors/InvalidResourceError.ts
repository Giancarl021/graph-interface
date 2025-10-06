/**
 * Error thrown when an invalid resource is provided to the API client.
 */
export default class InvalidResourceError extends Error {
    /**
     * The constructor for InvalidResourceError.
     */
    constructor() {
        super(
            'The resource provided is invalid. It must be a non-empty string.'
        );
        this.name = 'InvalidResourceError';
    }
}
