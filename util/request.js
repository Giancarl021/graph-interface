const request = require('request');
const createObjectHandler = require('./object');

// Request functions

function get(options) {
    return new Promise((resolve, reject) => {
        request(options, (err, res) => {
            if (err) return reject(err);
            if(res.statusCode === 204) {
                return {};
            }
            return resolve(JSON.parse(res.body));
        });
    });
}

async function pagination(getOptions, limit = null, offset = null) {
    if (limit === 0) return [];
    let r = [],
        i = 0;
    let url = getOptions.url;
    if (offset) {
        let i = 0;
        while (i < offset && url) {
            const content = await getContent(url);
            url = content['@odata.nextLink'] || '';
            i++;
        }
    }

    while (url.length) {
        const content = await getContent(url);
        r = r.concat(content.value);
        url = (limit && ++i >= limit ? '' : (content['@odata.nextLink'] || ''));
    }
    return r;

    async function getContent(url) {
        if (url) getOptions.url = url;
        const content = await get(getOptions);
        if (content.error) {
            throw new Error(content.error.message);
        }
        return content;
    }
}

async function cycle(map, pulse) {
    let r = {};
    const object = createObjectHandler(r);
    for (const key in map) {
        const options = map[key];
        r[key] = new Promise(resolve => {
            get(options)
                .then(resolve)
                .catch(() => resolve(null))
        });

        if(object.size() % pulse === 0) {
            await object.awaitAll();
        }
    }
    
    await object.awaitAll();

    return r;
}

// Helper functions

function requireParams(source, params) {
    if (!source || typeof source !== 'object') {
        throw new Error('Invalid credentials');
    }
    const missing = [];
    const r = {};
    for (const param of params) {
        const [a, b, c] = alias(param);
        if (!source[a] && !source[b] && !source[c]) {
            missing.push(b);
        } else {
            r[b] = source[a] || source[b] || source[c];
        }
    }

    if (missing.length) {
        throw new Error(`Missing parameter${missing.length > 1 ? 's' : ''} in credentials object: ${missing.join(', ')}`);
    }

    return r;

    function alias(param) {
        return [
            param,
            param.split('-').map((w, i) => i === 0 ? w : w.slice(0, 1).toUpperCase() + w.slice(1).toLowerCase()).join(''),
            param.replace(/-/g, '_'),
        ]
    }
}

function requireOptions(source, keys) {
    const missing = [];
    for (const key of keys) {
        if (!source.hasOwnProperty(key)) missing.push(key);
    }

    if (missing.length) {
        throw new Error(`Missing key${missing.length > 1 ? 's' : ''} in options object: ${missing.join(', ')}`);
    }
}

function catchResponse(response) {
    if (!response) {
        throw new Error('Response empty');
    }
    if (response.error) {
        throw new Error(JSON.stringify(response.error_description || response.error || '', null, 2));
    }
}

module.exports = function () {
    return {
        get,
        pagination,
        cycle,
        requireOptions,
        requireParams,
        catchResponse
    }
}