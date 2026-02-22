import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeProvider } from '@/themes/ThemeProvider';
import { themes } from '@/themes/themeDefinitions';
import type { ThemeSlideTransition } from '@/themes/themeTypes';
import type { WorkspaceBrandTheme } from '@/types/workspace';

const boldBrandDefaults = themes['bold-brand'];
const HEX_COLOR = /^#([0-9a-fA-F]{6})$/;

const FONT_FAMILIES = [
  { label: 'Space Grotesk', value: "'Space Grotesk', system-ui, sans-serif", importParam: 'family=Space+Grotesk:wght@400;500;600;700' },
  { label: 'Inter', value: "'Inter', system-ui, sans-serif", importParam: 'family=Inter:wght@400;500;600;700' },
  { label: 'DM Sans', value: "'DM Sans', system-ui, sans-serif", importParam: 'family=DM+Sans:wght@400;500;600;700' },
  { label: 'Source Sans 3', value: "'Source Sans 3', system-ui, sans-serif", importParam: 'family=Source+Sans+3:wght@400;500;600;700' },
  { label: 'Fraunces', value: "'Fraunces', Georgia, serif", importParam: 'family=Fraunces:wght@400;500;600;700' },
];

const TRANSITIONS: ThemeSlideTransition[] = ['fade', 'slide-up', 'slide-left', 'scale', 'blur'];

function buildGoogleFontsImport(displayFont?: string, bodyFont?: string): string | undefined {
  const params = new Set<string>();
  const displayEntry = FONT_FAMILIES.find((font) => font.value === displayFont);
  const bodyEntry = FONT_FAMILIES.find((font) => font.value === bodyFont);
  if (displayEntry?.importParam) params.add(displayEntry.importParam);
  if (bodyEntry?.importParam) params.add(bodyEntry.importParam);
  if (params.size === 0) return undefined;
  return `https://fonts.googleapis.com/css2?${Array.from(params).join('&')}&display=swap`;
}

function resolvePreviewColor(value: string | undefined, fallback: string): string {
  return HEX_COLOR.test(value ?? '') ? value as string : fallback;
}

function ColorField({
  label,
  value,
  fallback,
  disabled,
  onChange,
}: {
  label: string;
  value?: string;
  fallback: string;
  disabled?: boolean;
  onChange: (value: string | undefined) => void;
}) {
  const colorValue = resolvePreviewColor(value, fallback);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <div className="flex items-center gap-2">
        <label
          className="h-9 w-10 rounded-md border border-gray-200 cursor-pointer overflow-hidden bg-white"
          title={`Choose ${label.toLowerCase()}`}
        >
          <input
            type="color"
            value={colorValue}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            className="h-full w-full border-0 p-0 cursor-pointer bg-transparent"
          />
        </label>
        <Input
          value={value ?? ''}
          placeholder={fallback}
          disabled={disabled}
          onChange={(event) => {
            const next = event.target.value.trim();
            onChange(next === '' ? undefined : next);
          }}
        />
      </div>
    </div>
  );
}

