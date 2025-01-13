import RequestOptions from './RequestOptions';

interface ListOptions extends RequestOptions {
    limit?: number;
    offset?: number;
    waitingTimeBetweenPages?: number;
}

export default ListOptions;
