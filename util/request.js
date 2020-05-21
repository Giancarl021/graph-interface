const request = require('request');

// Request functions

function get(options) {
    return new Promise((resolve, reject) => {
        request(options, (err, res) => {
            if (err) return reject(err);
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

async function massive() {
    // TODO
}

// Helper functions

function requireParams(source, params) {
    if (!source || typeof source !== 'object') {
        throw new Error('Invalid credentials');
    }
    const missing = [];
    const r = {};
    for (const param of params) {
        const [a, b] = alias(param);
        if (!source[a] && !source[b]) {
            missing.push(a);
        } else {
            r[b] = source[a] || source[b];
        }
    }

    if (missing.length) {
        throw new Error(`Missing parameter${missing.length > 1 ? 's' : ''} in credentials object: ${missing.join(', ')}`);
    }

    return r;

    function alias(param) {
        return [
            param,
            param.split('-').map((w, i) => i === 0 ? w : w.slice(0, 1).toUpperCase() + w.slice(1).toLowerCase()).join('')
        ]
    }
}

function requireOptions(source, keys) {
    const missing = [];
    for (const key of keys) {
        if (!source[key]) missing.push(key);
    }

    if (missing.length) {
        throw new Error(`Missing key${missing.length > 1 ? 's' : ''} in options object: ${missing.join(', ')}`);
    }
}

function catchResponse(response) {
    if (response.error) {
        throw new Error(response.error_description || response.error);
    }
}

module.exports = function () {
    return {
        get,
        pagination,
        massive,
        requireOptions,
        requireParams,
        catchResponse
    }
}