const subDefault = {
    saveOn: null,
    method: 'GET',
    cache: {
       id: null,
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
        tokenCache: true,
        supressWarnings: false
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
    fillOptions
};