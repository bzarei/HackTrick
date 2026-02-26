import { LocaleBackingStore } from "./LocaleBackingStore";

export type LocaleCode = string;

/**
 * the config object for the locale module
 */
export default interface LocaleConfig {
  /**
   * the initial locale
   */
  locale: LocaleCode | Intl.Locale;
  /**
   * the array of supported locales
   */
  supportedLocales?: LocaleCode[];

  /**
   * an optional backing store for the current locale
   */
  backingStore?: LocaleBackingStore;

  /**
   * any additional properties
   */
  //[prop: string]: any;
}
