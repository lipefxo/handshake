import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { AppIcon } from '../shared/icons/AppIcon';
import { BrandLogo } from '../shared/components/BrandLogo';
import { BrandWordmark } from '../shared/components/BrandWordmark';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '../store/authStore';

export function LoginPage() {
  const DEV_AUTH_BYPASS_KEY = 'devAuthBypassUser';
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage] = useState(() => sessionStorage.getItem('authMessage') ?? '');

  useEffect(() => {
    if (!infoMessage) return;
    sessionStorage.removeItem('authMessage');
  }, [infoMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  const handleDevBypassLogin = () => {
    const bypassUser = {
      id: 'dev-local-user',
      email: 'dev@local.test',
      displayName: 'Local Tester',
    };
    sessionStorage.setItem(DEV_AUTH_BYPASS_KEY, JSON.stringify(bypassUser));
    setUser(bypassUser);
    navigate('/admin', { replace: true });
  };

  return (
    <div className="app-shell relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="mb-3 inline-flex items-center justify-center gap-3 rounded-full border border-[var(--app-border-subtle)] bg-[var(--app-bg-canvas)]/75 px-4 py-2 shadow-[var(--app-shadow-soft)]">
            <BrandLogo variant="light" className="h-8 w-8" aria-label="Handshake logo" />
            <BrandWordmark variant="light" className="h-5 w-auto" aria-label="Handshake" />
          </div>
          <p className="font-brand-mono text-[11px] uppercase tracking-[0.16em] text-[var(--app-text-muted)]">
            Proposal Studio
          </p>
        </div>

        <Card className="rounded-[var(--app-radius-lg)] border-[var(--app-border-subtle)] bg-[rgba(247,247,244,0.82)] shadow-[var(--app-shadow-elevated)]">
          {!sent ? (
            <>
              <CardHeader className="px-6 pt-6 pb-0">
                <CardTitle className="text-[1.35rem] text-[var(--app-text-strong)]">Sign in</CardTitle>
                <CardDescription className="mt-1 text-sm text-[var(--app-text-secondary)]">
                  We&apos;ll send a magic link to your email.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="email" className="font-brand-mono text-[11px] uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@acmecorp.com"
                      required
                      autoFocus
                    />
                  </div>

                  {error && (
                    <p className="rounded-[var(--app-radius-sm)] border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                      {error}
                    </p>
                  )}
                  {infoMessage && (
                    <p className="rounded-[var(--app-radius-sm)] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                      {infoMessage}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Sending...
                      </span>
                    ) : (
                      'Send magic link'
                    )}
                  </Button>
                  {import.meta.env.DEV && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDevBypassLogin}
                      className="w-full"
                    >
                      Dev bypass login
                    </Button>
                  )}
                  {import.meta.env.DEV && (
                    <p className="text-center text-[11px] text-[var(--app-text-muted)]">
                      Local development shortcut (disabled in production)
                    </p>
                  )}
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AppIcon icon="ui.check" className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-brand-serif text-lg text-[var(--app-text-strong)] mb-1.5">Check your inbox</h3>
                <p className="text-sm text-[var(--app-text-secondary)]">
                  We sent a magic link to <strong className="text-[var(--app-text-primary)]">{email}</strong>.
                  Click it to sign in.
                </p>
                <Button
                  variant="link"
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-3 text-xs text-[var(--app-text-muted)]"
                >
                  Use a different email
                </Button>
              </motion.div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
