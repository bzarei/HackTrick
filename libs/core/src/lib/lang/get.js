export function get(object, key, defaultValue = undefined) {
    const path = key.split(".");
    let index = 0;
    const length = path.length;
    while (object != null && index < length)
        object = Reflect.get(object, path[index++]);
    if (index && index == length)
        return object;
    else
        return defaultValue;
}
//# sourceMappingURL=get.js.map