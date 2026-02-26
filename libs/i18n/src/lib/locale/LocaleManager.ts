import "reflect-metadata"

import { BehaviorSubject, from } from "rxjs"
import  { LocaleCode } from "./LocaleConfig"
import type LocaleConfig from "./LocaleConfig"
import { OnLocaleChange } from "./OnLocaleChange"

import { LocaleBackingStore } from "./LocaleBackingStore"
import { concatMap, mergeMap } from "rxjs/operators"


/**
 * @ignore
 */
interface Listener {
    onLocaleChange: OnLocaleChange
    priority: number
}

class NoBackingStore implements LocaleBackingStore {
    getLocale(): Intl.Locale | undefined {
        return undefined
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setLocale(locale: Intl.Locale): void {}
}

/**
 * The <code>LocaleManager</code> keeps track of the current locale as a behavior subject and knows about the array of supported locales.
 * Interested parties can subscribe to the current value.
 */
export class LocaleManager {
    // instance data

    locale: BehaviorSubject<Intl.Locale> = new BehaviorSubject<Intl.Locale>(new Intl.Locale("en"))
    backingStore: LocaleBackingStore
    supportedLocales: LocaleCode[]
    listeners: Listener[] = []
    dirty = false

    // static methods

    /**
     * return the browser locale
     */
    static getBrowserLocale(): Intl.Locale {
        if (global.navigator.languages && global.navigator.languages.length) return new Intl.Locale(global.navigator.languages[0])
        /* latest versions of Chrome and Firefox set this correctly
    else if (navigator["userLanguage"])
      return new Intl.Locale(navigator["userLanguage"]); */ else return new Intl.Locale(global.navigator.language) // latest versions of Chrome, Firefox, and Safari set this correctly
    }

    // constructor

    constructor(configuration: LocaleConfig) {
        this.backingStore = configuration.backingStore || new NoBackingStore()

        if (configuration.backingStore) this.setLocale(configuration.backingStore.getLocale() || configuration.locale?.toString())
        else this.setLocale(configuration.locale)

        this.supportedLocales = configuration.supportedLocales ?? [this.getLocale().baseName]

        this.locale
            .pipe(
                mergeMap((locale) => from(this.getListeners())),
                concatMap((l) => l.onLocaleChange.onLocaleChange(this.locale.value))
            )
            .subscribe()
    }

    // private

    private getListeners(): Listener[] {
        if (this.dirty) {
            this.listeners.sort((a, b) => (a.priority == b.priority ? 0 : a.priority < b.priority ? -1 : 1))
            this.dirty = false
        }

        return this.listeners
    }

    // public

    /**
     * add the specified listener to the list of listeners that will be informed on every locale change.
     * @param onLocaleChange the listener
     * @param priority the priority. Smaller priorities are called earlier.
     */
    subscribe(onLocaleChange: OnLocaleChange, priority = 10) {
        const subscription = { onLocaleChange: onLocaleChange, priority: priority }

        this.listeners.push(subscription)
        this.dirty = true

        return () => {
            this.listeners.splice(this.listeners.indexOf(subscription), 1)
        }
    }

    /**
     * set the current locale
     * @param locale either  string or a Intl.Locale object
     */
    setLocale(locale: string | Intl.Locale) {
        if (typeof locale == "string") locale = new Intl.Locale(locale)

        this.backingStore.setLocale(locale)

        this.locale.next(locale)
    }

    /**
     * return the current locale
     */
    getLocale(): Intl.Locale {
        return this.locale.value
    }

    /**
     * return the list of supported locale codes
     */
    getLocales(): LocaleCode[] {
        return this.supportedLocales
    }
}
