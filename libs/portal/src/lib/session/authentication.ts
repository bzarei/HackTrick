export interface Ticket {
  accessToken: string,
  idToken : string
  refreshToken: string
}

export interface User {
  given_name: string;
  family_name: string;
  email: string;
  email_verified: string;
  name: string;
  preferred_username: string;
  sub: string;

  // did we forget something?

  [prop: string]: any;
}

// basic authentication service

export interface AuthenticationService {
  init(): Promise<void>;
  login(): Promise<void>;
  logout(): Promise<void>;
  getIdToken(): string | null;
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  isAuthenticated(): boolean;
  getUserProfile(): User | null;
}
