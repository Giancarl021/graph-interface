module.exports = function (source, pattern, removeFromMatch = null) {
    function split() {
        return source.split(pattern);
    }

    function matches() {
        return [...source.matchAll(pattern)].map(m => {
            const match = m[0];
            if(removeFromMatch) {
                return match.replace(removeFromMatch, '');
            } else {
                return match;
            }
        });
    }

    function replace(values) {
        const splits = split();
        let r = splits.shift();
        const _matches = matches();

        if(!_matches.length) return;

        for(const match of _matches) {
            if(!values.hasOwnProperty(match)) {
                throw new Error('Values object does not contains key ' + match);
            }
            r += values[match] + splits.shift();
        }
        return r;
    }

    function replaceArray(values) {
        const items = _splitObject(values);
        const r = [];
        for (const item of items) {
            r.push(replace(item));
        }

        return r;
    }

    function _splitObject(source) {
        const r = [];
        let l = null;
        const keys = Object.keys(source);

        if(!keys.length) return;

        for (const key of keys) {
            if(!Array.isArray(source[key])) {
                throw new Error('Key ' + key + ' is not an Array');
            } else if(l === null) {
                l = source[key].length;
            } else if(source[key].length !== l) {
                throw new Error('All the keys on values object need to have the same length');
            }
        }

        const pivot = source[keys[0]].length;

        for (let i = 0; i < pivot; i++) {
            const o = {};
            for(const key of keys) {
                o[key] = source[key][i];
            }
            r.push(o);
        }

        return r;
    }

    return {
        split,
        matches,
        replace,
        replaceArray
    }
}