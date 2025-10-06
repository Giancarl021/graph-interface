import InvalidApiResponsePageError from '../../errors/InvalidApiResponsePageError.js';
import { isTableItems, parseTableItems } from '../../util/tableItems.js';
import type PaginateRequestOptions from '../../interfaces/PaginateRequestOptions.js';
import type { BasePaginateRequestOptions } from '../../interfaces/PaginateRequestOptions.js';
import type TableItems from '../../interfaces/TableItems.js';

/**
 * The properties object containing the items and nextLink
 */
interface Properties<TItem> extends TableItems<TItem> {
    /**
     * The next page link, if any
     */
    nextLink?: string;
}

/**
 * Interface representing a page of results where items are nested within a `properties` object.
 * @template TItem - The type of items contained in the page.
 */
interface TPage<TItem> {
    /**
     * The unique identifier of the resource being paginated.
     */
    id: string;
    /**
     * The name of the resource being paginated.
     */
    name?: string;
    /**
     * The type of the resource being paginated.
     */
    type?: string;
    /**
     * The properties object containing the items and nextLink.
     */
    properties: Properties<TItem>;
}

export default function InPropertiesPaginationOptions<TItem>(
    options: BasePaginateRequestOptions = {}
): PaginateRequestOptions<TPage<TItem>, TItem> {
    /**
     * Get the items from the page response
     * @param page The page response
     * @returns The items in the page
     * @throws {InvalidApiResponsePageError} if the page structure is invalid
     */
    function getItems(page: TPage<TItem>): TItem[] {
        // - Page is truthy
        // - Page has a 'properties' property
        // - 'properties' property is an object
        // - 'properties' property is not null
        // - 'properties' property conforms to TableItems<TItem>
        if (
            !page ||
            !('properties' in page) ||
            typeof page.properties !== 'object' ||
            !page.properties ||
            !isTableItems<TItem>(page.properties)
        ) {
            throw new InvalidApiResponsePageError(page);
        }

        return parseTableItems(page.properties);
    }

    /**
     * Get the next page link from the page response
     * @param _currentUrl The current request URL (not used)
     * @param page The page response
     * @returns The next page link, if any
     */
    function getNextPageLink(
        _currentUrl: string,
        page: TPage<TItem>
    ): string | undefined {
        if (page?.properties?.nextLink) {
            return page.properties.nextLink;
        }

        return undefined;
    }

    return {
        ...options,
        getItems,
        getNextPageLink,
        getOptions: undefined
    };
}
