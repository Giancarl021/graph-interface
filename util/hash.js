const { createHash } = require('crypto');

module.exports = function(credentials) {
    const { tenantId, clientId, clientSecret } = credentials;
    return hash(tenantId + clientId + clientSecret);
}

function hash(string) {
    return createHash('sha256')
        .update(string)
        .digest('hex');
}