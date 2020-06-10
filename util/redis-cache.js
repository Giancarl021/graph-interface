const redis = require('redis');
const createCryptHandler = require('./crypt');
const {
    nullifyOptions
} = require('../util/options');
const {
    promisify
} = require('util');

module.exports = function (options) {
    const client = redis.createClient(nullifyOptions(options));

    client.on('error', err => {
        throw new Error('Redis connection error: ' + err.message);
    });

    const getAsync = promisify(client.get).bind(client);
    const setAsync = promisify(client.set).bind(client);
    const expireAsync = promisify(client.expire).bind(client);
    const hasAsync = promisify(client.exists).bind(client);

    return async function (key) {
        const crypt = createCryptHandler(key);

        async function get() {
            if (!exists()) {
                throw new Error('Cache key does not exists');
            }
            const enc = await getAsync(key);
            const dec = crypt.decrypt(enc);
            return JSON.parse(dec);
        }

        async function set(data, expiresIn) {
            const dec = JSON.stringify(data, null, Math.floor(Math.random() * 8));
            const enc = crypt.encrypt(dec);
            await setAsync(key, enc);
            await expireAsync(key, expiresIn);
        }

        async function exists() {
            return await hasAsync(key);
        }

        return {
            get,
            set,
            exists
        }
    }
}