import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export function AuthCallback() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const hasHashTokens = window.location.hash.includes('access_token');

    if (hasHashTokens) {
      // Magic link tokens are in the URL hash — the Supabase client will
      // pick them up and fire an auth state change. Listen for it rather
      // than calling getSession() before the exchange completes.
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        // SIGNED_IN fires if tokens are exchanged after we subscribe.
        // INITIAL_SESSION fires (with the established session) if the Supabase
        // client already exchanged the hash tokens before this effect ran.
        // Both cases must navigate to /admin so we never get stuck on a timeout.
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          subscription.unsubscribe();
          navigate('/admin', { replace: true });
        }
      });

      const timeout = window.setTimeout(() => {
        subscription.unsubscribe();
        navigate('/login', { replace: true });
      }, 10_000);

      return () => {
        subscription.unsubscribe();
        window.clearTimeout(timeout);
      };
    }

    // No hash tokens — check for an existing session directly.
    supabase.auth.getSession().then(({ data: { session } }) => {
      navigate(session ? '/admin' : '/login', { replace: true });
    });

    return undefined;
  }, [navigate]);

  return (
    <div className="app-shell flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--app-border-strong)] border-t-primary" />
        <p className="font-brand-mono text-[11px] uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
          Signing you in
        </p>
      </div>
    </div>
  );
}
