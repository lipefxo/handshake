import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useBillingStore } from '../store/billingStore';
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
    let initializedFromListener = false;

    const mapSessionUser = (sessionUser: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>['user']): AppUser => ({
      id: sessionUser.id,
      email: sessionUser.email ?? '',
      displayName: sessionUser.user_metadata?.full_name,
      avatarUrl: sessionUser.user_metadata?.avatar_url,
    });

    const handleSignedIn = async (sessionUser: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>['user']) => {
      sessionStorage.removeItem(DEV_AUTH_BYPASS_KEY);
      const appUser = mapSessionUser(sessionUser);
      setUser(appUser);
      await initializeWorkspace(appUser);
      void useBillingStore.getState().refresh();
      setLoading(false);
      setInitialized(true);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        initializedFromListener = true;
        void handleSignedIn(session.user);
      } else if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem(DEV_AUTH_BYPASS_KEY);
        setUser(null);
        clearWorkspaceState();
        useBillingStore.getState().clearBillingState();
        setLoading(false);
        setInitialized(true);
        sessionStorage.setItem('authMessage', 'Your session expired. Please sign in again.');
        navigate('/login', { replace: true });
      } else if (event === 'INITIAL_SESSION' && !session) {
        initializedFromListener = true;
        setUser(getDevBypassUser());
        clearWorkspaceState();
        useBillingStore.getState().clearBillingState();
        setLoading(false);
        setInitialized(true);
      }
    });

    // Fallback: if onAuthStateChange hasn't fired after a short delay
    // (e.g. older Supabase client), initialize from getSession directly.
    const fallbackTimeout = window.setTimeout(async () => {
      if (initializedFromListener) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleSignedIn(session.user);
      } else {
        setUser(getDevBypassUser());
        clearWorkspaceState();
        useBillingStore.getState().clearBillingState();
        setLoading(false);
        setInitialized(true);
      }
    }, 1000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(fallbackTimeout);
    };
  }, [setUser, setLoading, setInitialized, navigate, initializeWorkspace, clearWorkspaceState]);

  return <IdleTimeout>{children}</IdleTimeout>;
}
