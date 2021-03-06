const fs = require('fs');
const { isAbsolute, dirname } = require('path');

module.exports = function (path) {
    const pathToRoot = dirname(require.main.filename).replace(/\\/g, '/');
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

    return {
        save,
        load,
        remove,
        exists,
        path: _path
    }
}