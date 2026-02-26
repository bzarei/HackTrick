export interface LocaleBackingStore {
  getLocale(): Intl.Locale | undefined;

  setLocale(locale: Intl.Locale): void;
}
