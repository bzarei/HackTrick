/**
 * a StringBuilder is used to concatenate strings
 */
export class StringBuilder {
    // instance data
    values = [];
    // public
    /**
     * append the passed value to this builder and return this
     * @param value a string value
     */
    append(value) {
        this.values.push(value);
        return this;
    }
    /**
     * clear the contents
     */
    clear() {
        this.values.length = 1;
        return this;
    }
    /**
     * return the concatenated string according to the current collected values.
     */
    toString() {
        return this.values.join('');
    }
}
//# sourceMappingURL=string-builder.js.map