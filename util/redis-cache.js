const redis = require('redis');

module.exports = function(clientOptions) {
    const client = redis.createClient(clientOptions);

    
}