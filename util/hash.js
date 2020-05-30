const { createHash } = require('crypto');

module.exports = function(credentials) {
    const { tenantId, clientId, clientSecret } = credentials;
    return createHash('sha256').update(tenantId + clientId + clientSecret).digest('hex');
}