import {
  Feature,
  RouteChangeNotifier,
  DeploymentManager,
  SessionManager,
  EnvironmentContext,
} from '@novx/portal';
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LocaleManager } from '@novx/i18n';
import { of } from 'rxjs';
import { Environment } from '@novx/core';

import { NavigationList } from './navigation-list';
import { ResizableSidebar } from './resizable-sidebar';
import ModulesModal, { Module } from '../component/modules-dialog';
import LocaleSwitch from '../component/locale-switch';

// A small wrapper to make Outlet reactive to route changes
const ReactiveOutlet: React.FC = () => {
  const location = useLocation();
  return <Outlet key={location.pathname} />;
};

@Feature({
  id: 'public-navigation',
  label: 'Navigation',
  visibility: ['public'],
  tags: ['portal'],
  path: '/',
})
export class PublicNavigationFeature extends React.Component<
  object,
  { sidebarCollapsed: boolean; currentPath: string; showModulesModal: boolean; hasSession: boolean }
> {
  private unsubscribe?: () => void;

  state = {
    sidebarCollapsed: false,
    currentPath: window.location.pathname,
    showModulesModal: false,
    hasSession: false,
  };

  static contextType = EnvironmentContext;
  declare context: Environment;

  componentDidMount() {
    const notifier = this.context.get(RouteChangeNotifier);
    this.unsubscribe = notifier.subscribe((location) => {
      console.log('[Navigation] Route changed to:', location.pathname);
      this.setState({ currentPath: location.pathname });
    });

    const localeManager = this.context.get(LocaleManager);
    localeManager.subscribe({
      onLocaleChange: () => {
        this.setState({});
        return of({});
      },
    });

    this.updateSessionState();
  }

  componentWillUnmount() {
    if (this.unsubscribe) this.unsubscribe();
  }

  updateSessionState = () => {
    const sessionManager = this.context.get(SessionManager);
    this.setState({ hasSession: sessionManager.hasSession() });
  };

  toggleSidebar = () => this.setState({ sidebarCollapsed: !this.state.sidebarCollapsed });
  toggleModulesModal = () => this.setState({ showModulesModal: !this.state.showModulesModal });

  handleLoginLogout = async () => {
    const sessionManager = this.context.get(SessionManager);
    if (this.state.hasSession) {
      await sessionManager.closeSession();
    } else {
      await sessionManager.openSession();
    }
    this.updateSessionState();
  };

  setLocale(locale: string) {
    const localeManager = this.context.get(LocaleManager);
    localeManager.setLocale(locale);
  }

  render() {
    const deploymentManager = this.context.get(DeploymentManager);
    const { sidebarCollapsed, showModulesModal, hasSession } = this.state;

    const deployment = deploymentManager.deployment;

    const modules: Module[] = deployment
      ? Object.entries(deployment.modules).map(([name, manifest]) => ({
          name,
          label: manifest.label || name,
          version: manifest.version || 'N/A',
          loaded: manifest.loaded || false,
        }))
      : [];

    const localeManager = this.context.get(LocaleManager);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'TeleNeoWeb','Segoe UI','Helvetica Neue',Arial,sans-serif" }}>
        {/* HEADER */}
        <header
          style={{
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            background: '#ffffff',
            color: '#191919',
            borderBottom: '1px solid #e6e6e6',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={this.toggleSidebar}
              style={{ background: 'transparent', border: 'none', color: '#191919', fontSize: '20px', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f2f2f2')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              ☰
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: '#e20074', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: 16,
              }}>T</div>
              <span style={{ fontWeight: 800, fontSize: '16px', color: '#191919', letterSpacing: '-0.3px' }}>
                Matchday
              </span>
            </div>
          </div>

          {/* RIGHT CONTROLS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Modules Button */}
            <button
              onClick={this.toggleModulesModal}
              style={{
                padding: '6px 14px',
                backgroundColor: '#f2f2f2',
                color: '#191919',
                border: '1px solid #e6e6e6',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e6e6e6')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f2f2f2')}
            >
              <span>📦</span>
              <span>
                Modules ({modules.filter((m) => m.loaded).length}/{modules.length})
              </span>
            </button>

            {/* Login/Logout */}
            <button
              onClick={this.handleLoginLogout}
              style={{
                padding: '6px 16px',
                backgroundColor: hasSession ? '#ffffff' : '#e20074',
                color: hasSession ? '#d90000' : '#ffffff',
                border: hasSession ? '1.5px solid #d90000' : 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '700',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.85';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              {hasSession ? 'Logout' : 'Login'}
            </button>

            {/* Locale Switch */}
            <LocaleSwitch localeManager={localeManager} />
          </div>
        </header>

        {/* MODULES MODAL */}
        <ModulesModal isOpen={showModulesModal} modules={modules} onClose={this.toggleModulesModal} />

        {/* MAIN CONTENT */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <ResizableSidebar collapsed={sidebarCollapsed}>
            <NavigationList collapsed={sidebarCollapsed} />
          </ResizableSidebar>

          <main style={{ flex: 1, background: '#fafafa', overflowY: 'auto' }}>
            <ReactiveOutlet />
          </main>
        </div>
      </div>
    );
  }
}