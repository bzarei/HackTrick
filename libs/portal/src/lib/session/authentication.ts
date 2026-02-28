
export interface AuthenticationRequest {
  user?: string;
  password?: string;

  [prop: string]: any;
}

export interface Ticket {
  [prop: string]: any;
}

export interface Session<U = any, T extends Ticket = Ticket> {
  user: U;
  ticket: T;
  expiry?: number;
  locale?: string;

  [prop: string]: any;
}

export interface Authentication<U = any, T extends Ticket = Ticket> {
 authenticate(request: AuthenticationRequest): Promise<Session<U, T>>;

 init(): Promise<Session<U, T> | null>;

 logout(): Promise<void>;
}