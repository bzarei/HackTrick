import { Observable } from "rxjs";

/**
 * translatable objects must implement this interface on order to get called about changes
 */
export interface OnLocaleChange {
  /**
   * called whenever the current locale changes
   * @param locale the new locale
   */
  onLocaleChange(locale: Intl.Locale): Observable<unknown>;
}
