/**
 * a StringBuilder is used to concatenate strings
 */
export declare class StringBuilder {
    private values;
    /**
     * append the passed value to this builder and return this
     * @param value a string value
     */
    append(value: string): StringBuilder;
    /**
     * clear the contents
     */
    clear(): StringBuilder;
    /**
     * return the concatenated string according to the current collected values.
     */
    toString(): string;
}
//# sourceMappingURL=string-builder.d.ts.map