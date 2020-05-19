const createRequestHandler = require('./util/request');
const createCacheHanlder = require('./util/cache');
const createHash = require('./util/hash');

module.exports = function (credentials, options = { createCache: true }) {
    const request = createRequestHandler();

    const params = request.requireParams(credentials, ['tenant-id', 'client-id', 'client-secret']);
    const { tenantId, clientId, clientSecret } = params;
    const cache = createCacheHanlder(`cache/${createHash(params)}`);
    
    async function getToken() {
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
            return cache.getCache().access_token;
        } else {
            const response = await request.get(getOptions);
            request.catchResponse(response);
            if(options.createCache) {
                cache.setCache(response, response.expires_in * 60000);
            }
            return response.access_token;
        }
    }

    async function unit(url, options) {
        const token = await getToken();
    }

    async function list(url, options = {}) {
        const token = await getToken();
        const getOptions = {
            url,
            method: options.method || 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        
        let response = await request.pagination(getOptions);
        request.catchResponse(response);
        if(Array.isArray(response)) {
            if(options.filter) response = response.filter(options.filter);
            if(options.map) response = response.map(options.map);
        } else {
            console.warn('Response is not an Array, please verify if you are using the correct request type');
        }
        return response;
    }

    async function massive(url, options) {
        const token = await getToken();

    }

    return {
        getToken,
        unit,
        list,
        massive
    }
}