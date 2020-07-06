const createRequestHandler = require('../util/request');
const createGraphInterface = require('../index');

const CHUNK_SIZE = 20;

module.exports = function (urls, token, binder, endpoint, method, parseMode, requestsPerCycle, requestMode, maxAttempts) {
    let attempts = 0;
    let fallSize = 0;
    const requester = createRequestHandler();
    async function request() {
        const binding = bind(urls);
        const packages = pack(binding);

        const response = await get(packages, requestMode);

        return response;
    }

    async function get(packages, asyncMode) {
        const fall = [];
        const r = {};
        if (asyncMode) {
            const responses = await requester.cycle(packages, requestsPerCycle);
            for(const key in responses) {
                const response = responses[key];
                const { resolved, rejected } = unpack(response && response.responses);
                fall.push(
                    ...handleRejections(rejected, packages, key)
                );
                setR(resolved);
            }
        } else {
            for (const key in packages) {
                const package = packages[key];
                const response = await requester.get(package);
                const { resolved, rejected } = unpack(response && response.responses);

                fall.push(
                    ...handleRejections(rejected, packages, key)
                );

                setR(resolved);
            }
        }

        if(fall.length) {
            if(fallSize === fall.length) attempts++;
            else attempts = 0;
            if(attempts >= maxAttempts) throw new Error('Max attempts tried');
            fallSize = fall.length;
            const response =  await get(pack(bind(fall)), asyncMode);
            setR(response);
        }

        return r;

        function setR(items) {
            for(const key in items) {
                r[key] = items[key];
            }
        }
    }

    function bind(urls) {
        return urls.map(url => ({
            url,
            method,
            id: binder[url]
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

    function unpack(responses) {
        const resolved = {};
        const rejected = {};
        if (!responses) {
            return {
                resolved: null,
                rejected: 'all'
            };
        }
        for (const response of responses) {
            if (response.body.error) {
                rejected[response.id] = response;
                continue;
            }
            resolved[response.id] = parseMode === 'unit' ? response.body || null : response.body.value || [];
        }

        return {
            resolved,
            rejected
        };
    }

    function handleRejections(rejections, packages, packageKey) {
        const package = packages[packageKey];
        const requests = JSON.parse(package.body).requests.map(request => request.url);
        const r = [];
        if (rejections === 'all') {
            r.push(...requests);
        } else {
            for(const key in rejections) {
                r.push(requests.find(url => url.includes(key)));
            }
        }
        return r;
    }

    return {
        request
    }
}