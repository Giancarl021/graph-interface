const createFileHandler = require('./file');
const createDirectoryHandler = require('./directory');
const createCryptHandler = require('./crypt');

module.exports = function (options) {
    const {
        cleanupInterval: lockTimeOfLife,
        path: masterPath
    } = options;

    return function (path) {
        const _path = `${masterPath}/${path}`;
        const dirPath = _path.replace(/\\/g , '/').split('/').slice(0, -1).join('/');
        const dir = createDirectoryHandler(dirPath);
        dir.make(true);
        _cleanup();

        const file = createFileHandler(_path);
        const crypt = createCryptHandler(_path);

        function get() {
            if (!exists()) {
                throw new Error('Cache file does not exists');
            }

            return _getData().data;
        }

        function set(data, expiresIn) {
            const cache = {
                data,
                expireTimestamp: Date.now() + (expiresIn * 1000)
            }

            _setData(cache);
        }

        function exists() {
            return _verifyCache();
        }

        function _verifyCache(_file = file, _crypt = crypt) {
            if (!_file.exists()) return false;
            const cache = _getData(_file, _crypt);

            if (Date.now() <= cache.expireTimestamp) {
                return true;
            } else {
                _file.remove();
                return false;
            }
        }

        function _getData(_file = file, _crypt = crypt) {
            const enc = _file.load();
            const dec = _crypt.decrypt(enc);
            return JSON.parse(dec);
        }

        function _setData(data) {
            const dec = JSON.stringify(data, null, Math.floor(Math.random() * 8));
            const enc = crypt.encrypt(dec);
            file.save(enc);
        }

        function _cleanup() {
            if (!lockTimeOfLife) return;
            const file = createFileHandler(`${dirPath}/lock`);
            if (file.exists()) {
                if (Date.now() >= file.load()) {
                    file.remove();
                    clear();
                    file.save(Date.now() + (lockTimeOfLife * 1000));
                }
            } else {
                clear();
                file.save(Date.now() + (lockTimeOfLife * 1000));
            }

            function clear() {
                const files = dir.files(true, true);
                files.forEach(file => {
                    _verifyCache(createFileHandler(file), createCryptHandler(file));
                });
            }
        }

        return {
            get,
            set,
            exists
        }
    }
}