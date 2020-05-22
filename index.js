const createRequestHandler = require('./util/request');
const createCacheHanlder = require('./util/cache');
const createResponseHandler = require('./util/save');
const createObjectHandler = require('./util/object');
const createHash = require('./util/hash');
const createPatternParser = require('./util/pattern');
const {
    defaultOptions,
    fillOptions
} = require('./util/options');

module.exports = function (credentials, mainOptions = defaultOptions.main) {
    fillOptions(mainOptions, 'main');
    const request = createRequestHandler();
    const responser = createResponseHandler(mainOptions);
    const params = request.requireParams(credentials, ['tenant-id', 'client-id', 'client-secret']);
    const {
        tenantId,
        clientId,
        clientSecret
    } = params;

    const cache = createCacheHanlder(`.gphcache/${createHash(params)}`);

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
        fillOptions(options, 'unit');
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

        if (Array.isArray(response.value)) {
            warn('[!] Warning: Response value is an Array, please verify if you are using the correct request or method.');
        }

        if (typeof response === 'object') {
            if (options.fields && options.fields.length) {
                const obj = createObjectHandler(response);
                return responser.save(obj.fields(options.fields), options);
            }
        } else {
            warn('[!] Warning: Response is not an Object, please verify if you are using the correct request or method.');
        }

        return responser.save(response, options);
    }

    async function list(url, options = defaultOptions.list) {
        fillOptions(options, 'list');
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
            warn('[!] Warning: Response is not an Array, please verify if you are using the correct request or method.');
        }

        return responser.save(response, options);
    }

    async function massive(urlPattern, values, options = defaultOptions.massive) {
        fillOptions(options, 'massive');
        const pattern = createPatternParser(urlPattern, /{[^{}]*?}/g, /({|})*/g);
        const urls = pattern.replaceArray(values);
        if (!urls.length) return [];

        const token = await getToken();
        const getOptions = {};

        for (const url of urls) {
            getOptions[url] = {
                url,
                method: options.method || 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };
        }

        let fallback = [];
        let response = await request.cycle(getOptions, options.requestsPerCycle, fallback);

        return responser.save(response, options);
    }

    function warn(message) {
        if (!mainOptions.supressWarnings) {
            console.warn(message);
        }
    }

    return {
        getToken,
        unit,
        list,
        massive
    }
}