/**
 * this interface needs to be implemented in order to load i18n values.
 */
export abstract class I18NLoader {
    /**
     * load the specified namespace
     * @param locale the requested locale.
     * @param namespace the requested namespace
     */
    abstract loadNamespace(locale: Intl.Locale, namespace: string): Promise<any>
}
