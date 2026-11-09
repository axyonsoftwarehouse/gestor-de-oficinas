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

/** Última sessão válida no aparelho — permite abrir o app sem rede. */
const SESSION_CACHE_KEY = 'gestor.session';
/** Cache de dados do React Query; limpo na troca de usuário. */
const QUERY_CACHE_KEY = 'gestor.query-cache';
/** Se o Better Auth não responder sem rede, cai no cache depois disso. */
const OFFLINE_FALLBACK_MS = 4000;

function clearQueryCache(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(QUERY_CACHE_KEY);
  } catch {
    // storage bloqueado: nada a limpar
  }
}

function readCachedSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeCachedSession(session: Session | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (session) window.localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_CACHE_KEY);
  } catch {
    // Sem espaço ou storage bloqueado: seguir sem cache.
  }
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

async function fetchSession(): Promise<Session | null> {
  const response = await fetch('/api/me', { credentials: 'include' });
  return response.ok ? ((await response.json()) as Session) : null;
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const { data: authSession, isPending } = authClient.useSession();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Rede de segurança: se o hook de sessão do Better Auth ficar pendurado sem
  // conexão, usa a última sessão conhecida em vez de mostrar o spinner eterno.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isOffline()) {
        const cached = readCachedSession();
        if (cached) {
          setSession(cached);
          setLoading(false);
        }
      }
    }, OFFLINE_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    if (isPending) return;

    if (!authSession) {
      if (isOffline()) {
        setSession(readCachedSession());
      } else {
        writeCachedSession(null);
        setSession(null);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchSession()
      .then((data) => {
        if (!active) return;
        setSession(data);
        writeCachedSession(data);
      })
      .catch(() => {
        if (!active) return;
        // Falha de rede: mantém a sessão em cache em vez de expulsar para o login.
        setSession(readCachedSession());
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
      const data = await fetchSession();
      setSession(data);
      writeCachedSession(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Um novo login nunca deve herdar dados do usuário anterior no aparelho.
    clearQueryCache();
    const { error } = await authClient.signIn.email({ email, password });
    if (error) throw new Error(error.message ?? 'Falha no login');
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut();
    writeCachedSession(null);
    clearQueryCache();
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
