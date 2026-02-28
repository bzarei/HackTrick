import { Subject } from "rxjs";
import { AuthenticationRequest, Authentication, Ticket, Session } from "./authentication";

export interface SessionEvent<U=any,T extends Ticket = Ticket> {
    type: "opening" | "opened" | "closing" | "closed"
    session: Session<U,T>
}

export class SessionManager<U = any, T extends Ticket = Ticket> {
  public readonly events$ = new Subject<SessionEvent<U, T>>();

  private session: Session<U, T> | null = null;

  // constructor

  constructor(protected authentication: Authentication<U, T>) {}

  // implement 

  async start(): Promise<Session<U, T> | null> {
    const restored = await this.authentication.init();

    if (restored) {
      this.setSession(restored);
    }

    return this.session;
  }

  hasSession(): boolean {
    return this.session !== null;
  }

  currentSession(): Session<U, T> {
    if (!this.session) {
      throw new Error('No active session');
    }
    return this.session;
  }

  async openSession(request: AuthenticationRequest = {}): Promise<Session<U, T>> {
    const session = await this.authentication.authenticate(request);
    this.setSession(session);

    return session;
  }

  async closeSession(): Promise<void> {
    await this.authentication.logout();
    
    this.clearSession();
  }

  // protected

  protected setSession(session: Session<U, T>) {
    this.session = session;

    this.events$.next({ type: 'opened', session });
  }

  protected clearSession() {
    const session = this.session

    this.session = null;
    this.events$.next({ type: 'closed', session: session! });
  }
}