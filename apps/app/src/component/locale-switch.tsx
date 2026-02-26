import React from 'react';
import { LocaleManager } from '@novx/i18n';

interface LocaleSwitcherProps {
  localeManager: LocaleManager;
}

const LocaleSwitcher: React.FC<LocaleSwitcherProps> = ({ localeManager }) => {
  const currentLocale = localeManager.getLocale();

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locale = e.target.value;
    localeManager.setLocale(locale);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '18px',
          height: '18px',
          pointerEvents: 'none',
          opacity: 0.7,
        }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>

      {/* Dropdown arrow */}
      <svg
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '14px',
          height: '14px',
          pointerEvents: 'none',
          opacity: 0.5,
        }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>

      <select
        value={currentLocale.toString()}
        onChange={handleLocaleChange}
        style={{
          padding: '8px 36px 8px 40px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, #1e1e2f 0%, #252538 100%)',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          outline: 'none',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
      >
        {localeManager.supportedLocales.map((loc) => (
          <option key={loc.toString()} value={loc.toString()}>
            {loc.toString()}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LocaleSwitcher;