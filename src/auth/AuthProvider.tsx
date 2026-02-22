import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuthStore } from '../store/authStore';
import { IdleTimeout } from './IdleTimeout';
import type { AppUser } from '../types/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

const DEV_AUTH_BYPASS_KEY = 'devAuthBypassUser';

function getDevBypassUser(): AppUser | null {
  if (!import.meta.env.DEV) return null;
  try {
    const raw = sessionStorage.getItem(DEV_AUTH_BYPASS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppUser>;
    if (!parsed.id || !parsed.email) return null;
    return {
      id: parsed.id,
      email: parsed.email,
      displayName: parsed.displayName,
      avatarUrl: parsed.avatarUrl,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const { setUser, setLoading, setInitialized } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        sessionStorage.removeItem(DEV_AUTH_BYPASS_KEY);
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          displayName: session.user.user_metadata?.full_name,
          avatarUrl: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(getDevBypassUser());
      }
      setLoading(false);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        sessionStorage.removeItem(DEV_AUTH_BYPASS_KEY);
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          displayName: session.user.user_metadata?.full_name,
          avatarUrl: session.user.user_metadata?.avatar_url,
        });
      } else if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem(DEV_AUTH_BYPASS_KEY);
        setUser(null);
        sessionStorage.setItem('authMessage', 'Your session expired. Please sign in again.');
        navigate('/login', { replace: true });
      } else {
        setUser(getDevBypassUser());
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, setInitialized, navigate]);

  return <IdleTimeout>{children}</IdleTimeout>;
}
