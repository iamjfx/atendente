import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { db } from "@/integrations/db/client";

interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

interface Session {
  access_token: string;
  refresh_token?: string;
  user: User | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTokenAndSession = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (token) {
        try {
          await db.auth.setSession({ access_token: token, refresh_token: "" });
          // Limpa token da URL para manter limpo
          const url = new URL(window.location.href);
          url.searchParams.delete("token");
          window.history.replaceState({}, document.title, url.pathname + url.search);
        } catch (err) {
          console.error("Erro ao definir sessao via SSO:", err);
        }
      }

      const { data: { session } } = await db.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    void checkTokenAndSession();

    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await db.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
