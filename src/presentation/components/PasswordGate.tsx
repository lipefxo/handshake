import { useState } from 'react';
import type { ProposalAccessGrant } from '../../types/proposal';
import { useProposalStore } from '../../store/proposalStore';

interface PasswordGateProps {
  proposalId: string;
  proposalTitle: string;
  onGranted: (grant: ProposalAccessGrant) => void | Promise<void>;
}

export function PasswordGate({ proposalId, proposalTitle, onGranted }: PasswordGateProps) {
  const verifyProposalPassword = useProposalStore((state) => state.verifyProposalPassword);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setChecking(true);
    setError('');

    try {
      const grant = await verifyProposalPassword(proposalId, password.trim());
      if (grant) {
        await onGranted(grant);
      } else {
        setError('Incorrect password. Try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setChecking(false);
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
        <p className="text-3xl mb-4 text-center opacity-30">🔒</p>
        <h1
          className="text-xl font-semibold text-center mb-1"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          Password required
        </h1>
        <p
          className="text-sm text-center mb-6"
          style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
        >
          This proposal is password protected.
          <span className="block mt-1 opacity-80">{proposalTitle}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
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
            disabled={checking || !password}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-50"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-bg-primary)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {checking ? 'Checking…' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
