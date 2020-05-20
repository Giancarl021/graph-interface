const requestDefault = {
    saveTo: null,
    method: 'GET'
}

module.exports = {
    main: {
        createCache: true,
        saveTo: null
    },
    getToken: {
        createCache: true,
        saveTo: null
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