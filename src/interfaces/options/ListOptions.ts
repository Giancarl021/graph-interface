import RequestOptions from './RequestOptions';

/**
 * The options for a list request
 */
interface ListOptions extends RequestOptions {
    /**
     * The maximum number of pages to return
     */
    limit?: number;
    /**
     * The number of pages to skip
     */
    offset?: number;
    /**
     * The time to wait between pages in milliseconds
     */
    waitingTimeBetweenPages?: number;
    /**
     * The `$skipToken` to start from when fetching the list
     */
    startingFromToken?: string;
}

export default ListOptions;
