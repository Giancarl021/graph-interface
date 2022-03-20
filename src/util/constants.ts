import { Options, UnitOptions } from '../..';
import { KeyMapper } from '../interfaces';
import MemoryCache from '../services/memory-cache';

interface Constants {
    options: {
        main: Options;
        unit: UnitOptions;
    },
    keyMappers: {
        accessToken: KeyMapper;
    }
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
        unit: {
            useCache: false,
            method: 'GET',
            headers: {},
            body: null,
            keyMapper: null
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