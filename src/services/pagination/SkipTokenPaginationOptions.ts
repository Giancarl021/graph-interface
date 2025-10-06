import InvalidApiResponsePageError from '../../errors/InvalidApiResponsePageError.js';
import { isTableItems, parseTableItems } from '../../util/tableItems.js';
import type PaginateRequestOptions from '../../interfaces/PaginateRequestOptions.js';
import type { BasePaginateRequestOptions } from '../../interfaces/PaginateRequestOptions.js';
import type TableItems from '../../interfaces/TableItems.js';

/**
 * Pagination options for APIs that use `$skipToken` for pagination.
 * This function returns pagination options that can be used with the `paginate` function.
 * It handles extracting items from the response, determining the next page link,
 * and updating request options with the `$skipToken` for subsequent requests.
 */
interface FacetError {
    /**
     * The expression used for faceting that resulted in an error.
     */
    expression: string;
    /**
     * Indicates that this is a facet error.
     */
    resultType: 'FacetError';
}

/**
 * Represents a facet result from the API response.
 * This interface includes the expression used for faceting and indicates that it is a facet result.
 */
interface FacetResult {
    /**
     * The expression used for faceting.
     */
    expression: string;
    /**
     * Indicates that this is a facet result.
     */
    resultType: 'FacetResult';
}

/**
 * Interface representing a page of results from an API that uses `$skipToken` for pagination.
 * @template TItem - The type of items contained in the page.
 */
interface TPage<TItem> {
    /**
     * The total number of records available.
     */
    totalRecords: number;
    /**
     * The number of items in the current page.
     */
    count: number;
    /**
     * The data in the current page, which can be an array of items or a table structure.
     */
    data: TItem[] | TableItems<TItem>;
    /**
     * An array of facet results or errors.
     */
    facets: (FacetResult | FacetError)[];
    /**
     * Indicates whether the result set was truncated.
     */
    resultTruncated: boolean;
    /**
     * The skip token for the next page of results, if available.
     */
    $skipToken?: string;
}

/**
 * Creates pagination options for APIs that use `$skipToken` for pagination.
 * @param options - Base pagination request options.
 * @returns Pagination request options with `$skipToken` handling.
 */
export default function SkipTokenPaginationOptions<TItem>(
    options: BasePaginateRequestOptions = {}
): PaginateRequestOptions<TPage<TItem>, TItem> {
    /**
     * Function to extract items from the page response.
     * @param page - The page response.
     * @returns The items extracted from the page.
     * @throws {InvalidApiResponsePageError} if the page data is not in an expected format.
     */
    function getItems(page: TPage<TItem>): TItem[] {
        if (isTableItems<TItem>(page.data)) {
            return parseTableItems(page.data);
        }

        if (Array.isArray(page.data)) {
            return page.data;
        }

        throw new InvalidApiResponsePageError(page);
    }

    /**
     * Function to get the next page link based on the current URL and the current page of results.
     * @remarks As this pagination strategy uses the body to pass the `$skipToken`, this function will return the base URL if a `$skipToken` is present in the page.
     * The only function of this method is to signal to the pagination loop that there is a next page, as the `getOptions` function will handle adding the `$skipToken` to the request body.
     * @param currentUrl - The URL of the current request.
     * @param page - The current page of results, which may contain a `$skipToken` for the next page.
     * @returns The base URL if a `$skipToken` is present; otherwise, returns `undefined`.
     */
    function getNextPageLink(
        currentUrl: string,
        page: TPage<TItem>
    ): string | undefined {
        if (page.$skipToken) return currentUrl;

        return undefined;
    }

    /**
     * Function to get updated request options for the next page based on the current page's skip token.
     * It is non-destructive and returns a new options object if modifications are needed.
     * @param currentOptions - The current pagination request options.
     * @param page - The current page of results, which may contain a `$skipToken` for the next page.
     * @returns Updated pagination request options including the `$skipToken` if available; otherwise, returns the original options.
     */
    function getOptions(
        currentOptions: PaginateRequestOptions<TPage<TItem>, TItem>,
        page: TPage<TItem>
    ): PaginateRequestOptions<TPage<TItem>, TItem> {
        if (page.$skipToken) {
            const currentBody =
                typeof currentOptions.body === 'object' && currentOptions.body
                    ? currentOptions.body
                    : {};
            const currentBodyOptions =
                'options' in currentBody &&
                typeof currentBody.options === 'object'
                    ? currentBody.options
                    : {};

            return {
                ...currentOptions,
                body: {
                    ...currentBody,
                    options: {
                        ...currentBodyOptions,
                        $skipToken: page.$skipToken
                    }
                }
            };
        }

        return currentOptions;
    }

    return {
        ...options,
        getItems,
        getNextPageLink,
        getOptions
    };
}
