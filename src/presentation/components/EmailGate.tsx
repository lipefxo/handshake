import { useState } from 'react';
import type { Proposal } from '../../types/proposal';
import { supabase } from '../../supabaseClient';

interface EmailGateProps {
  proposal: Proposal;
  onGranted: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailGate({ proposal, onGranted }: EmailGateProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!EMAIL_REGEX.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase
      .from('proposal_leads')
      .insert({ proposal_id: proposal.id, email: trimmed });

    // Ignore duplicate error (23505) — grant access either way
    if (insertError && insertError.code !== '23505') {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
      return;
    }

    onGranted();
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-8"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <p className="text-3xl mb-4 text-center opacity-30">✉️</p>
        <h1
          className="text-xl font-semibold text-center mb-1"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          Enter your email to continue
        </h1>
        <p
          className="text-sm text-center mb-6"
          style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
        >
          Please provide your email address to view this proposal.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoFocus
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-body)',
            }}
          />

          {error && (
            <p className="text-xs" style={{ color: 'var(--color-error)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-50"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-bg-primary)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {submitting ? 'Submitting…' : 'View Proposal'}
          </button>
        </form>
      </div>
    </div>
  );
}
