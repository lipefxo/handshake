import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    });
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