export function BrandThemeConfigurator({
  value,
  onSave,
  disabled = false,
}: {
  value?: WorkspaceBrandTheme;
  onSave: (brandTheme: WorkspaceBrandTheme) => Promise<boolean>;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState<WorkspaceBrandTheme>(value ?? {});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  useEffect(() => {
    if (disabled) return;
    const timer = setTimeout(() => {
      setSaving(true);
      void onSave(draft)
        .then((ok) => setSaveMessage(ok ? 'Saved' : 'Save failed'))
        .finally(() => setSaving(false));
    }, 700);
    return () => clearTimeout(timer);
  }, [draft, disabled, onSave]);

  useEffect(() => {
    if (!saveMessage) return;
    const timer = setTimeout(() => setSaveMessage(''), 1500);
    return () => clearTimeout(timer);
  }, [saveMessage]);

  const previewTheme = useMemo(() => draft, [draft]);

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Brand theme</h3>
          <p className="text-xs text-gray-500 mt-1">
            Customize only the <span className="font-medium text-gray-700">Bold Brand</span> theme for this workspace.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || saving}
          onClick={() => setDraft({})}
        >
          Reset to defaults
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ColorField
          label="Primary background"
          value={draft.colors?.bgPrimary}
          fallback={boldBrandDefaults.colors.bgPrimary}
          disabled={disabled}
          onChange={(next) =>
            setDraft((prev) => ({
              ...prev,
              colors: { ...prev.colors, bgPrimary: next },
            }))
          }
        />
        <ColorField
          label="Secondary background"
          value={draft.colors?.bgSecondary}
          fallback={boldBrandDefaults.colors.bgSecondary}
          disabled={disabled}
          onChange={(next) =>
            setDraft((prev) => ({
              ...prev,
              colors: { ...prev.colors, bgSecondary: next },
            }))
          }
        />
        <ColorField
          label="Accent color"
          value={draft.colors?.accent}
          fallback={boldBrandDefaults.colors.accent}
          disabled={disabled}
          onChange={(next) =>
            setDraft((prev) => ({
              ...prev,
              colors: { ...prev.colors, accent: next, accentHover: next },
            }))
          }
        />
        <ColorField
          label="Primary text"
          value={draft.colors?.textPrimary}
          fallback={boldBrandDefaults.colors.textPrimary}
          disabled={disabled}
          onChange={(next) =>
            setDraft((prev) => ({
              ...prev,
              colors: { ...prev.colors, textPrimary: next },
            }))
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Display font</label>
          <select
            value={draft.fonts?.display ?? boldBrandDefaults.fonts.display}
            disabled={disabled}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            onChange={(event) =>
              setDraft((prev) => {
                const display = event.target.value;
                const body = prev.fonts?.body ?? boldBrandDefaults.fonts.body;
                return {
                  ...prev,
                  fonts: {
                    ...prev.fonts,
                    display,
                    googleFontsImport: buildGoogleFontsImport(display, body),
                  },
                };
              })
            }
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Body font</label>
          <select
            value={draft.fonts?.body ?? boldBrandDefaults.fonts.body}
            disabled={disabled}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            onChange={(event) =>
              setDraft((prev) => {
                const body = event.target.value;
                const display = prev.fonts?.display ?? boldBrandDefaults.fonts.display;
                return {
                  ...prev,
                  fonts: {
                    ...prev.fonts,
                    body,
                    googleFontsImport: buildGoogleFontsImport(display, body),
                  },
                };
              })
            }
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Display weight</label>
          <select
            value={String(draft.fonts?.displayWeight ?? boldBrandDefaults.fonts.displayWeight)}
            disabled={disabled}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                fonts: { ...prev.fonts, displayWeight: Number(event.target.value) },
              }))
            }
          >
            {[400, 500, 600, 700].map((weight) => (
              <option key={weight} value={weight}>{weight}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Body weight</label>
          <select
            value={String(draft.fonts?.bodyWeight ?? boldBrandDefaults.fonts.bodyWeight)}
            disabled={disabled}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                fonts: { ...prev.fonts, bodyWeight: Number(event.target.value) },
              }))
            }
          >
            {[400, 500, 600].map((weight) => (
              <option key={weight} value={weight}>{weight}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Border radius</label>
          <select
            value={draft.style?.borderRadius ?? boldBrandDefaults.style.borderRadius}
            disabled={disabled}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                style: { ...prev.style, borderRadius: event.target.value },
              }))
            }
          >
            {['4px', '6px', '8px', '12px', '16px'].map((radius) => (
              <option key={radius} value={radius}>{radius}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Default slide transition</label>
          <select
            value={draft.style?.slideTransitionDefault ?? boldBrandDefaults.style.slideTransitionDefault}
            disabled={disabled}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                style: {
                  ...prev.style,
                  slideTransitionDefault: event.target.value as ThemeSlideTransition,
                },
              }))
            }
          >
            {TRANSITIONS.map((transition) => (
              <option key={transition} value={transition}>{transition}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Live preview</p>
        <ThemeProvider themeId="bold-brand" workspaceBrandTheme={previewTheme} className="rounded-xl overflow-hidden border border-gray-200">
          <div className="aspect-video flex flex-col items-center justify-center gap-2 px-4" style={{ background: 'var(--color-bg-primary)' }}>
            <p className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
              Brand Theme
            </p>
            <h4 className="text-xl text-center" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
              Workspace Preview
            </h4>
            <div className="mt-1 rounded-full px-3 py-1 text-xs font-medium" style={{ background: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}>
              Call to action
            </div>
          </div>
        </ThemeProvider>
      </div>

      <p className="text-xs text-gray-500 min-h-4">{saving ? 'Saving…' : saveMessage}</p>
    </div>
  );
}
