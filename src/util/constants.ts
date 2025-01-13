import type {
    KeyMapper,
    GraphOptions,
    UnitOptions,
    ListOptions,
    RequestOptions,
    ListGeneratorOptions
} from '../interfaces';
import type MassiveOptions from '../interfaces/options/MassiveOptions';
import type RawOptions from '../interfaces/options/RawOptions';

import MemoryCache from '../services/memory-cache';

const requestOptions: RequestOptions = {
    useCache: false,
    method: 'GET',
    headers: {},
    body: null,
    keyMapper: null,
    customAccessToken: undefined
};

const rawOptions: RawOptions = {
    ...requestOptions
};

const listGeneratorOptions: ListGeneratorOptions = {
    ...requestOptions,
    limit: undefined,
    offset: undefined,
    waitingTimeBetweenPages: undefined,
    startingFromToken: undefined
};

delete (rawOptions as any)['keyMapper'];
delete (listGeneratorOptions as any)['useCache'];

export default {
    options: {
        main: {
            version: 'v1.0',
            cacheAccessTokenByDefault: true,
            logger: undefined,
            cacheService: MemoryCache(),
            authenticationProvider: undefined
        } as GraphOptions,
        raw: rawOptions,
        unit: requestOptions as UnitOptions,
        list: {
            ...requestOptions,
            ...listGeneratorOptions
        } as ListOptions,
        listGenerator: listGeneratorOptions,
        massive: {
            ...requestOptions,
            headers: null,
            batchRequestHeaders: {},
            attempts: 3,
            requestsPerAttempt: 50,
            binderIndex: 0,
            nullifyErrors: false,
            values: null,
            waitingTimeBetweenBatches: undefined
        } as MassiveOptions
    },
    keyMappers: {
        accessToken: {
            access_token: 'accessToken',
            expires_in: 'expiresIn',
            token_type: 'tokenType',
            refresh_token: 'refreshToken',
            ext_expires_in: 'extExpiresIn',
            expires_on: 'expiresOn',
            not_before: 'notBefore',
            resource: 'resource'
        } as KeyMapper
    }
} as const;
