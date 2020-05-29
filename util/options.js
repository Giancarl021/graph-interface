const subDefault = {
    saveOn: null,
    method: 'GET',
    cache: {
       id: null,
       hash: true,
       expiresIn: 3600
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
        createCache: true,
        saveOn: null,
        supressWarnings: false
    },
    token: {
        createCache: true,
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
        requestsPerCycle: 250,
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
    fillOptions
};