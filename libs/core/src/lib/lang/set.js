export function set(object, key, value) {
    const path = key.split(".");
    let index = 0;
    const length = path.length;
    while (index < length - 1) {
        let next = Reflect.get(object, path[index]);
        if (next == undefined)
            Reflect.set(object, path[index], next = {});
        object = next;
        index++;
    }
    Reflect.set(object, path[index], value);
}
//# sourceMappingURL=set.js.map