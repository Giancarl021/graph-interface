const request = require('request');

function get(options) {
    return new Promise((resolve, reject) => {
        request(options, (err, res) => {
            if (err) return reject(err);
            return resolve(JSON.parse(res.body));
        });
    });
}

async function pagination(getOptions) {
    let r = [];
    let url = getOptions.url;
    while (url.length) {
        getOptions.url = url;
        const content = await get(getOptions);
        console.log(content);
        if (content.error) {
            throw new Error(content.error.message);
        }
        url = content['@odata.nextLink'] || '';
        r = r.concat(content.value);
    }
    return r;
}

async function massive() {

}

module.exports = function () {
    return {
        get,
        pagination,
        massive
    }
}