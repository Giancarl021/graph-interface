import type HttpHeaders from '../HttpHeaders';
import type Nullable from '../util/Nullable';
import type RequestOptions from './RequestOptions';

interface MassiveOptions extends Omit<RequestOptions, 'headers'> {
    headers: Nullable<HttpHeaders>;
    batchRequestHeaders: HttpHeaders;
    values: Nullable<string[] | string[][]>;
    binderIndex: number;
    attempts: number;
    requestsPerAttempt: number;
    nullifyErrors: boolean;
    waitingTimeBetweenBatches?: number;
}

export default MassiveOptions;
