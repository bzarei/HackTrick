import React from 'react';
import { NavigationList } from './navigation-list';
import { Feature, SessionManager, useEnvironment, useInject } from '@novx/portal';
import { Outlet, useLocation } from 'react-router-dom';
import LocaleSwitch from '../component/locale-switch';  // Import the new LocaleSwitch component
import { LocaleManager } from '@novx/i18n';

const ReactiveOutlet: React.FC = () => {
  const location = useLocation();
  // By using location here, this component re-renders on route changes
  // and causes the Outlet to re-render too
  return <Outlet key={location.pathname} />;
};

const handleLoginLogout = async () => {
  const sessionManager = useEnvironment().get(SessionManager);

  await sessionManager.openSession();
};

export const PublicNavigation: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [localeManager] = useInject(LocaleManager);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Header */}
     <header
  style={{
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    background: '#1e1e2f',
    color: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    flexShrink: 0,
  }}
>
  {/* LEFT SIDE */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
    <button
      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      style={{
        background: 'transparent',
        border: 'none',
        color: '#fff',
        fontSize: '24px',
        cursor: 'pointer',
      }}
    >
      ☰
    </button>

    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
      My App
    </div>
  </div>

  {/* RIGHT SIDE */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <button
      onClick={handleLoginLogout}
      style={{
        padding: '8px 16px',
        backgroundColor: '#1976d2',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
      }}
    >
      Login
    </button>

    <LocaleSwitch localeManager={localeManager} />
  </div>
</header>

      {/* Main */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside
          style={{
            width: sidebarCollapsed ? '60px' : '220px',
            background: '#2c2c3e',
            color: '#fff',
            transition: 'width 0.2s',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflowY: 'auto',
          }}
        >
          <NavigationList collapsed={sidebarCollapsed} />
        </aside>

        <main
          style={{
            flex: 1,
            background: '#f4f4f4',
            overflowY: 'auto',
          }}
        >
          {/* Routed content */}
          <ReactiveOutlet />
        </main>
      </div>
    </div>
  );
};

@Feature({
  id: 'public-navigation',
  label: 'Navigation',
  visibility: ['public'],
  tags: ['portal'],
  path: '/',
})
export class PublicNavigationFeature extends React.Component {
  render() {
    return <PublicNavigation />;
  }
}