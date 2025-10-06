/**
 * Error thrown when an API response page is invalid or malformed, and
 * the pagination strategy processor cannot extract the expected data.
 */
export default class InvalidApiResponsePageError extends Error {
    /**
     * The invalid deserialized page that caused the error.
     */
    #page: unknown;
    /**
     * The constructor for InvalidApiResponsePageError.
     * @param page The invalid deserialized page that caused the error.
     */
    constructor(page: unknown) {
        let pageString: string;

        // Attempt to stringify the page for better error messages
        try {
            pageString = JSON.stringify(page, null, 2);
        } catch {
            pageString = String(page);
        }

        super(
            `The provided page could not be correctly parsed. Received page:\n\n${pageString}`
        );

        this.name = 'InvalidApiResponsePageError';
        this.#page = page;
    }

    get page() {
        return this.#page;
    }
}
