import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuthStore } from '../store/authStore';
import { IdleTimeout } from './IdleTimeout';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const { setUser, setLoading, setInitialized } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          displayName: session.user.user_metadata?.full_name,
          avatarUrl: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          displayName: session.user.user_metadata?.full_name,
          avatarUrl: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }

      if (event === 'SIGNED_OUT' && !session?.user) {
        sessionStorage.setItem('authMessage', 'Your session expired. Please sign in again.');
        navigate('/login', { replace: true });
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, setInitialized, navigate]);

  return <IdleTimeout>{children}</IdleTimeout>;
}
