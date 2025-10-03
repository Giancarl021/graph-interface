import type ApiRequestOptions from './ApiRequestOptions.js';

/**
 * Paginate request options
 * @template TPage The type of the page response
 * @template TItem The type of the items in the page
 */
export default interface PaginateRequestOptions<TPage, TItem>
    extends Partial<ApiRequestOptions> {
    /**
     * Number of **pages** to skip (not items).
     * By default, no pages are skipped.
     */
    skip?: number;
    /**
     * Maximum number of **pages** to take (not items).
     * By default, all items are retrieved.
     * This is useful to limit the number of pages retrieved when testing or sampling.
     */
    take?: number;
    /**
     * Function to extract items from the page response
     * @param responseBody The response body of the page
     * @returns The items in the page
     */
    getItems(responseBody: TPage): TItem[];
    /**
     * Function to extract the next page link from the current URL and page response
     * @param currentUrl The current request URL
     * @param responseBody The response body of the page
     * @returns The next page link, or `undefined` if there are no more pages
     */
    getNextPageLink(
        currentUrl: string,
        responseBody: TPage
    ): string | undefined;
}

/**
 * Base paginate request options, without `getItems` and `getNextPageLink`,
 * to be used on functions that create pagination options with those two required properties.
 */
export type BasePaginateRequestOptions = Omit<
    PaginateRequestOptions<unknown, unknown>,
    'getItems' | 'getNextPageLink'
>;
