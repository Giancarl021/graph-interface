const createJsonHandler = require('./json');
const createDirectoryHandler = require('./directory');

module.exports = function (path) {
    const dir = createDirectoryHandler(path.split(/(\/|\\)/).filter(e => !/(\/|\\)/.test(e)).slice(0, -1).join('/'));
    dir.make(true);

    const json = createJsonHandler(path);

    function getCache() {
        if (!hasCache()) {
            throw new Error('Cache file does not exists');
        }

        return json.load().data;
    }

    function setCache(data, expiresIn) {
        const cache = {
            data,
            expireTimestamp: Date.now() + expiresIn
        }

        json.save(cache);
    }

    function hasCache() {
        if (!json.exists()) return false;
        const cache = json.load();

        if (Date.now() <= cache.expireTimestamp) {
            return true;
        } else {
            json.remove();
            return false;
        }
    }

    return {
        getCache,
        setCache,
        hasCache
    }
}