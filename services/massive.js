const createRequestHandler = require('../util/request');

const CHUNK_SIZE = 20;

module.exports = function (urls, token, binder, endpoint, method, parseMode, requestsPerCycle, requestMode, cycleAttempts) {
    const requester = createRequestHandler();
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
            console.log('async');
            const responses = await requester.cycle(packages, requestsPerCycle);
            console.log('Processing...');
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

        console.log(fall);

        return r;
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

    function handleRejections(rejections, packages, packageKey) {
        const package = packages[packageKey];
        const requests = JSON.parse(package.body).requests.map(request => request.url);
        const r = [];
        if (rejections === 'all') {
            r.push(...requests);
        } else if (typeof rejected === 'object') {
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