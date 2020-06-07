const createRequestHandler = require('./util/request');
const createCacheHandler = require('./util/cache');
const createResponseHandler = require('./util/response');
const createObjectHandler = require('./util/object');
const createHash = require('./util/hash');

const {
    defaultOptions,
    fillOptions
} = require('./util/options');

module.exports = function (credentials, mainOptions = defaultOptions.main) {
    fillOptions(mainOptions, 'main');
    const endpoint = `https://graph.microsoft.com/${mainOptions.version}`;
    const request = createRequestHandler();
    const responser = createResponseHandler();
    const {
        tenantId,
        clientId,
        clientSecret
    } = request.requireParams(credentials, ['tenant-id', 'client-id', 'client-secret']);

    const tokenCache = createCacheHandler(`.gphcache/${createHash(clientId + clientSecret + tenantId)}`, mainOptions.cache.cleanupInterval);

    async function getToken(options = defaultOptions.token) {
        fillOptions(options, 'token');
        const getOptions = {
            method: 'POST',
            url: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            formData: {
                client_id: clientId,
                client_secret: clientSecret,
                scope: 'https://graph.microsoft.com/.default',
                grant_type: 'client_credentials'
            }
        };

        if (mainOptions.tokenCache && tokenCache.hasCache()) {
            return responser.save(tokenCache.getCache().access_token, options);
        } else {
            const response = await request.get(getOptions);
            request.catchResponse(response);
            if (mainOptions.tokenCache) {
                tokenCache.setCache(response, response.expires_in);
            }
            return responser.save(response.access_token, options);
        }
    }

    async function unit(url, options = defaultOptions.unit) {
        fillOptions(options, 'unit');
        const cache = options.cache.expiresIn ? createCacheHandler(`.gphcache/${createHash(clientId + clientSecret + tenantId + url + JSON.stringify(options))}`) : null;
        if (cache && cache.hasCache()) {
            return responser.save(cache.getCache(), options);
        }

        const token = await getToken();
        const getOptions = {
            url: `${endpoint}/${url}`,
            method: options.method,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        let response = await request.get(getOptions);
        request.catchResponse(response);

        if (Array.isArray(response.value)) {
            warn('Response value is an Array, please verify if you are using the correct request or method.');
        }

        if (typeof response === 'object') {
            if (options.fields && options.fields.length) {
                const obj = createObjectHandler(response);
                response = obj.fields(options.fields);
            }
        } else {
            warn('Response is not an Object, please verify if you are using the correct request or method.');
        }

        if (cache) {
            cache.setCache(response, options.cache.expiresIn);
        }
        return responser.save(response, options);
    }

    async function list(url, options = defaultOptions.list) {
        fillOptions(options, 'list');
        const cache = options.cache.expiresIn ? createCacheHandler(`.gphcache/${createHash(clientId + clientSecret + tenantId + url + JSON.stringify(options))}`) : null;
        if (cache && cache.hasCache()) {
            return responser.save(cache.getCache(), options);
        }
        const token = await getToken();
        const getOptions = {
            url: `${endpoint}/${url}`,
            method: options.method,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        let response = await request.pagination(getOptions, options.limit, options.offset);
        request.catchResponse(response);
        if (Array.isArray(response)) {
            if (options.filter) response = response.filter(options.filter);
            if (options.map) response = response.map(options.map);
            if (options.reduce) response = response.reduce(options.reduce);
        } else {
            warn('Response is not an Array, please verify if you are using the correct request or method.');
        }

        if (cache) {
            cache.setCache(response, options.cache.expiresIn);
        }
        return responser.save(response, options);
    }

    function warn(message) {
        if (!mainOptions.supressWarnings) {
            console.warn('[!] Warning: ' + message);
        }
    }

    return {
        getToken,
        unit,
        list
    }
}