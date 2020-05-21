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
            } else if (strict) {
                throw new Error('Source object does not have field ' + field);
            }
        }

        return r;
    }

    return {
        size,
        fields
    };
}