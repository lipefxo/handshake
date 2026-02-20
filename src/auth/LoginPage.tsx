import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../supabaseClient';
import { AppIcon } from '../shared/icons/AppIcon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    const message = sessionStorage.getItem('authMessage');
    if (message) {
      setInfoMessage(message);
      sessionStorage.removeItem('authMessage');
    }
  }, []);

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

  return (
    <div className="min-h-screen bg-admin flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 mb-4">
            <AppIcon icon="ui.home" size={28} />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-body)' }}>
            Handshake
          </h1>
          <p className="text-sm text-gray-500">Partnership Proposal Studio</p>
        </div>

        <Card className="rounded-2xl shadow-xl shadow-black/5">
          {!sent ? (
            <>
              <CardHeader className="px-6 pt-6 pb-0">
                <CardTitle className="text-lg text-gray-900">Sign in</CardTitle>
                <CardDescription>We'll send a magic link to your email.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="email" className="text-xs font-medium text-gray-600">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@securebags.com"
                      required
                      autoFocus
                    />
                  </div>

                  {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                      {error}
                    </p>
                  )}
                  {infoMessage && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
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
                <h3 className="text-base font-semibold text-gray-900 mb-2">Check your inbox</h3>
                <p className="text-sm text-gray-500">
                  We sent a magic link to <strong className="text-gray-700">{email}</strong>.
                  Click it to sign in.
                </p>
                <Button
                  variant="link"
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-3 h-auto p-0 text-xs text-gray-500"
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
