'use client';

import type { PlanId } from '@gestor/shared';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { authClient } from '@/lib/auth-client';

export interface Session {
  user: { id: string; email: string; name: string };
  tenant: { id: string; name: string; slug: string; plan: PlanId };
  membershipId: string;
  permissions: string[];
}

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Relê `/api/me` (ex.: depois de trocar de plano). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchSession(): Promise<Session | null> {
  const response = await fetch('/api/me', { credentials: 'include' });
  return response.ok ? ((await response.json()) as Session) : null;
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const { data: authSession, isPending } = authClient.useSession();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (isPending) return;
    if (!authSession) {
      setSession(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchSession()
      .then((data) => {
        if (active) setSession(data);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authSession, isPending]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSession(await fetchSession());
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await authClient.signIn.email({ email, password });
    if (error) throw new Error(error.message ?? 'Falha no login');
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut();
    setSession(null);
    if (typeof window !== 'undefined') window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}
