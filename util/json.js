const createFileHandler = require('./file');

module.exports = function (path) {
    const extension = /\.json$/.test(path) ? '' : '.json';
    const file = createFileHandler(`${path}${extension}`);

    function save(data) {
        file.save(JSON.stringify(data, null, 4));
    }

    function load() {
        return JSON.parse(file.load());
    }

    return {
        save,
        load,
        remove: file.remove,
        exists: file.exists
    }
}