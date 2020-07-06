const createRequestHandler = require('./util/request');
const createCacheInterface = require('./services/cache');
const createResponseHandler = require('./util/response');
const createObjectHandler = require('./util/object');
const createHash = require('./util/hash');
const createPatternParser = require('./util/pattern');
const createMassiveRequestHandler = require('./services/massive');
const {
    defaultOptions,
    fillOptions
} = require('./util/options');

module.exports = async function (credentials, mainOptions = defaultOptions.main) {
    fillOptions(mainOptions, 'main');
    const endpoint = `https://graph.microsoft.com/${mainOptions.version}`;
    const request = createRequestHandler();
    const responser = createResponseHandler();
    const {
        tenantId,
        clientId,
        clientSecret
    } = request.requireParams(credentials, ['tenant-id', 'client-id', 'client-secret']);

    let createCacheHandler, closeConnections;
    try {
        const cacheData = await createCacheInterface(mainOptions.cache);
        createCacheHandler = cacheData.interface,
            closeConnections = cacheData.closeConnections;
    } catch (err) {
        throw err;
    }

    async function getToken(options = defaultOptions.token) {
        fillOptions(options, 'token');
        const cache = await createCacheHandler(createHash(clientId + clientSecret + tenantId));
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

        if (mainOptions.cache.tokenCache && await cache.exists()) {
            return responser.save((await cache.get()).access_token, options);
        } else {
            const response = await request.get(getOptions);
            request.catchResponse(response);
            if (mainOptions.cache.tokenCache) {
                await cache.set(response, response.expires_in);
            }
            return responser.save(response.access_token, options);
        }
    }

    async function unit(url, options = defaultOptions.unit) {
        fillOptions(options, 'unit');
        const cache = options.cache.expiresIn ? await createCacheHandler(createHash(clientId + clientSecret + tenantId + url + JSON.stringify(options))) : null;
        if (cache && await cache.exists()) {
            return responser.save(await cache.get(), options);
        }

        const token = await getToken();
        const getOptions = {
            url: `${endpoint}/${url}`,
            method: options.method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        try {
            if (options.body && typeof options.body === 'string') {
                options.body = JSON.parse(options.body);
            }
        } catch (err) {
            throw new Error('Body Parsing Error: ' + err.message);
        }

        if (options.body) getOptions.body = JSON.stringify(options.body);

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
            await cache.set(response, options.cache.expiresIn);
        }
        return responser.save(response, options);
    }

    async function list(url, options = defaultOptions.list) {
        fillOptions(options, 'list');
        const cache = options.cache.expiresIn ? await createCacheHandler(createHash(clientId + clientSecret + tenantId + url + JSON.stringify(options))) : null;
        if (cache && await cache.exists()) {
            return responser.save(await cache.get(), options);
        }
        const token = await getToken();
        const getOptions = {
            url: `${endpoint}/${url}`,
            method: options.method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        try {
            if (options.body && typeof options.body === 'string') {
                options.body = JSON.parse(options.body);
            }
        } catch (err) {
            throw new Error('Body Parsing Error: ' + err.message);
        }

        if (options.body) getOptions.body = JSON.stringify(options.body);

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
            await cache.set(response, options.cache.expiresIn);
        }
        return responser.save(response, options);
    }

    async function massive(urlPattern, values, options = defaultOptions.massive) {
        fillOptions(options, 'massive');

        if (!values || typeof values !== 'object' || Array.isArray(values)) {
            throw new Error('Values parameter must be an valid object');
        }

        if (typeof options.cycle.requests !== 'number') {
            throw new Error('Option requestPerCycle must be an valid number');
        }

        if (typeof options.cycle.attempts !== 'number') {
            throw new Error('Option attempts must be an valid number');
        }

        if (!options.binder || !values.hasOwnProperty(options.binder)) {
            throw new Error('Option binder must be an key of values object');
        }

        if (!['unit', 'list'].includes(options.type)) {
            throw new Error('The key "type" must have the value "unit" or "list"');
        }

        try {
            if (options.body && typeof options.body === 'string') {
                options.body = JSON.parse(options.body);
            }
        } catch (err) {
            throw new Error('Body Parsing Error: ' + err.message);
        }

        const cache = options.cache.expiresIn ? await createCacheHandler(createHash(clientId + clientSecret + tenantId + urlPattern + JSON.stringify(options))) : null;
        if (cache && await cache.exists()) {
            return responser.save(await cache.get(), options);
        }

        const pattern = createPatternParser(urlPattern, /{[^{}]*?}/g, /({|})*/g);
        const urls = pattern.replaceArray(values);
        if (!urls.length) return [];

        const token = await getToken();

        const binder = {};

        let i = 0;
        for (const url of urls) binder[url] = values[options.binder][i++];

        const requester = createMassiveRequestHandler(
            urls,
            token,
            binder,
            endpoint,
            options.method,
            options.body,
            options.type,
            options.cycle.requests,
            options.cycle.async,
            options.cycle.attempts
        );

        const response = await requester.request();

        if (cache) {
            await cache.set(response, options.cache.expiresIn);
        }
        return responser.save(response, options);
    }

    async function close() {
        await closeConnections();
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
        massive,
        close
    }
}