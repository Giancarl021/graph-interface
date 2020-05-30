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

    function files(recursive = false, concatFolderName = false) {
        return _readFiles(_path, path, recursive, concatFolderName);
    }

    function _readFiles(path, parent, recursive, concatFolderName) {
        const r = [];
        const items = fs.readdirSync(path);
        for(const item of items) {
            if(fs.lstatSync(`${path}/${item}`).isDirectory()) {
                if(recursive) {
                    r.push(..._readFiles(`${path}/${item}`, parent, recursive, concatFolderName));
                }
            } else {
                r.push(`${concatFolderName ? parent + '/' : ''}${item}`);
            }
        }
        return r;
    }

    return {
        make,
        remove,
        files,
        path: _path
    }
}