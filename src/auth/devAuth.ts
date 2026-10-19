/**
 * Development-only authentication module.
 *
 * THIS IS NOT PRODUCTION AUTHENTICATION.
 * The comparison below exists so the private admin UI can be developed
 * before a backend identity service is attached. Replace `devAuthService`
 * with a server-backed implementation without changing the login UI.
 *
 * Never log, persist, or echo the submitted credential.
 */

export const DEV_AUTH_NOTICE =
  "Development credential module — authorization must be enforced server-side in production.";

const DEV_PASSWORD = "CLICHE";

export function verifyDevelopmentCredential(input: string): boolean {
  return input.trim().toLowerCase() === DEV_PASSWORD.toLowerCase();
}

export interface AuthSession {
  token: string;
  createdAt: number;
}

export type SignInResult = { ok: true; session: AuthSession } | { ok: false };

export interface AuthService {
  signIn(password: string): Promise<SignInResult>;
  restoreSession(): AuthSession | null;
  persistSession(session: AuthSession): void;
  clearSession(): void;
}

const SESSION_KEY = "hermes.admin.session";

function randomToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `dev-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function readStoredSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (typeof parsed.token === "string" && typeof parsed.createdAt === "number") {
      return { token: parsed.token, createdAt: parsed.createdAt };
    }
  } catch {
    /* session storage unavailable or corrupt */
  }
  return null;
}

/**
 * Temporary development auth service.
 * Session tokens are kept in sessionStorage (not localStorage) and never
 * contain the password. Production must authenticate against the backend.
 */
export const devAuthService: AuthService = {
  async signIn(password: string): Promise<SignInResult> {
    if (!verifyDevelopmentCredential(password)) {
      return { ok: false };
    }
    const session: AuthSession = { token: randomToken(), createdAt: Date.now() };
    this.persistSession(session);
    return { ok: true, session };
  },

  restoreSession(): AuthSession | null {
    return readStoredSession();
  },

  persistSession(session: AuthSession): void {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      /* session remains in memory only */
    }
  },

  clearSession(): void {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  },
};
