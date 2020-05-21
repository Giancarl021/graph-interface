const crypto = require('crypto');
const algorithm = 'aes-256-ctr';

module.exports = function (password) {

    const _password = crypto
        .createHash('sha256')
        .update(password)
        .digest('base64')
        .substr(0, 32);
    
    const iv = Buffer
        .from(password)
        .toString('hex')
        .slice(0, 16);

    console.log(_password, iv);

    function encrypt(text) {
        const cipher = crypto.createCipheriv(algorithm, _password, iv);
        let crypted = cipher.update(text, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    }

    function decrypt(text) {
        const decipher = crypto.createDecipheriv(algorithm, _password, iv)
        let dec = decipher.update(text, 'hex', 'utf8')
        dec += decipher.final('utf8');
        return dec;
    }

    return {
        encrypt,
        decrypt
    }
}