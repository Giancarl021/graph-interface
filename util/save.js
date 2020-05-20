const createJsonHandler = require('./json');

module.exports = function (mainOptions = {}) {
    function save(response, options) {
        const path = options.saveTo || mainOptions.saveTo;
        if (path) {
            const json = createJsonHandler(path === '.' ? 'response' : path);
            json.save(response);
        }
        return response;
    }

    return {
        save
    };
}