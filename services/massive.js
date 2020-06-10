const createRequestHandler = require('../util/request');

const CHUNK_SIZE = 20;

module.exports = function (urls, token, binder, endpoint, method, parseMode, warn) {
    const {
        get
    } = createRequestHandler();

    async function request() {
        // const binding = bind();
        // const packages = pack(binding);
        // const r = {};
        // for(const key in packages) {
        //     const package = packages[key];
        //     r[key] = {

        //     }
        // }

        console.log(
            unpack(
                await get(
                    pack(
                        bind()
                    )['0-20']
                )
            )
        );
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

    function unpack({
        responses
    }) {
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