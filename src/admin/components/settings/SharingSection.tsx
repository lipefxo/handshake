import { useState } from 'react';
import bcrypt from 'bcryptjs';
import type { Proposal } from '../../../types/proposal';
import { copyToClipboard } from '../../../shared/utils/helpers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppIcon } from '../../../shared/icons/AppIcon';

interface SharingSectionProps {
  proposal: Proposal;
  onChange: (updates: Partial<Proposal>) => void;
  onImmediateSave: (updates: Partial<Proposal>) => void;
}

export function SharingSection({ proposal, onChange, onImmediateSave }: SharingSectionProps) {
  const [copied, setCopied] = useState<'url' | 'embed' | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [hashingPassword, setHashingPassword] = useState(false);
  const [expirationEnabled, setExpirationEnabled] = useState(!!proposal.expiresAt);

  const proposalUrl = `${window.location.origin}/p/${proposal.slug}`;
  const embedCode = `<iframe src="${proposalUrl}" width="960" height="540" frameborder="0" allowfullscreen></iframe>`;

  const handleCopy = async (type: 'url' | 'embed') => {
    await copyToClipboard(type === 'url' ? proposalUrl : embedCode);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleVisibilityChange = async (visibility: Proposal['visibility']) => {
    onImmediateSave({ visibility });
  };

  const handleSetPassword = async () => {
    if (!passwordInput.trim()) return;
    setHashingPassword(true);
    try {
      const hash = await bcrypt.hash(passwordInput, 10);
      onImmediateSave({ accessPassword: hash });
      setPasswordInput('');
    } finally {
      setHashingPassword(false);
    }
  };

  const handleExpirationToggle = (checked: boolean) => {
    setExpirationEnabled(checked);
    if (!checked) {
      onImmediateSave({ expiresAt: undefined });
    }
  };

  const handleExpirationDateChange = (val: string) => {
    if (!val) {
      onChange({ expiresAt: undefined });
      return;
    }
    // Store as UTC ISO string
    const date = new Date(val);
    onChange({ expiresAt: date.toISOString() });
  };

  const localDateValue = proposal.expiresAt
    ? new Date(proposal.expiresAt).toISOString().split('T')[0]
    : '';

  return (
    <section id="sharing" className="scroll-mt-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">Sharing</h2>
        <p className="text-xs text-gray-400 mt-0.5">Control how viewers access this proposal.</p>
        <hr className="mt-3 border-gray-100" />
      </div>

      <div className="space-y-6">
        {/* Proposal URL */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Proposal URL</label>
          {proposal.status === 'draft' && (
            <p className="mb-2 text-xs text-gray-400">Publish this proposal to make this link active.</p>
          )}
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={proposalUrl}
              className="text-xs font-mono text-gray-500 bg-gray-50"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopy('url')}
              className="flex-shrink-0 gap-1.5 text-xs"
            >
              {copied === 'url' ? (
                <><AppIcon icon="ui.check" className="w-3.5 h-3.5 text-green-500" /> Copied!</>
              ) : (
                <><AppIcon icon="ui.copy" className="w-3.5 h-3.5" /> Copy</>
              )}
            </Button>
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Access control</label>
          <div className="space-y-2">
            {([
              { value: 'public', label: 'Public', desc: 'Anyone with the link can view.' },
              { value: 'password', label: 'Password protected', desc: 'Viewers must enter a password.' },
              { value: 'email_gated', label: 'Email gate', desc: 'Viewers submit their email to access.' },
            ] as const).map((opt) => (
              <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value={opt.value}
                  checked={proposal.visibility === opt.value}
                  onChange={() => handleVisibilityChange(opt.value)}
                  className="mt-0.5 accent-gray-900"
                />
                <div>
                  <span className="text-sm text-gray-800">{opt.label}</span>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Password input for password-protected */}
          {proposal.visibility === 'password' && (
            <div className="mt-3 pl-6">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                {proposal.accessPassword ? 'Update password' : 'Set password'}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={proposal.accessPassword ? '••••••••' : 'Enter new password'}
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!passwordInput.trim() || hashingPassword}
                  onClick={handleSetPassword}
                  className="flex-shrink-0 text-xs"
                >
                  {hashingPassword ? 'Setting…' : 'Set'}
                </Button>
              </div>
              {proposal.accessPassword && (
                <p className="mt-1 text-xs text-gray-400">A password is currently set.</p>
              )}
            </div>
          )}

          {/* Email gate note */}
          {proposal.visibility === 'email_gated' && (
            <div className="mt-3 pl-6 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
              <p className="text-xs text-blue-700">
                Viewer emails will be captured in your leads table. You can view them in your Supabase dashboard.
              </p>
            </div>
          )}
        </div>

        {/* Expiration */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="expiration-toggle"
              checked={expirationEnabled}
              onChange={(e) => handleExpirationToggle(e.target.checked)}
              className="accent-gray-900"
            />
            <label htmlFor="expiration-toggle" className="text-xs font-medium text-gray-600 cursor-pointer">
              Set expiration date
            </label>
          </div>
          {expirationEnabled && (
            <div>
              <Input
                type="date"
                value={localDateValue}
                onChange={(e) => handleExpirationDateChange(e.target.value)}
                className="text-sm w-48"
              />
              <p className="mt-1 text-xs text-gray-400">
                After this date, viewers will see an "expired" page.
                {proposal.expiresAt && (
                  <> Expires: {new Date(proposal.expiresAt).toLocaleDateString()}.</>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Embed code */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Embed code</label>
          <div className="relative">
            <textarea
              readOnly
              value={embedCode}
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-500 resize-none"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopy('embed')}
              className="absolute top-2 right-2 gap-1 text-xs"
            >
              {copied === 'embed' ? (
                <><AppIcon icon="ui.check" className="w-3 h-3 text-green-500" /> Copied!</>
              ) : (
                <><AppIcon icon="ui.copy" className="w-3 h-3" /> Copy</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
