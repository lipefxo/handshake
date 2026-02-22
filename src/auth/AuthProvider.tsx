import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
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
  const { initializeWorkspace, clearWorkspaceState } = useWorkspaceStore();

  useEffect(() => {
    const mapSessionUser = (sessionUser: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>['user']): AppUser => ({
      id: sessionUser.id,
      email: sessionUser.email ?? '',
      displayName: sessionUser.user_metadata?.full_name,
      avatarUrl: sessionUser.user_metadata?.avatar_url,
    });

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        sessionStorage.removeItem(DEV_AUTH_BYPASS_KEY);
        const appUser = mapSessionUser(session.user);
        setUser(appUser);
        await initializeWorkspace(appUser);
      } else {
        setUser(getDevBypassUser());
        clearWorkspaceState();
      }

      setLoading(false);
      setInitialized(true);
    };

    void initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        sessionStorage.removeItem(DEV_AUTH_BYPASS_KEY);
        const appUser = mapSessionUser(session.user);
        setUser(appUser);
        void initializeWorkspace(appUser);
      } else if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem(DEV_AUTH_BYPASS_KEY);
        setUser(null);
        clearWorkspaceState();
        sessionStorage.setItem('authMessage', 'Your session expired. Please sign in again.');
        navigate('/login', { replace: true });
      } else {
        setUser(getDevBypassUser());
        clearWorkspaceState();
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, setInitialized, navigate, initializeWorkspace, clearWorkspaceState]);

  return <IdleTimeout>{children}</IdleTimeout>;
}
