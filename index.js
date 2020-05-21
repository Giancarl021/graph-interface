const createRequestHandler = require('./util/request');
const createCacheHanlder = require('./util/cache');
const createResponseHandler = require('./util/save');
const createHash = require('./util/hash');
const defaultOptions = require('./util/options');

module.exports = function (credentials, mainOptions = defaultOptions.main) {
    const request = createRequestHandler();
    const responser = createResponseHandler(mainOptions);
    const params = request.requireParams(credentials, ['tenant-id', 'client-id', 'client-secret']);
    const {
        tenantId,
        clientId,
        clientSecret
    } = params;
    const cache = createCacheHanlder(`cache/${createHash(params)}`);

    async function getToken(options = defaultOptions.getToken) {
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

        if (cache.hasCache()) {
            return responser.save(cache.getCache().access_token, options);
        } else {
            const response = await request.get(getOptions);
            request.catchResponse(response);
            if (options.createCache || mainOptions.createCache) {
                cache.setCache(response, response.expires_in * 1000);
            }
            return responser.save(response.access_token, options);
        }
    }

    async function unit(url, options = defaultOptions.unit) {
        const token = await getToken();
        const getOptions = {
            url,
            method: options.method || 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        let response = await request.get(getOptions);
        request.catchResponse(response);
        console.log(response);
        // if (Array.isArray(response)) {
        //     if (options.filter) response = response.filter(options.filter);
        //     if (options.map) response = response.map(options.map);
        // } else {
        //     console.warn('[!] Warning: Response is not an Array, please verify if you are using the correct request type');
        // }

        return responser.save(response, options);
    }

    async function list(url, options = defaultOptions.list) {
        const token = await getToken();
        const getOptions = {
            url,
            method: options.method || 'GET',
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
            console.warn('[!] Warning: Response is not an Array, please verify if you are using the correct request type');
        }

        return responser.save(response, options);
    }

    async function massive(url, options = defaultOptions.massive) {
        const token = await getToken();

    }

    return {
        getToken,
        unit,
        list,
        massive
    }
}