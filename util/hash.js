const { createHash } = require('crypto');

module.exports = function (string) {
    return createHash('sha256')
        .update(string)
        .digest('hex');
}