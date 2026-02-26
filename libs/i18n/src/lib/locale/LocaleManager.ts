import "reflect-metadata"

import { BehaviorSubject, from } from "rxjs"
import { concatMap, mergeMap } from "rxjs/operators"

import type { LocaleCode } from "./LocaleConfig"
import type LocaleConfig from "./LocaleConfig"
import type { OnLocaleChange } from "./OnLocaleChange"
import type { LocaleBackingStore } from "./LocaleBackingStore"

/** @ignore */
interface Listener {
  onLocaleChange: OnLocaleChange
  priority: number
}

class NoBackingStore implements LocaleBackingStore {
  getLocale(): Intl.Locale | undefined {
    return undefined
  }

  setLocale(_: Intl.Locale): void {}
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
    if (typeof globalThis !== "undefined" && globalThis.navigator) {
      if (globalThis.navigator.languages && globalThis.navigator.languages.length) {
        return new Intl.Locale(globalThis.navigator.languages[0])
      } else {
        return new Intl.Locale(globalThis.navigator.language)
      }
    }

    // fallback if navigator is not available (Node)
    return new Intl.Locale("en")
  }

  // constructor
  constructor(configuration: LocaleConfig) {
    this.backingStore = configuration.backingStore ?? new NoBackingStore()

    const initialLocale =
      configuration.backingStore?.getLocale() ??
      (typeof configuration.locale === "string"
        ? new Intl.Locale(configuration.locale)
        : configuration.locale) ??
      LocaleManager.getBrowserLocale()

    this.setLocale(initialLocale)

    this.supportedLocales = configuration.supportedLocales ?? [this.getLocale().baseName]

    // listen for changes
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
      this.listeners.sort((a, b) => (a.priority === b.priority ? 0 : a.priority < b.priority ? -1 : 1))
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
    const subscription: Listener = { onLocaleChange, priority }
    this.listeners.push(subscription)
    this.dirty = true

    return () => {
      const index = this.listeners.indexOf(subscription)
      if (index !== -1) this.listeners.splice(index, 1)
    }
  }

  /**
   * set the current locale
   * @param locale either string or an Intl.Locale object
   */
  setLocale(locale: string | Intl.Locale) {
    if (typeof locale === "string") locale = new Intl.Locale(locale)

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