const createRequestHandler = require('../util/request');

const CHUNK_SIZE = 20;

module.exports = function (urls, token, binder, endpoint, method, parseMode, requestsPerCycle, requestMode, maxAttempts) {
    const requester = createRequestHandler();
    let attemps = 0;
    async function request() {
        const binding = bind();
        const packages = pack(binding);

        const response = await get(packages, requestMode);

        return response;
    }

    async function get(packages, asyncMode) {
        const fall = [];
        let r = {};
        if (asyncMode) {
            const responses = await requester.cycle(packages, requestsPerCycle);
            for(const key in responses) {
                const response = responses[key];
                const { resolved, rejected } = unpack(response && response.responses);
                fall.push(
                    ...handleRejections(rejected, packages, key)
                );
                r = {
                    ...r,
                    ...resolved
                };
            }
        } else {
            for (const key in packages) {
                const package = packages[key];
                const response = await requester.get(package);
                const { resolved, rejected } = unpack(response && response.responses);

                fall.push(
                    ...handleRejections(rejected, packages, key)
                );

                r = {
                    ...r,
                    ...resolved
                };
            }
        }

        console.log('Fail size: ' + fall.length);
        if(fall.length) {
            r = {
                ...r,
                ...(await retry(fall, asyncMode))
            };
        }

        return r;
    }

    function bind(_urls = urls) {
        return _urls.map((url, i) => ({
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
            // Create pagination for each list response
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

    async function retry(rejections, asyncMode) {
        const binding = bind(rejections);
        const packages = pack(binding);

        const response = await get(packages, asyncMode);
        return response;
    }

    function handleRejections(rejections, packages, packageKey) {
        const package = packages[packageKey];
        const requests = JSON.parse(package.body).requests.map(request => request.url);
        const r = [];
        if (rejections === 'all') {
            console.log('Cluster rejection');
            r.push(...requests);
        } else if (typeof rejected === 'object') {
            console.log('Inner rejections');
            for(const key in rejections) {
                const rejection = rejections[key];
                console.log(rejection);
                r.push(requests.find(url => url.includes(key)));
            }
        }
        return r;
    }

    return {
        request
    }
}