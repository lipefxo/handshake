import { useState } from 'react';
import type { Proposal } from '../../../types/proposal';
import { generateSlug, formatDate } from '../../../shared/utils/helpers';
import { generateSafeSlug } from '../../../shared/utils/validation';
import { supabase } from '../../../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

interface MetadataSectionProps {
  proposal: Proposal;
  onChange: (updates: Partial<Proposal>) => void;
  onImmediateSave: (updates: Partial<Proposal>) => void;
}

export function MetadataSection({ proposal, onChange, onImmediateSave }: MetadataSectionProps) {
  const [slugError, setSlugError] = useState('');
  const [slugValue, setSlugValue] = useState(proposal.slug);
  const [statusError, setStatusError] = useState('');

  const isPublished = proposal.status === 'published';
  const slugChanged = slugValue !== proposal.slug;

  const handleSlugChange = (val: string) => {
    const lower = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlugValue(lower);
    setSlugError('');

    if (lower && !SLUG_REGEX.test(lower)) {
      setSlugError('Slug must start and end with a letter or number.');
    } else if (lower.length > 100) {
      setSlugError('Slug must be 100 characters or fewer.');
    }
  };

  const handleSlugBlur = async () => {
    const safe = generateSafeSlug(slugValue);
    if (!safe || !SLUG_REGEX.test(safe)) {
      setSlugError('Invalid slug format.');
      return;
    }

    if (safe === proposal.slug) return;

    // Check uniqueness
    const { data } = await supabase
      .from('proposals')
      .select('id')
      .eq('slug', safe)
      .neq('id', proposal.id);

    if (data && data.length > 0) {
      setSlugError('This URL is already taken. Please choose a different one.');
      return;
    }

    setSlugError('');
    onChange({ slug: safe });
    setSlugValue(safe);
  };

  const handleRegenerate = () => {
    const newSlug = generateSlug(proposal.partnerName);
    setSlugValue(newSlug);
    setSlugError('');
    onChange({ slug: newSlug });
  };

  const handleStatusChange = (newStatus: 'draft' | 'published') => {
    if (newStatus === 'published') {
      const enabledCount = proposal.slides.filter((s) => s.enabled).length;
      if (enabledCount === 0) {
        setStatusError('Add at least one enabled slide before publishing.');
        return;
      }
    }
    setStatusError('');
    onImmediateSave({ status: newStatus });
  };

  return (
    <section id="general" className="scroll-mt-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">General</h2>
        <p className="text-xs text-gray-400 mt-0.5">Proposal metadata and publishing settings.</p>
        <hr className="mt-3 border-gray-100" />
      </div>

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Proposal title <span className="text-red-400">*</span>
          </label>
          <Input
            value={proposal.title}
            maxLength={200}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Partnership Proposal"
          />
        </div>

        {/* Partner name */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Partner name</label>
          <Input
            value={proposal.partnerName}
            maxLength={200}
            onChange={(e) => onChange({ partnerName: e.target.value })}
            placeholder="Acme Corp"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">URL slug</label>
          {isPublished && slugChanged && (
            <div className="mb-2 rounded-lg px-3 py-2 bg-yellow-50 border border-yellow-200 text-xs text-yellow-800">
              Changing the URL will break any existing links to this proposal.
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 flex-shrink-0 select-none font-mono">
              {window.location.host}/p/
            </span>
            <Input
              value={slugValue}
              maxLength={100}
              onChange={(e) => handleSlugChange(e.target.value)}
              onBlur={handleSlugBlur}
              className="font-mono text-xs flex-1"
              placeholder="partner-name-xxxx"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              className="text-xs flex-shrink-0"
            >
              Regenerate
            </Button>
          </div>
          {slugError && <p className="mt-1 text-xs text-red-500">{slugError}</p>}
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
          <div className="flex gap-3">
            {(['draft', 'published'] as const).map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={proposal.status === s}
                  onChange={() => handleStatusChange(s)}
                  className="accent-gray-900"
                />
                <span className="text-sm text-gray-700 capitalize">{s}</span>
              </label>
            ))}
          </div>
          {statusError && <p className="mt-1 text-xs text-red-500">{statusError}</p>}
        </div>

        {/* Timestamps */}
        <div className="pt-2 border-t border-gray-100 flex gap-6">
          <div>
            <p className="text-[11px] text-gray-400">Created</p>
            <p className="text-xs text-gray-600">{formatDate(proposal.createdAt)}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Last updated</p>
            <p className="text-xs text-gray-600">{formatDate(proposal.updatedAt)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
