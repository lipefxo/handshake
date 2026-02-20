import { useState } from 'react';
import type { Proposal, BrandOverrides } from '../../../types/proposal';
import { ThemePicker } from '../../../themes/ThemePicker';
import { ThemeProvider } from '../../../themes/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ThemeId } from '../../../themes/themeTypes';

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  const [text, setText] = useState(value);
  const [error, setError] = useState('');

  const handleTextChange = (v: string) => {
    setText(v);
    if (v === '' || HEX_REGEX.test(v)) {
      setError('');
      onChange(v);
    } else {
      setError('Must be a 6-digit hex (e.g. #FF5500)');
    }
  };

  const handleColorPicker = (v: string) => {
    setText(v);
    setError('');
    onChange(v);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={HEX_REGEX.test(text) ? text : '#000000'}
          onChange={(e) => handleColorPicker(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-gray-200 p-0.5"
        />
        <Input
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="#000000"
          className="font-mono text-xs w-32"
          maxLength={7}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function MiniPreview({ themeId, brandOverrides }: { themeId: ThemeId; brandOverrides?: BrandOverrides }) {
  return (
    <ThemeProvider themeId={themeId} brandOverrides={brandOverrides} className="w-full rounded-xl overflow-hidden border border-gray-200">
      <div
        className="w-full aspect-video flex flex-col items-center justify-center gap-3 p-6"
        style={{ background: 'var(--color-bg-primary)' }}
      >
        <div
          className="text-xs font-semibold tracking-widest uppercase opacity-60"
          style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
        >
          Preview
        </div>
        <div
          className="text-2xl font-bold text-center"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
        >
          Proposal Title
        </div>
        <div
          className="text-sm opacity-70 text-center"
          style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
        >
          Partner Name
        </div>
        <div
          className="mt-2 px-4 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-bg-primary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          View Proposal
        </div>
      </div>
    </ThemeProvider>
  );
}

interface ThemeSectionProps {
  proposal: Proposal;
  onChange: (updates: Partial<Proposal>) => void;
}

export function ThemeSection({ proposal, onChange }: ThemeSectionProps) {
  const overrides = proposal.brandOverrides ?? {};

  const handleReset = () => {
    onChange({ brandOverrides: {} });
  };

  return (
    <section id="theme" className="scroll-mt-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">Theme & Brand</h2>
        <p className="text-xs text-gray-400 mt-0.5">Choose a theme and optionally override brand colors.</p>
        <hr className="mt-3 border-gray-100" />
      </div>

      <div className="space-y-6">
        {/* Theme picker */}
        <ThemePicker
          activeThemeId={proposal.themeId}
          onChange={(themeId) => onChange({ themeId })}
        />

        {/* Brand overrides */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Brand overrides</p>
              <p className="text-xs text-gray-400 mt-0.5">Override specific colors from the theme.</p>
            </div>
            {(overrides.primaryColor || overrides.accentColor) && (
              <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="text-xs text-gray-500">
                Reset
              </Button>
            )}
          </div>

          <div className="flex gap-6 flex-wrap">
            <ColorInput
              label="Primary background"
              value={overrides.primaryColor ?? ''}
              onChange={(val) => onChange({ brandOverrides: { ...overrides, primaryColor: val || undefined } })}
            />
            <ColorInput
              label="Accent color"
              value={overrides.accentColor ?? ''}
              onChange={(val) => onChange({ brandOverrides: { ...overrides, accentColor: val || undefined } })}
            />
          </div>
        </div>

        {/* Live preview */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Live preview</p>
          <MiniPreview themeId={proposal.themeId} brandOverrides={proposal.brandOverrides} />
        </div>
      </div>
    </section>
  );
}
