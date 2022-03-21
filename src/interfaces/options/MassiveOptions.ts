import HttpHeaders from '../HttpHeaders';
import Nullable from '../util/Nullable';
import RequestOptions from './RequestOptions';

interface MassiveOptions extends Omit<RequestOptions, 'headers'> {
    headers: Nullable<HttpHeaders>;
    batchRequestHeaders: HttpHeaders;
    values: Nullable<string[] | string[][]>;
    binderIndex: number;
    attempts: number;
    requestsPerAttempt: number;
    nullifyErrors: boolean;
}

export default MassiveOptions;