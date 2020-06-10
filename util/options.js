const subDefault = {
    saveOn: null,
    method: 'GET',
    cache: {
        expiresIn: null
    }
}

const listDefault = {
    map: null,
    filter: null,
    reduce: null
}

const defaultOptions = {
    main: {
        version: 'v1.0',
        supressWarnings: false,
        cache: {
            type: null,
            tokenCache: true,
            fs: {
                cleanupInterval: 3600,
                path: '.gphcache',
            },
            redis: {
                host: '127.0.0.1',
                port: 6379,
                family: 'IPv4',
                db: null,
                password: null,
                url: null,
                path: null
            }
        }
    },
    token: {
        saveOn: null
    },
    unit: {
        ...subDefault,
        fields: []
    },
    list: {
        ...subDefault,
        ...listDefault,
        limit: null,
        offset: null
    },
    massive: {
        ...subDefault,
        ...listDefault,
        attempts: 3,
        binder: null,
        requestsPerCycle: 50,
        type: null
    }
};

function fillOptions(options, filler) {
    const f = typeof filler === 'object' ? filler : defaultOptions[filler];
    for (const key in f) {
        if (!options.hasOwnProperty(key)) {
            options[key] = f[key];
        } else if(typeof f[key] === 'object') {
            const obj = options[key];
            fillOptions(obj, f[key]);
            options[key] = obj;
        }
    }
}

function nullifyOptions(options) {
    const r = { ...options };
    for (const key in r) {
        if(r[key] === null) delete r[key];
    }

    return r;
}

module.exports = {
    defaultOptions,
    fillOptions,
    nullifyOptions
};