const fs = require('fs');
const opn = require('open');

module.exports = function (path) {

    const pathToRoot = __dirname.replace(/\\/g, '/') + '/../..';
    const _path = `${pathToRoot}/${path}`;

    function save(data) {
        fs.writeFileSync(_path, data);
    }

    function load() {
        return fs.readFileSync(_path, 'utf-8');
    }

    function remove() {
        fs.unlinkSync(_path);
    }

    function exists() {
        return fs.existsSync(_path);
    }

    async function open() {
        opn(_path);
    }

    return {
        save,
        load,
        remove,
        exists,
        open
    }
}