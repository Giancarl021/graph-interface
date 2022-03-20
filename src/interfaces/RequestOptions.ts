import HttpHeaders from './HttpHeaders';
import KeyMapper from './KeyMapper';
import Nullable from './util/Nullable';

interface RequestOptions {
    useCache: boolean;
    method: string;
    headers: HttpHeaders
    body: any;
    keyMapper: Nullable<KeyMapper>;
}

export default RequestOptions;