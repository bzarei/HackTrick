export declare type FormatOptions = any

/**
 * a <code>ValueFormatter</code> will format a value given specific formatting options.
 */
export interface ValueFormatter<V, T> {
    /**
     * format the specified value while applying the specified formatting options.
     * @param locale the current locale
     * @param value the value
     * @param format an formatting options
     */
    format(locale: Intl.Locale, value: V, format: T): string
}
