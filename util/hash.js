const sha1 = require('sha1');

module.exports = function(credentials) {
    const { tenantId, clientId, clientSecret } = credentials;
    return sha1(tenantId + clientId + clientSecret);
}