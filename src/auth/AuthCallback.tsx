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
    <div className="flex items-center justify-center min-h-screen bg-admin">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#e5e3de] border-t-[#d4785c] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#6b6b6b]">Signing you in…</p>
      </div>
    </div>
  );
}
