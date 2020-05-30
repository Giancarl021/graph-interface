const createJsonHandler = require('./json');

module.exports = function () {
    function save(response, options) {
        const path = options.saveOn;
        if (path) {
            const filename = Date.now();
            const json = createJsonHandler(path === '.' ? filename : `${path}/${filename}`);
            json.save(response);
        }
        return response;
    }

    return {
        save
    };
}