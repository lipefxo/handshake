import { useState } from 'react';
import type { ProposalAccessGrant } from '../../types/proposal';
import { useProposalStore } from '../../store/proposalStore';

interface EmailGateProps {
  proposalId: string;
  proposalTitle: string;
  onGranted: (grant: ProposalAccessGrant) => void | Promise<void>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailGate({ proposalId, proposalTitle, onGranted }: EmailGateProps) {
  const verifyProposalEmail = useProposalStore((state) => state.verifyProposalEmail);
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

    try {
      const grant = await verifyProposalEmail(proposalId, trimmed);
      if (!grant) {
        setError('Something went wrong. Please try again.');
        return;
      }
      await onGranted(grant);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
          <span className="block mt-1 opacity-80">{proposalTitle}</span>
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
