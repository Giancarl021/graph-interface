const fs = require('fs');
const { isAbsolute } = require('path');

module.exports = function (path) {

    const pathToRoot = process.cwd().replace(/\\/g, '/');
    const _path = isAbsolute(path) ? path.replace(/\\/g, '/') : `${pathToRoot}/${path}`;

    function make(recursive = false) {
        if(fs.existsSync(_path)) return;
        fs.mkdirSync(_path, {
            recursive
        });
    }

    function remove(recursive = false) {
        if(!fs.existsSync(_path)) return;
        fs.rmdirSync(_path, {
            recursive
        });
    }

    return {
        make,
        remove,
        path: _path
    }
}