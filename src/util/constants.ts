import { Options, TokenOptions } from '../..';
import { KeyMapper } from '../interfaces';
import MemoryCache from '../services/memory-cache';

interface Constants {
    options: {
        main: Options;
        token: TokenOptions;
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
        token: {
            useCache: true
        }
    },
    keyMappers: {
        accessToken: {
            accessToken: 'access_token',
            expiresIn: 'expires_in',
            tokenType: 'token_type',
            refreshToken: 'refresh_token',
            extExpiresIn: 'ext_expires_in',
            expiresOn: 'expires_on',
            notBefore: 'not_before',
            resource: 'resource'
        }
    }
};

export default constants;