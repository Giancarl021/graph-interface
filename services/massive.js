const createRequestHandler = require('../util/request');

const CHUNK_SIZE = 20;

module.exports = function (urls, token, binder, endpoint, method, parseMode) {
    const {
        cycle
    } = createRequestHandler();

    async function request() {
        const binding = bind();
        const packages = pack(binding);
        let r = {};
        let i = 1;
        const l = require('../util/object')(packages).size();
        for (const key in packages) {
            const package = packages[key];
            const n = ((x, y) => {
                let r = '';
                let l = Math.ceil(Math.log10(y));
                for (let i = x.toString().length; i < l; i++) r += '0';
                return r + x;
            })(i++, l);
            console.log(`Package [${n}/${l}]`);
            const response = await get(package);
            r = {
                ...r,
                ...unpack(response)
            };
        }

        return r;
    }

    function retry(times) {

    }

    function bind() {
        return urls.map((url, i) => ({
            url,
            method,
            id: binder[i]
        }));
    }

    function pack(requests) {
        const r = {};

        for (let i = 0; i < requests.length; i += CHUNK_SIZE) {
            let l = Math.min(i + CHUNK_SIZE, urls.length);
            r[`${i}-${l}`] = {
                url: `${endpoint}/$batch`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requests: requests.slice(i, l)
                })
            };
        }

        return r;
    }

    function unpack({ responses }) {
        const r = {};
        if (!responses) {
            throw new Error('Cluster error');
        }
        for (const response of responses) {
            // Create pagination for each list response
            if (response.body.error) {
                throw new Error(response.body.error);
            }
            r[response.id] = parseMode === 'unit' ? response.body || null : response.body.value || [];
        }

        return r;
    }

    return {
        request
    }
}