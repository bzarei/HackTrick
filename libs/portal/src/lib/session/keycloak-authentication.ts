import Keycloak, { KeycloakInstance } from 'keycloak-js';
import { AuthenticationService, User } from './authentication';

export class KeycloakAuthenticationService implements AuthenticationService {
  private keycloak: KeycloakInstance;
  private initialized = false;

  constructor() {
    this.keycloak = new (Keycloak as any)({
      url: 'http://localhost:8080',
      realm: 'service',
      clientId: 'service-browser',
    });
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    console.log('[KeycloakAuthenticationService] Initializing with current URL:', window.location.href);
    await this.keycloak.init({
      onLoad: 'check-sso', //'login-required','check-sso'
      flow: 'standard',
      checkLoginIframe: false,
      // Don't set redirectUri here - let Keycloak use current URL
      // redirectUri will be set only during explicit login() call
      //pkceMethod: 'S256',
    });

    this.initialized = true;
  }

  async login(): Promise<void> {
    await this.init();
    const loginRedirectUrl = window.location.href;
    console.log('[KeycloakAuthenticationService] Login called, will redirect to:', loginRedirectUrl);
    await this.keycloak.login({
      redirectUri: loginRedirectUrl
    });
  }

  async logout(): Promise<void> {
    await this.init();
    await this.keycloak.logout();
  }

  getToken(): string | null {
    return this.keycloak.token ?? null;
  }

  getAccessToken(): string | null {
    return this.keycloak.token ?? null;
  }

  getIdToken(): string | null {
    return this.keycloak.idToken ?? null;
  }

  getRefreshToken(): string | null {
    return this.keycloak.refreshToken ?? null;
  }

  getUserProfile(): User | null {
    if (!this.keycloak.authenticated || !this.keycloak.idTokenParsed)
      return null;

    return this.keycloak.idTokenParsed as User;
  }

  isAuthenticated(): boolean {
    return !!this.keycloak.authenticated;
  }
}
