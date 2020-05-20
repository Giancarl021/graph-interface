const fs = require('fs');
const { isAbsolute, join } = require('path');
const opn = require('open');

module.exports = function (path) {
    const pathToRoot = process.cwd().replace(/\\/g, '/');
    const _path = isAbsolute(path) ? path.replace(/\\/g, '/') : `${pathToRoot}/${path}`;

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