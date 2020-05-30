const createFileHandler = require('./file');
const createDirectoryHandler = require('./directory');
const createCryptHandler = require('./crypt');

module.exports = function (path) {
    const dir = createDirectoryHandler(path.split(/(\/|\\)/).filter(e => !/(\/|\\)/.test(e)).slice(0, -1).join('/'));
    dir.make(true);

    const file = createFileHandler(path);
    const crypt = createCryptHandler(path);

    function getCache() {
        if (!hasCache()) {
            throw new Error('Cache file does not exists');
        }
        
        return _getData().data;
    }

    function setCache(data, expiresIn) {
        const cache = {
            data,
            expireTimestamp: Date.now() + expiresIn
        }

        _setData(cache);
    }

    function hasCache() {
        if (!file.exists()) return false;
        const cache = _getData();

        if (Date.now() <= cache.expireTimestamp) {
            return true;
        } else {
            file.remove();
            return false;
        }
    }

    function _getData() {
        const enc = file.load();
        const dec = crypt.decrypt(enc);
        return JSON.parse(dec);
    }

    function _setData(data) {
        const dec = JSON.stringify(data, null, Math.floor(Math.random() * 8));
        const enc = crypt.encrypt(dec);
        file.save(enc);
    }

    return {
        getCache,
        setCache,
        hasCache
    }
}