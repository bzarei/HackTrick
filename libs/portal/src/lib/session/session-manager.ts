
// session manager

import { AuthenticationService, Ticket, User } from './authentication';

export interface Session<U extends User, T extends Ticket = Ticket> {
  /**
   * the user object
   */
  user: U;
  /**
   * the ticket
   */
  ticket: T;
  /**
   * the session expiry in ms.
   */
  expiry?: number;

  /**
   * the session locale
   */
  locale?: string;

  /**
   * any other properties
   */
  [prop: string]: any;
}

export class SessionManager<U extends User, T extends Ticket> {
  // instance data

  private session?: Session<U, T>;
  private listeners = new Set<() => void>();

  onSessionChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitSessionChange() {
    for (const l of this.listeners) l();
  }

  // constructor

  constructor(private authenticationService: AuthenticationService) {}

  // lifecycle

  async init(): Promise<void> {
    // Try to initialize auth service (this checks SSO)

    await this.authenticationService.init();

    if (this.authenticationService.isAuthenticated()) {
      const accessToken = this.authenticationService.getAccessToken()!;
      const idToken = this.authenticationService.getIdToken()!;
      const refreshToken = this.authenticationService.getRefreshToken()!;
      const user = this.authenticationService.getUserProfile()!;
      const expiresAt = Date.now() + (user.exp ?? 3600) * 1000;

      this.session = {
        user: user as U,
        ticket: {
          idToken: idToken,
          accessToken: accessToken,
          refreshToken: refreshToken,
        } as T,
        expiry: expiresAt,
        locale: 'TODO',
        //accessToken, idToken, refreshToken, user, expiresAt
      };
    }
  }

  // public

  async openSession() {
    await this.authenticationService.login();
    await this.init();

    this.emitSessionChange()
  }

  async closeSession() {
    await this.authenticationService.logout();
    this.session = undefined;

    this.emitSessionChange()
  }

  /**
   * retrieve a session locale value
   * @param key the key
   */
  get<TYPE>(key: string): TYPE {
    return this.session![key];
  }

  /**
   * set a session locale value
   * @param key the key
   * @param value the value
   */
  set<TYPE>(key: string, value: TYPE): void {
    this.session![key] = value;
  }

  /**
   * return <code>true</code>, if there is an active session, <code>false</code> otherwise
   */
  hasSession(): boolean {
    return this.session != undefined;
  }

  /**
   * return the current session
   */
  currentSession(): Session<U, T> | undefined {
    return this.session;
  }

  /**
   * return the current user.
   */
  getUser(): U | undefined {
    return this.session?.user;
  }
}
