const requestDefault = {
    saveOn: null,
    method: 'GET'
}

module.exports = {
    main: {
        createCache: true,
        saveOn: null
    },
    getToken: {
        createCache: true,
        saveOn: null
    },
    unit: {
        ...requestDefault
    },
    list: {
        ...requestDefault,
        map: null,
        filter: null
    },
    massive: {
        ...requestDefault,
        map: null,
        filter: null
    }
};