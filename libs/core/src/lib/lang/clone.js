export function cloneDeep(source) {
    if (source === null)
        return source;
    else if (source instanceof Date)
        return new Date(source.getTime());
    else if (typeof source === 'object') {
        // its an array
        if (typeof source[Symbol.iterator] === 'function')
            return source.map((element) => cloneDeep(element));
        // regular object
        else
            return Object.keys(source).reduce((result, property) => {
                result[property] = cloneDeep(source[property]);
                return result;
            }, {});
    }
    else
        return source;
}
//# sourceMappingURL=clone.js.map