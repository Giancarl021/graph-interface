const createRequestHandler = require('./util/request');
const createCacheHanlder = require('./util/cache');
const createHash = require('./util/hash');

module.exports = function (credentials) {
    const params = requireParams(credentials, ['tenant-id', 'client-id', 'client-secret']);    
    const { tenantId, clientId, clientSecret } = params;
    const request = createRequestHandler();
    const cache = createCacheHanlder(`cache/${hash(params)}`);
    
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
            if(response.error) {
                throw new Error(response.error);
            }
            cache.setCache(response, response.expires_in * 60000);
            return response.access_token;
        }
    }

    return {
        getToken,
        getAllUsers
    }
}

function requireParams(source, params) {
    if(!source || typeof source !== 'object') {
        throw new Error('Invalid credentials');
    }
    const missing = [];
    const r = {};
    for(const param of params) {
        const [a, b] = alias(param);
        console.log(a,b);
        if(!source[a] && !source[b]) {
            missing.push(a);
        } else {
            r[a] = source[a] || source[b];
        }
    }

    if(missing.length) {
        throw new Error(`Missing parameter${missing.length > 1 ? 's' : ''} in credentials object: ${missing.join(', ')}`);
    }

    return r;

    function alias(param) {
        return [
            param,
            param.split('-').map((w,i) => i === 0 ? w : w.slice(0,1).toUpperCase() + w.slice(1).toLowerCase()).join('')
        ]
    }
}