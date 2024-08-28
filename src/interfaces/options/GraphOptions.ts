import AuthenticationProvider from '../AuthenticationProvider';
import CacheService from '../CacheService';
import Logger from '../Logger';

interface GraphOptions {
    version: string;
    logger?: Logger;
    authenticationProvider?: AuthenticationProvider;
    cacheService?: CacheService;
    cacheAccessTokenByDefault: boolean;
}

export default GraphOptions;
