export const isSubclassOf = (cls, superCls) => {
    return cls === superCls || cls.prototype instanceof superCls;
};
//# sourceMappingURL=is-subclass-of.js.map