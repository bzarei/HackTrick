import React from 'react';
import { I18NContext } from './i18n-context';

export const useI18N = () => {
  return React.useContext(I18NContext);
};
