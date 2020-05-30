const createRequestHandler = require('./util/request');
const createCacheHanlder = require('./util/cache');
const createResponseHandler = require('./util/response');
const createObjectHandler = require('./util/object');
const createHash = require('./util/hash');
const createPatternParser = require('./util/pattern');
const {
    defaultOptions,
    fillOptions
} = require('./util/options');

module.exports = function (credentials, mainOptions = defaultOptions.main) {
    fillOptions(mainOptions, 'main');
    const endpoint = `https://graph.microsoft.com/${mainOptions.version}`;
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

        if (mainOptions.tokenCache && cache.hasCache()) {
            return responser.save(cache.getCache().access_token, options);
        } else {
            const response = await request.get(getOptions);
            request.catchResponse(response);
            if (mainOptions.tokenCache) {
                cache.setCache(response, response.expires_in * 1000);
            }
            return responser.save(response.access_token, options);
        }
    }

    async function unit(url, options = defaultOptions.unit) {
        fillOptions(options, 'unit');
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
                return responser.save(obj.fields(options.fields), options);
            }
        } else {
            warn('Response is not an Object, please verify if you are using the correct request or method.');
        }

        return responser.save(response, options);
    }

    async function list(url, options = defaultOptions.list) {
        fillOptions(options, 'list');
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

        return responser.save(response, options);
    }

    async function massive(urlPattern, values, options = defaultOptions.massive) {
        request.requireOptions(options, ['type']);
        if (!['unit', 'list'].includes(options.type)) {
            throw new Error('The key "type" must have the value "unit" or "list"');
        }

        fillOptions(options, 'massive');

        const pattern = createPatternParser(urlPattern, /{[^{}]*?}/g, /({|})*/g);
        const urls = pattern.replaceArray(values);
        if (!urls.length) return [];

        const token = await getToken();
        const getOptions = {};

        const binder = buildRequests(urls, getOptions, values);

        let fallback = [];
        let failures = 0;

        if (typeof options.requestsPerCycle !== 'number') {
            throw new Error('Option requestPerCycle must be an valid number');
        }

        if (typeof options.attempts !== 'number') {
            throw new Error('Option attemps must be an valid number');
        }

        let response = await request.cycle(
            getOptions,
            options.requestsPerCycle,
            fallback
        );

        while (fallback.length || (fallback.length && failures < options.attempts)) {
            const temp = [];
            const o = {};
            buildRequests(fallback, o, values, binder);
            response = {
                ...response,
                ...await request.cycle(
                    o,
                    options.requestsPerCycle,
                    temp
                )
            };
            if (fallback.length === temp.length) failures++;
            fallback = temp;
        }

        require('fs').writeFileSync('responses/mid.json', JSON.stringify(response, null, 4));

        response = buildResponses(response, options.type, values, binder);

        return responser.save(response, options);

        function buildRequests(urls, destination, values, bind = null) {
            const keys = Object.keys(values);
            const binder = bind || keys[Math.floor(Math.random() * keys.length)];
            const ids = values[binder];
            const chunk = 20;
            const requests = urls.map((url, i) => ({
                url,
                method: options.method,
                id: ids[i]
            }));

            for (let i = 0; i < urls.length; i += chunk) {
                destination[`${i}-${Math.min(i + chunk, urls.length) - 1}`] = {
                    url: `${endpoint}/$batch`,
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        requests: requests.slice(i, Math.min(i + chunk, urls.length))
                    })
                };
            }

            return binder;
        }

        function buildResponses(response, type, values, binder) {
            const r = {};
            const keys = values[binder];
            for (const key in response) {
                let [j, l] = key.split('-');
                for(; j <= l; j++) {
                    const item = response[key].responses.find(item => item.id === keys[j]);
                    const temp = item && item.body ? item.body : null;
                    if(temp && temp.error) {
                        warn('Request Error: ' + key + ':' + keys[j]);
                        continue;
                    }
                    r[keys[j]] = type === 'unit' ? temp || null : (temp && temp.value ? temp.value : []);

                    if(options.type === 'list') {
                        if (Array.isArray(r[keys[j]])) {
                            if (options.filter) r[keys[j]] = r[keys[j]].filter(options.filter);
                            if (options.map) r[keys[j]] = r[keys[j]].map(options.map);
                            if (options.reduce) r[keys[j]] = r[keys[j]].reduce(options.reduce);
                        } else {
                            warn('Response is not an Array, please verify if you are using the correct request or method.');
                        }
                    } else if(options.map || options.reduce || options.filter) {
                        warn('Array operations will only be applied with list request type.');
                    }
                }
            }
            return r;
        }
    }

    function warn(message) {
        if (!mainOptions.supressWarnings) {
            console.warn('[!] Warning: ' + message);
        }
    }

    return {
        getToken,
        unit,
        list,
        massive
    }
}