const subDefault = {
    saveOn: null,
    method: 'GET'
}

const listDefault = {
    map: null,
    filter: null,
    reduce: null
}

module.exports = {
    main: {
        createCache: true,
        saveOn: null,
        supressWarnings: false
    },
    getToken: {
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
        ...listDefault
    }
};