import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/router";
import {
  ApiError,
  auth as authApi,
  clearTokens,
  hasStoredSession,
  setSessionLostHandler,
  type ApiUser,
} from "@/lib/api";

type Status = "loading" | "authenticated" | "anonymous";

interface AuthValue {
  user: ApiUser | null;
  status: Status;
  isStaff: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<ApiUser>;
  signUp: (name: string, email: string, password: string) => Promise<ApiUser>;
  signOut: () => Promise<void>;
  /** Re-reads `/auth/me` — call after a profile or role change. */
  refresh: () => Promise<void>;
  /** Sends the browser to `/signin?next=…` and returns false, for guards. */
  requireAuth: (nextPath?: string) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  // Hydrate the session from the stored access token on first mount.
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!hasStoredSession()) {
        if (!cancelled) setStatus("anonymous");
        return;
      }
      try {
        const { user: me } = await authApi.me();
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      } catch (err) {
        if (cancelled) return;
        // Anything other than "not signed in" is worth surfacing in the console;
        // either way the visitor is treated as anonymous.
        if (!(err instanceof ApiError && err.isAuth)) console.warn("auth hydrate failed", err);
        clearTokens();
        setUser(null);
        setStatus("anonymous");
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // The client calls this when a refresh attempt fails for good.
  useEffect(() => {
    setSessionLostHandler(() => {
      setUser(null);
      setStatus("anonymous");
    });
    return () => setSessionLostHandler(null);
  }, []);

  const signIn = useCallback<AuthValue["signIn"]>(async (email, password, remember = true) => {
    const session = await authApi.login({ email, password, remember });
    setUser(session.user);
    setStatus("authenticated");
    return session.user;
  }, []);

  const signUp = useCallback<AuthValue["signUp"]>(async (name, email, password) => {
    const session = await authApi.register({ name, email, password });
    setUser(session.user);
    setStatus("authenticated");
    return session.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { user: me } = await authApi.me();
      setUser(me);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  const requireAuth = useCallback<AuthValue["requireAuth"]>(
    (nextPath) => {
      if (user) return true;
      const next = nextPath ?? router.asPath;
      router.push(`/signin?next=${encodeURIComponent(next)}`);
      return false;
    },
    [router, user],
  );

  const value = useMemo<AuthValue>(
    () => ({
      user,
      status,
      isStaff: user?.role === "admin" || user?.role === "instructor",
      isAdmin: user?.role === "admin",
      signIn,
      signUp,
      signOut,
      refresh,
      requireAuth,
    }),
    [user, status, signIn, signUp, signOut, refresh, requireAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
