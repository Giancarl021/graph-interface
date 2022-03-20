module.exports = function (source) {
    function size() {
        let size = 0;
        for (const key in source) {
            if (source.hasOwnProperty(key)) size++;
        }
        return size;
    }

    function fields(fields, strict = false) {
        const r = {};
        for (const field of fields) {
            if (source.hasOwnProperty(field)) {
                r[field] = source[field];
            } else if(field.includes(' as ')) {
                const [_prop, _as] = field.split(' as ');

                if(!_as) throw new Error('Field new name needs to be valid!');

                if(!source.hasOwnProperty(_prop)) {
                    if(strict) throw new Error('Source object does not have field ' + field);
                } else {
                    r[_as] = source[_prop];
                }
            } else if (strict) {
                throw new Error('Source object does not have field ' + field);
            }
        }

        return r;
    }

    function array() {
        const r = [];
        for(const key in source) {
            r.push(source[key]);
        }

        return r;
    }

    async function awaitField(field) {
        source[field] = await source[field];
    }

    async function awaitAll() {
        await Promise.all(array());

        for(const key in source) {
            awaitField(key);
        }
    }

    return {
        size,
        fields,
        array,
        awaitField,
        awaitAll
    };
}