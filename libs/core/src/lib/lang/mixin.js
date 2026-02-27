export function registerMixins(clazz, mixin) {
    const prototype = Object.getPrototypeOf(clazz);
    if (prototype.name !== "Object") {
        const mixins = [...prototype.constructor["$mixins"] || []];
        if (!mixins.includes(mixin))
            mixins.push(mixin);
        //else
        //console.log(clazz.name + " super class " + prototype.name + " already declares mixin " + mixin.name)
        clazz.constructor["$mixins"] = mixins;
    }
    else
        clazz.constructor["$mixins"] = [mixin];
    return clazz;
}
export function hasMixin(object, mixin) {
    let clazz = object.constructor;
    while (clazz?.constructor?.name != 'Object') {
        const mixins = clazz?.constructor["$mixins"];
        if (mixins)
            return mixins.includes(mixin);
        // next
        clazz = Object.getPrototypeOf(clazz);
    }
    return false;
}
//# sourceMappingURL=mixin.js.map