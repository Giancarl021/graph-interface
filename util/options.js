const subDefault = {
    saveOn: null,
    method: 'GET'
}

const listDefault = {
    map: null,
    filter: null,
    reduce: null
}

const defaultOptions = {
    main: {
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
            options[key] = filler[key];
        }
    }
}

module.exports = {
    defaultOptions,
    fillOptions
};