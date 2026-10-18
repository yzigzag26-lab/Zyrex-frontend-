import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { devAuthService, type AuthService, type AuthSession } from "./devAuth";

type AuthStatus = "anonymous" | "authenticated";

interface AuthContextValue {
  status: AuthStatus;
  session: AuthSession | null;
  signIn: (password: string) => Promise<boolean>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Authentication boundary for the private admin app.
 *
 * The UI talks only to this abstraction. Swap `service` for a backend
 * implementation when production auth is ready — the login page does not
 * need to change.
 */
export function AuthProvider({
  children,
  service = devAuthService,
}: {
  children: ReactNode;
  service?: AuthService;
}) {
  const [session, setSession] = useState<AuthSession | null>(() => service.restoreSession());

  const signIn = useCallback(
    async (password: string) => {
      const result = await service.signIn(password);
      if (!result.ok) return false;
      setSession(result.session);
      return true;
    },
    [service],
  );

  const signOut = useCallback(() => {
    service.clearSession();
    setSession(null);
  }, [service]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: session ? "authenticated" : "anonymous",
      session,
      signIn,
      signOut,
    }),
    [session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
