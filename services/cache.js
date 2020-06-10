const createFsInterface = require('../util/fs-cache');
const createRedisInterface = require('../util/redis-cache');

module.exports = function (options) {
    const interfaces = {
        fs: createFsInterface,
        redis: createRedisInterface
    };

    if(!options.type) {
        const empty = () => null;
        return () => ({
            get: empty,
            set: empty,
            exists: empty
        });
    }

    const index = options.type;
    const parameters = options[index];
    const interface = interfaces[index](parameters);
    return interface;
}