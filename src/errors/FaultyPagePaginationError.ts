/**
 * Error thrown when a faulty page is encountered during pagination.
 */
export default class FaultyPagePaginationError extends Error {
    /**
     * @param pageIndex The index of the faulty page (0-based).
     */
    #pageIndex: number;
    /**
     * The constructor for FaultyPagePaginationError.
     * @param pageIndex The index of the faulty page (0-based).
     */
    public constructor(pageIndex: number) {
        super(`Faulty page found while paginating. Page index: ${pageIndex}`);
        this.name = 'FaultyPagePaginationError';
        this.#pageIndex = pageIndex;
    }

    /**
     * The index of the faulty page (0-based).
     */
    get pageIndex() {
        return this.#pageIndex;
    }
}
