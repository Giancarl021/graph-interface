import type PaginateRequestOptions from '../../interfaces/PaginateRequestOptions.js';
import type { BasePaginateRequestOptions } from '../../interfaces/PaginateRequestOptions.js';

/**
 * OData page response type
 */
interface TPage<TItem> {
    /**
     * The items in the page
     */
    value: TItem[];
    /**
     * The next page link, if any (OData v4+ standard property name)
     * This property takes precedence over `nextLink` if both are present.
     */
    '@odata.nextLink'?: string;
    /**
     * The next page link, if any (non-standard property name sometimes used)
     * This property is ignored if `@odata.nextLink` is present.
     */
    nextLink?: string;
}

/**
 * Create OData pagination options
 * @param options Base paginate request options
 * @typeparam TItem The type of the items in the page
 * @returns Paginate request options with OData-specific `getItems` and `getNextPageLink` implementations
 */
export default function ODataPaginationOptions<TItem>(
    options: BasePaginateRequestOptions = {}
): PaginateRequestOptions<TPage<TItem>, TItem> {
    /**
     * Get the items from the page response
     * @param page The page response
     * @returns The items in the page
     */
    function getItems(page: TPage<TItem>): TItem[] {
        return page.value;
    }

    /**
     * Get the next page link from the page response
     * @param _currentUrl The current request URL (not used)
     * @param page The page response
     * @returns The next page link, or `undefined` if there are no more pages
     */
    function getNextPageLink(
        _currentUrl: string,
        page: TPage<TItem>
    ): string | undefined {
        // Prefer the OData standard property name if present
        return page['@odata.nextLink'] ?? page.nextLink ?? undefined;
    }

    return {
        ...options,
        getItems,
        getNextPageLink,
        getOptions: undefined
    };
}
