const createFsInterface = require('../util/fs-cache');
const createRedisInterface = require('../util/redis-cache');

module.exports = async function (options) {
    const connections = [];
    const interfaces = {
        fs: createFsInterface,
        redis: createRedisInterface
    };

    if (!options.type) {
        const empty = () => null;
        return {
            interface() {
                return {
                    get: empty,
                    set: empty,
                    exists: empty
                }
            },
            closeConnections() {
                return null
            }
        };
    }

    const index = options.type;
    const parameters = options[index];
    const interface = await interfaces[index](parameters, addConnection);
    return {
        interface,
        closeConnections
    };

    function addConnection(client) {
        connections.push(client);
    }

    async function closeConnections() {
        for (const connection of connections) {
            await connection.quit();
        }
    }
}