import {
  Feature,
  RouteChangeNotifier,
  DeploymentManager,
  SessionManager,
  EnvironmentContext,
} from '@novx/portal';
import React from 'react';
import {  Outlet, useLocation } from 'react-router-dom';

import { NavigationList} from "./navigation-list"

const ReactiveOutlet: React.FC = () => {
  const location = useLocation();
  // By using location here, this component re-renders on route changes
  // and causes the Outlet to re-render too
  return <Outlet key={location.pathname} />;
};

import { LocaleManager } from '@novx/i18n';
import { of } from 'rxjs';
import { Environment } from '@novx/core';


@Feature({
  id: 'private-navigation',
  label: 'Navigation',
  visibility: ["private"],
  tags: ['portal'],
  path: '/'
})
export class Navigation extends React.Component<
  {},
  { sidebarCollapsed: boolean; currentPath: string; showModulesModal: boolean; hasSession: boolean }
> {
  private unsubscribe?: () => void;


  state = {
    sidebarCollapsed: false,
    currentPath: window.location.pathname,
    showModulesModal: false,
    hasSession: false,
  };

   static contextType = EnvironmentContext

   declare context: Environment

  componentDidMount() {

    const notifier = this.context.get(RouteChangeNotifier);
    this.unsubscribe = notifier.subscribe((location) => {
      console.log('[Navigation] Route changed to:', location.pathname);
      this.setState({ currentPath: location.pathname });
    });

     const localeManager = this.context.get(LocaleManager);
     //this.localeUnsubscribe =
       localeManager.subscribe({
       onLocaleChange: () => {
         // Trigger re-render to reflect updated labels
         this.setState({});
         return of({})
       },
     });

    this.updateSessionState();
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  updateSessionState = () => {
    const sessionManager = this.context.get(SessionManager);
    this.setState({ hasSession: sessionManager.hasSession() });
  };

  toggleSidebar = () => {
    this.setState({ sidebarCollapsed: !this.state.sidebarCollapsed });
  };

  toggleModulesModal = () => {
    this.setState({ showModulesModal: !this.state.showModulesModal });
  };

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
    const sessionManager = this.context.get(SessionManager);

    const { sidebarCollapsed, currentPath, showModulesModal, hasSession } = this.state;

    const user = sessionManager.getUser();

    const deployment = deploymentManager.deployment;
    const modules = deployment ? Object.entries(deployment.modules).map(([name, manifest]) => ({
      name,
      label: manifest.label || name,
      version: manifest.version || 'N/A',
      loaded: manifest.loaded || false,
    })) : [];

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          fontFamily: 'Arial, sans-serif',
        }}
      >
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
          <button
            onClick={this.toggleSidebar}
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
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>My App</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={this.toggleModulesModal}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4a5568',
                color: '#fff',
                border: '1px solid #2d3748',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5a6578';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4a5568';
              }}
            >
              <span>📦</span>
              <span>
                Modules ({modules.filter((m) => m.loaded).length}/
                {modules.length})
              </span>
            </button>
            <button
              onClick={this.handleLoginLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: hasSession ? '#d32f2f' : '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hasSession
                  ? '#f44336'
                  : '#1565c0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = hasSession
                  ? '#d32f2f'
                  : '#1976d2';
              }}
            >
              {hasSession ? 'Logout' : 'Login'}
            </button>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 12px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: hasSession ? '#4a5568' : '#666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '16px',
                }}
              >
                {hasSession && user ? user.name?.charAt(0).toUpperCase() : '?'}
              </div>
              {hasSession && user && (
                <div
                  style={{
                    fontSize: '12px',
                    lineHeight: '1.2',
                  }}
                >
                  <div style={{ fontWeight: '600' }}>{user.name}</div>
                  <div style={{ color: '#aaa', fontSize: '11px' }}>
                    {user.email}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ position: 'relative', display: 'inline-block' }}>
  <div style={{ position: 'relative' }}>
    {/* Globe/i18n icon */}
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
      value={this.context.get(LocaleManager).getLocale().toString()}
      onChange={(e) => this.setLocale(e.target.value)}
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
      onMouseEnter={(e) => {
        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
      }}
    >
      {this.context.get(LocaleManager).supportedLocales.map((loc) => (
        <option key={loc.toString()} value={loc.toString()}>
          {loc.toString()}
        </option>
      ))}
    </select>
  </div>
</div>
        </header>

        {/* Modules Modal */}
        {showModulesModal && (
          <>
            {/* Backdrop */}
            <div
              onClick={this.toggleModulesModal}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                zIndex: 999,
                backdropFilter: 'blur(2px)',
              }}
            />

            {/* Modal */}
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#0d0d0d',
                border: '1px solid #333',
                borderRadius: '12px',
                padding: '32px',
                minWidth: '600px',
                maxWidth: '80vw',
                maxHeight: '80vh',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #333',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#fff',
                  }}
                >
                  Loaded Modules
                </h2>
                <button
                  onClick={this.toggleModulesModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#a0a0a0',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#a0a0a0';
                  }}
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              {modules.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#a0a0a0',
                  }}
                >
                  <p>No modules loaded yet.</p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  {modules.map((module) => (
                    <div
                      key={module.name}
                      style={{
                        backgroundColor: '#1a1a1a',
                        border: `1px solid ${module.loaded ? '#22c55e' : '#333'}`,
                        borderRadius: '8px',
                        padding: '20px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          <span style={{ fontSize: '24px' }}>📦</span>
                          <div>
                            <h3
                              style={{
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#60a5fa',
                              }}
                            >
                              {module.label}
                            </h3>
                            <div
                              style={{
                                fontSize: '13px',
                                color: '#a0a0a0',
                                marginTop: '4px',
                              }}
                            >
                              {module.name}
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: module.loaded
                              ? '#22c55e20'
                              : '#71717a20',
                            border: `1px solid ${module.loaded ? '#22c55e' : '#71717a'}`,
                            fontSize: '12px',
                            fontWeight: '600',
                            color: module.loaded ? '#22c55e' : '#a0a0a0',
                          }}
                        >
                          <span>{module.loaded ? '●' : '○'}</span>
                          <span>{module.loaded ? 'LOADED' : 'NOT LOADED'}</span>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: '12px',
                          fontSize: '13px',
                          color: '#a0a0a0',
                        }}
                      >
                        <strong style={{ color: '#e0e0e0' }}>Version:</strong>{' '}
                        {module.version}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

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
          ><NavigationList collapsed={sidebarCollapsed} />
          </aside>

          <main style={{ flex: 1, background: '#f4f4f4', overflowY: 'auto' }}>
            <ReactiveOutlet />
          </main>
        </div>
      </div>
    );
  }
}
