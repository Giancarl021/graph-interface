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
                port: 6379
            }
        },
        cache: {
            cleanupInterval: 3600
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
        requestsPerCycle: 50,
        type: null
    }
};

function fillOptions(options, filler) {
    const f = defaultOptions[filler];
    for (const key in f) {
        if (!options.hasOwnProperty(key)) {
            options[key] = f[key];
        }
    }
}

module.exports = {
    defaultOptions,
    serviceOptions,
    fillOptions
};