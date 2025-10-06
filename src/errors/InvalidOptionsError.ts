/**
 * Error thrown when invalid options are provided to a API client method.
 */
export default class InvalidOptionsError extends Error {
    /**
     * The reason why the options are considered invalid.
     */
    #reason?: string;
    /**
     * The constructor for InvalidOptionsError.
     * @param reason Optional reason why the options are invalid.
     */
    constructor(reason?: string) {
        super(
            `The options provided are invalid.${reason ? ` Reason: ${reason}` : ''}`
        );
        this.name = 'InvalidOptionsError';
        this.#reason = reason;
    }

    /**
     * Get the reason why the options are invalid.
     * @returns The reason string, or undefined if no reason was provided.
     */
    get reason() {
        return this.#reason;
    }
}
