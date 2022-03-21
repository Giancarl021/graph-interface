import { KeyMapper, GraphOptions, UnitOptions, ListOptions, RequestOptions } from '../interfaces';
import MemoryCache from '../services/memory-cache';

interface Constants {
    options: {
        main: GraphOptions;
        unit: UnitOptions;
        list: ListOptions;
    },
    keyMappers: {
        accessToken: KeyMapper;
    }
}

const requestOptions: RequestOptions = {
    useCache: false,
    method: 'GET',
    headers: {},
    body: null,
    keyMapper: null
}

const constants: Constants = {
    options: {
        main: {
            version: 'v1.0',
            cacheAccessTokenByDefault: true,
            logger: undefined,
            cacheService: MemoryCache(),
            authenticationProvider: undefined
        },
        unit: requestOptions,
        list: {
            ...requestOptions,
            limit: undefined,
            offset: undefined
        }
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
        }
    }
};

export default constants;