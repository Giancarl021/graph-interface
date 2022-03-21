import RequestOptions from './RequestOptions';

interface ListOptions extends RequestOptions {
    limit?: number;
    offset?: number;
}

export default ListOptions;