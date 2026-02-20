import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useIdleTimeout } from '../shared/hooks/useIdleTimeout';
import { useAuthStore } from '../store/authStore';

interface IdleTimeoutProps {
  children: React.ReactNode;
}

export function IdleTimeout({ children }: IdleTimeoutProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const handleTimeout = useCallback(async () => {
    if (!user) return;
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/login', { replace: true });
  }, [navigate, user]);

  const { showWarning } = useIdleTimeout({
    timeoutMs: 30 * 60 * 1000,
    warningMs: 25 * 60 * 1000,
    onTimeout: handleTimeout,
  });

  return (
    <>
      {children}
      {showWarning && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-gray-900">Inactive session</h2>
            <p className="mt-2 text-sm text-gray-600">
              You&apos;ll be signed out in 5 minutes due to inactivity.
            </p>
            <p className="mt-3 text-xs text-gray-500">
              Move your mouse, type, or interact with the page to stay signed in.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
