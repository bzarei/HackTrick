import { Translator } from '@novx/i18n';
import { createContext } from 'react';

/**
 * the user api for i18n
 */
export interface I18N {
  /**
   * a function that can be used to translate keys
   * @param key a key
   * @param params optional params that can add placeholder values
   */
  tr: (key: string, params?: any) => string;
  /**
   * retrieves the current translator instance
   */
  translator: Translator;
}

export const I18NContext = createContext<I18N | undefined>(undefined);
