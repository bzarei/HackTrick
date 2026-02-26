import { LocaleBackingStore } from "../LocaleBackingStore"

export class LocalStorageLocaleBackingStore implements LocaleBackingStore {
    // constructor

    constructor(private key: string) {}

    // implement LocaleBackingStore

    getLocale(): Intl.Locale | undefined {
        const localeCode = global.localStorage.getItem(this.key)

        return localeCode ? new Intl.Locale(localeCode) : undefined
    }

    setLocale(locale: Intl.Locale): void {
        global.localStorage.setItem(this.key, locale.baseName)
    }
}
