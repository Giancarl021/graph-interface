import GraphInterfaceMemoryCache from '../services/GraphInterfaceMemoryCache.js';

import type { FilledGraphInterfaceOptions } from '../interfaces/GraphInterfaceOptions.js';
import type GraphInterfaceTokenOptions from '../interfaces/GraphInterfaceTokenOptions.js';

export default {
    endpoints: {
        baseUrl: 'https://graph.microsoft.com',
        batchResource: '$batch'
    },
    defaultOptions: {
        main: {
            version: 'v1.0',
            logger: null,
            authenticationProvider: null,
            cacheAccessTokenByDefault: true,
            cacheService: GraphInterfaceMemoryCache()
        } as FilledGraphInterfaceOptions,
        token: {
            useCache: true
        } as GraphInterfaceTokenOptions
    },
    batch: {
        requestSize: 20
    },
    authentication: {
        scope: 'https://graph.microsoft.com/.default',
        grantType: 'client_credentials'
    }
} as const;
