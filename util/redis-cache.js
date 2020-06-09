const redis = require('redis');

module.exports = function(clientOptions) {
    const client = redis.createClient(clientOptions);

    async function set() {

    }

    async function get() {

    }

    return {
        set,
        get
    }
}