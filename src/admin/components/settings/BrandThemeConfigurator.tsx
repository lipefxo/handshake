import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeProvider } from '@/themes/ThemeProvider';
import { themes } from '@/themes/themeDefinitions';
import type { WorkspaceBrandTheme } from '@/types/workspace';

const boldBrandDefaults = themes['bold-brand'];
const HEX_COLOR = /^#([0-9a-fA-F]{6})$/;
type PreviewSlideType =
  | 'title'
  | 'intro'
  | 'stats'
  | 'features'
  | 'testimonial'
  | 'comparison'
  | 'timeline'
  | 'media'
  | 'benefits'
  | 'closing';

const PREVIEW_SLIDES = [
  { type: 'title', title: 'Title Slide' },
  { type: 'intro', title: 'Intro Slide' },
  { type: 'stats', title: 'Stats Slide' },
  { type: 'features', title: 'Features Slide' },
  { type: 'testimonial', title: 'Testimonial Slide' },
  { type: 'comparison', title: 'Comparison Slide' },
  { type: 'timeline', title: 'Timeline Slide' },
  { type: 'media', title: 'Media Slide' },
  { type: 'benefits', title: 'Benefits Slide' },
  { type: 'closing', title: 'Closing Slide' },
] as const;

const FONT_FAMILIES = [
  { label: 'Space Grotesk', value: "'Space Grotesk', system-ui, sans-serif", importParam: 'family=Space+Grotesk:wght@400;500;600;700' },
  { label: 'Inter', value: "'Inter', system-ui, sans-serif", importParam: 'family=Inter:wght@400;500;600;700' },
  { label: 'Archivo', value: "'Archivo', system-ui, sans-serif", importParam: 'family=Archivo:wght@400;500;600;700' },
  { label: 'DM Sans', value: "'DM Sans', system-ui, sans-serif", importParam: 'family=DM+Sans:wght@400;500;600;700' },
  { label: 'Source Sans 3', value: "'Source Sans 3', system-ui, sans-serif", importParam: 'family=Source+Sans+3:wght@400;500;600;700' },
  { label: 'Fraunces', value: "'Fraunces', Georgia, serif", importParam: 'family=Fraunces:wght@400;500;600;700' },
];

const MONO_FONT_FAMILIES = [
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace", importParam: 'family=JetBrains+Mono:wght@400;500;600;700' },
  { label: 'IBM Plex Mono', value: "'IBM Plex Mono', monospace", importParam: 'family=IBM+Plex+Mono:wght@400;500;600;700' },
  { label: 'Fira Code', value: "'Fira Code', monospace", importParam: 'family=Fira+Code:wght@400;500;600;700' },
];

function buildGoogleFontsImport(displayFont?: string, bodyFont?: string, monoFont?: string): string | undefined {
  const params = new Set<string>();
  const allFonts = [...FONT_FAMILIES, ...MONO_FONT_FAMILIES];
  const displayEntry = allFonts.find((font) => font.value === displayFont);
  const bodyEntry = allFonts.find((font) => font.value === bodyFont);
  const monoEntry = allFonts.find((font) => font.value === monoFont);
  if (displayEntry?.importParam) params.add(displayEntry.importParam);
  if (bodyEntry?.importParam) params.add(bodyEntry.importParam);
  if (monoEntry?.importParam) params.add(monoEntry.importParam);
  if (params.size === 0) return undefined;
  return `https://fonts.googleapis.com/css2?${Array.from(params).join('&')}&display=swap`;
}

function resolvePreviewColor(value: string | undefined, fallback: string): string {
  return HEX_COLOR.test(value ?? '') ? value as string : fallback;
}

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return [r, g, b];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${clampChannel(r).toString(16).padStart(2, '0')}${clampChannel(g).toString(16).padStart(2, '0')}${clampChannel(b).toString(16).padStart(2, '0')}`.toUpperCase();
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(colorA: string, colorB: string): number {
  const lumA = relativeLuminance(colorA);
  const lumB = relativeLuminance(colorB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

function mixHex(colorA: string, colorB: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(colorA);
  const [r2, g2, b2] = hexToRgb(colorB);
  const t = Math.max(0, Math.min(1, amount));
  return rgbToHex([
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  ]);
}

function pickBestContrastingText(backgroundHex: string): string {
  const dark = '#0B0F14';
  const light = '#F8FAFC';
  return contrastRatio(dark, backgroundHex) >= contrastRatio(light, backgroundHex) ? dark : light;
}

function ensureContrast(foregroundHex: string, backgroundHex: string, minimumRatio: number): string {
  if (contrastRatio(foregroundHex, backgroundHex) >= minimumRatio) return foregroundHex;

  const candidates: string[] = ['#0B0F14', '#F8FAFC'];
  for (let step = 1; step <= 20; step += 1) {
    const t = step / 20;
    candidates.push(mixHex(foregroundHex, '#0B0F14', t));
    candidates.push(mixHex(foregroundHex, '#F8FAFC', t));
  }

  const passing = candidates.find((candidate) => contrastRatio(candidate, backgroundHex) >= minimumRatio);
  return passing ?? pickBestContrastingText(backgroundHex);
}

function enforceAccessibleColorSystem(themeDraft: WorkspaceBrandTheme): WorkspaceBrandTheme {
  const base = boldBrandDefaults.colors;
  const bgPrimary = resolvePreviewColor(themeDraft.colors?.bgPrimary, base.bgPrimary);
  const bgSecondary = resolvePreviewColor(themeDraft.colors?.bgSecondary, base.bgSecondary);
  const bgSurface = resolvePreviewColor(
    themeDraft.colors?.bgSurface,
    mixHex(bgPrimary, bgSecondary, 0.45),
  );
  const rawAccent = resolvePreviewColor(themeDraft.colors?.accent, base.accent);
  const rawTextPrimary = resolvePreviewColor(themeDraft.colors?.textPrimary, base.textPrimary);
  const rawTextSecondary = resolvePreviewColor(themeDraft.colors?.textSecondary, base.textSecondary);
  const rawTextTertiary = resolvePreviewColor(themeDraft.colors?.textTertiary, base.textTertiary);
  const rawBorder = resolvePreviewColor(themeDraft.colors?.border, base.border);
  const rawBorderLight = resolvePreviewColor(themeDraft.colors?.borderLight, base.borderLight);
  const gradientStart = resolvePreviewColor(themeDraft.colors?.gradientStart, base.gradientStart);
  const gradientEnd = resolvePreviewColor(themeDraft.colors?.gradientEnd, base.gradientEnd);
  const overlayBg = resolvePreviewColor(themeDraft.colors?.overlayBg, base.overlayBg);

  // Buttons use accent background + bgPrimary text in the presentation layer.
  // Keep these two colors at accessible contrast as users adjust any color input.
  const accent = ensureContrast(rawAccent, bgPrimary, 4.5);
  const textPrimary = ensureContrast(rawTextPrimary, bgPrimary, 4.5);

  // Secondary text should remain readable on both main surfaces.
  const textSecondary = ensureContrast(rawTextSecondary, bgSecondary, 4.5);
  const textTertiary = ensureContrast(rawTextTertiary, bgSurface, 3);
  const border = ensureContrast(rawBorder, bgSecondary, 1.25);
  const borderLight = ensureContrast(rawBorderLight, bgSurface, 1.1);

  return {
    ...themeDraft,
    colors: {
      ...themeDraft.colors,
      bgPrimary,
      bgSecondary,
      bgSurface,
      accent,
      accentHover: mixHex(accent, '#0B0F14', 0.12),
      accentMuted: themeDraft.colors?.accentMuted ?? `${accent}1A`,
      textPrimary,
      textSecondary,
      textTertiary,
      border,
      borderLight,
      gradientStart,
      gradientEnd,
      overlayBg,
    },
  };
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
          className="h-9 w-9 rounded-full border border-gray-200 cursor-pointer overflow-hidden bg-white"
          title={`Choose ${label.toLowerCase()}`}
        >
          <input
            type="color"
            value={colorValue}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            className="h-full w-full appearance-none border-0 bg-transparent p-0 cursor-pointer [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0"
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
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDraft(value ?? {});
      setHasChanges(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    if (!saveMessage) return;
    const timer = setTimeout(() => setSaveMessage(''), 1500);
    return () => clearTimeout(timer);
  }, [saveMessage]);

  const updateDraft = (updater: (prev: WorkspaceBrandTheme) => WorkspaceBrandTheme) => {
    setDraft((prev) => enforceAccessibleColorSystem(updater(prev)));
    setHasChanges(true);
    if (saveMessage) setSaveMessage('');
  };

  const handleSave = async () => {
    if (disabled || saving || !hasChanges) return;
    setSaving(true);
    const ok = await onSave(draft);
    setSaveMessage(ok ? 'Saved' : 'Save failed');
    if (ok) setHasChanges(false);
    setSaving(false);
  };

  const previewTheme = useMemo(() => draft, [draft]);
  const activePreviewSlide = PREVIEW_SLIDES[activeSlideIndex];
  const renderPreviewSlideBody = (slideType: PreviewSlideType) => {
    switch (slideType) {
      case 'title':
        return (
          <div className="space-y-3 text-center">
            <div className="mx-auto flex max-w-[220px] items-center justify-center gap-2 text-[10px]" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>
              <span>ACME</span>
              <span>×</span>
              <span>NORTHSTAR</span>
            </div>
            <h4 className="text-lg leading-tight" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-weight)' }}>
              Partnership proposal for Acme + Northstar
            </h4>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
              A cinematic overview of the strategic collaboration.
            </p>
          </div>
        );
      case 'intro':
        return (
          <div className="grid grid-cols-[1.5fr_1fr] gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>
                Introduction
              </p>
              <h4 className="mt-1 text-sm" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
                Why this partnership matters now
              </h4>
              <p className="mt-2 text-[11px]" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
                Aligning market timing, distribution power, and product depth.
              </p>
            </div>
            <div className="rounded-md border" style={{ borderRadius: 'var(--radius)', borderColor: 'var(--color-border)', background: 'var(--color-bg-primary)' }} />
          </div>
        );
      case 'stats':
        return (
          <div className="space-y-3">
            <p className="text-center text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>
              Performance snapshot
            </p>
            <div className="grid grid-cols-3 gap-px">
              {['42%', '3.2x', '18d'].map((value) => (
                <div key={value} className="rounded-sm border px-2 py-3 text-center" style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-bg-primary)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'features':
        return (
          <div className="space-y-2">
            <h4 className="text-sm" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
              What we are launching together
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {['Onboarding', 'Automation', 'Analytics', 'Enablement'].map((item) => (
                <div key={item} className="rounded-sm border px-2 py-2" style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}>
                  <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'testimonial':
        return (
          <div className="space-y-3 text-center">
            <p className="text-base leading-tight italic" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
              "This changed how our team closes enterprise deals."
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="h-6 w-6 rounded-full border" style={{ borderColor: 'var(--color-border)' }} />
              <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
                VP Revenue, Lighthouse Systems
              </p>
            </div>
          </div>
        );
      case 'comparison':
        return (
          <div className="space-y-2">
            <h4 className="text-sm text-center" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
              Current approach vs partnership model
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-sm border p-2" style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}>
                <p className="text-[10px] uppercase" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>Before</p>
                <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>Manual handoffs</p>
              </div>
              <div className="rounded-sm border p-2" style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-bg-primary)' }}>
                <p className="text-[10px] uppercase" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-body)' }}>After</p>
                <p className="text-[11px]" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}>Shared playbook</p>
              </div>
            </div>
          </div>
        );
      case 'timeline':
        return (
          <div className="space-y-2">
            <h4 className="text-sm text-center" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
              30-day rollout plan
            </h4>
            <div className="space-y-2">
              {['Week 1 Discovery', 'Week 2 Pilot', 'Week 3 Launch', 'Week 4 Review'].map((milestone) => (
                <div key={milestone} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-accent)' }} />
                  <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>{milestone}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'media':
        return (
          <div className="space-y-2">
            <div
              className="aspect-video w-full rounded-md border"
              style={{
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--radius)',
                background: 'linear-gradient(135deg, var(--color-bg-primary), var(--color-bg-secondary))',
              }}
            />
            <p className="text-center text-[11px]" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
              Product walkthrough and launch visuals
            </p>
          </div>
        );
      case 'benefits':
        return (
          <div className="space-y-2">
            <h4 className="text-sm text-center" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
              Value for both teams
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {['Pipeline growth', 'Smoother handoffs', 'Higher win rate', 'Stronger retention'].map((item) => (
                <div key={item} className="rounded-sm border p-2" style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}>
                  <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'closing':
        return (
          <div className="space-y-3 text-center">
            <h4 className="text-base" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
              Ready to kick off?
            </h4>
            <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
              Approve timeline and we will start implementation this week.
            </p>
            <button
              type="button"
              className="px-3 py-1 text-xs font-medium"
              style={{
                borderRadius: 'var(--radius)',
                background: 'var(--color-accent)',
                color: 'var(--color-bg-primary)',
              }}
            >
              Book kickoff
            </button>
          </div>
        );
      default:
        return null;
    }
  };

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
          onClick={() => updateDraft(() => ({}))}
        >
          Reset to defaults
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <ColorField
          label="Primary background"
          value={draft.colors?.bgPrimary}
          fallback={boldBrandDefaults.colors.bgPrimary}
          disabled={disabled}
          onChange={(next) =>
            updateDraft((prev) => ({
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
            updateDraft((prev) => ({
              ...prev,
              colors: { ...prev.colors, bgSecondary: next },
            }))
          }
        />
        <ColorField
          label="Surface background"
          value={draft.colors?.bgSurface}
          fallback={boldBrandDefaults.colors.bgSurface}
          disabled={disabled}
          onChange={(next) =>
            updateDraft((prev) => ({
              ...prev,
              colors: { ...prev.colors, bgSurface: next },
            }))
          }
        />
        <ColorField
          label="Accent color"
          value={draft.colors?.accent}
          fallback={boldBrandDefaults.colors.accent}
          disabled={disabled}
          onChange={(next) =>
            updateDraft((prev) => ({
              ...prev,
              colors: { ...prev.colors, accent: next, accentHover: next },
            }))
          }
        />
        <ColorField
          label="Accent muted"
          value={draft.colors?.accentMuted}
          fallback={boldBrandDefaults.colors.accent}
          disabled={disabled}
          onChange={(next) =>
            updateDraft((prev) => ({
              ...prev,
              colors: { ...prev.colors, accentMuted: next },
            }))
          }
        />
        <ColorField
          label="Primary text"
          value={draft.colors?.textPrimary}
          fallback={boldBrandDefaults.colors.textPrimary}
          disabled={disabled}
          onChange={(next) =>
            updateDraft((prev) => ({
              ...prev,
              colors: { ...prev.colors, textPrimary: next },
            }))
          }
        />
        <ColorField
          label="Secondary text"
          value={draft.colors?.textSecondary}
          fallback={boldBrandDefaults.colors.textSecondary}
          disabled={disabled}
          onChange={(next) =>
            updateDraft((prev) => ({
              ...prev,
              colors: { ...prev.colors, textSecondary: next },
            }))
          }
        />
        <ColorField
          label="Tertiary text"
          value={draft.colors?.textTertiary}
          fallback={boldBrandDefaults.colors.textTertiary}
          disabled={disabled}
          onChange={(next) =>
            updateDraft((prev) => ({
              ...prev,
              colors: { ...prev.colors, textTertiary: next },
            }))
          }
        />
        <ColorField
          label="Border"
          value={draft.colors?.border}
          fallback={boldBrandDefaults.colors.border}
          disabled={disabled}
          onChange={(next) =>
            updateDraft((prev) => ({
              ...prev,
              colors: { ...prev.colors, border: next },
            }))
          }
        />
        <ColorField
          label="Border light"
          value={draft.colors?.borderLight}
          fallback={boldBrandDefaults.colors.borderLight}
          disabled={disabled}
          onChange={(next) =>
            updateDraft((prev) => ({
              ...prev,
              colors: { ...prev.colors, borderLight: next },
            }))
          }
        />
        <ColorField
          label="Gradient start"
          value={draft.colors?.gradientStart}
          fallback="#06D6A0"
          disabled={disabled}
          onChange={(next) =>
            updateDraft((prev) => ({
              ...prev,
              colors: { ...prev.colors, gradientStart: next },
            }))
          }
        />
        <ColorField
          label="Gradient end"
          value={draft.colors?.gradientEnd}
          fallback="#06A3D6"
          disabled={disabled}
          onChange={(next) =>
            updateDraft((prev) => ({
              ...prev,
              colors: { ...prev.colors, gradientEnd: next },
            }))
          }
        />
        <ColorField
          label="Overlay background"
          value={draft.colors?.overlayBg}
          fallback="#0B1628"
          disabled={disabled}
          onChange={(next) =>
            updateDraft((prev) => ({
              ...prev,
              colors: { ...prev.colors, overlayBg: next },
            }))
          }
        />
      </div>
      <p className="text-[11px] text-gray-500">
        Colors auto-adjust to keep text and accent combinations accessible (WCAG contrast) as you edit.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Display font</label>
          <select
            value={draft.fonts?.display ?? boldBrandDefaults.fonts.display}
            disabled={disabled}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            onChange={(event) =>
              updateDraft((prev) => {
                const display = event.target.value;
                const body = prev.fonts?.body ?? boldBrandDefaults.fonts.body;
                const mono = prev.fonts?.mono ?? boldBrandDefaults.fonts.mono;
                return {
                  ...prev,
                  fonts: {
                    ...prev.fonts,
                    display,
                    googleFontsImport: buildGoogleFontsImport(display, body, mono),
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
              updateDraft((prev) => {
                const body = event.target.value;
                const display = prev.fonts?.display ?? boldBrandDefaults.fonts.display;
                const mono = prev.fonts?.mono ?? boldBrandDefaults.fonts.mono;
                return {
                  ...prev,
                  fonts: {
                    ...prev.fonts,
                    body,
                    googleFontsImport: buildGoogleFontsImport(display, body, mono),
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
              updateDraft((prev) => ({
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
              updateDraft((prev) => ({
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

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Mono font</label>
          <select
            value={draft.fonts?.mono ?? boldBrandDefaults.fonts.mono}
            disabled={disabled}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            onChange={(event) =>
              updateDraft((prev) => {
                const mono = event.target.value;
                const display = prev.fonts?.display ?? boldBrandDefaults.fonts.display;
                const body = prev.fonts?.body ?? boldBrandDefaults.fonts.body;
                return {
                  ...prev,
                  fonts: {
                    ...prev.fonts,
                    mono,
                    googleFontsImport: buildGoogleFontsImport(display, body, mono),
                  },
                };
              })
            }
          >
            {MONO_FONT_FAMILIES.map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
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
              updateDraft((prev) => ({
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
          <label className="text-xs font-medium text-gray-600">Decorative opacity</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={draft.style?.decorativeOpacity ?? boldBrandDefaults.style.decorativeOpacity}
              disabled={disabled}
              className="w-full"
              onChange={(event) =>
                updateDraft((prev) => ({
                  ...prev,
                  style: { ...prev.style, decorativeOpacity: Number(event.target.value) },
                }))
              }
            />
            <span className="w-10 text-right text-xs text-gray-500">
              {Number(draft.style?.decorativeOpacity ?? boldBrandDefaults.style.decorativeOpacity).toFixed(2)}
            </span>
          </div>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-medium text-gray-600">Text shadow</label>
          <Input
            value={draft.style?.textShadow ?? ''}
            placeholder={boldBrandDefaults.style.textShadow ?? 'none'}
            disabled={disabled}
            onChange={(event) => {
              const next = event.target.value.trim();
              updateDraft((prev) => ({
                ...prev,
                style: { ...prev.style, textShadow: next === '' ? undefined : next },
              }));
            }}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Live preview</p>
        <ThemeProvider themeId="bold-brand" workspaceBrandTheme={previewTheme} className="rounded-xl overflow-hidden border border-gray-200">
          <div className="aspect-video flex flex-col justify-between gap-3 p-4 sm:p-5" style={{ background: 'var(--color-bg-primary)' }}>
            <div className="flex items-center justify-between gap-2">
              <span
                className="inline-flex items-center rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {activePreviewSlide.title}
              </span>
              <span
                className="text-[10px] uppercase tracking-wide"
                style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
              >
                {activeSlideIndex + 1} / {PREVIEW_SLIDES.length}
              </span>
            </div>

            <div
              className="w-full border px-4 py-4"
              style={{
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--radius)',
                background: 'var(--color-bg-secondary)',
              }}
            >
              {renderPreviewSlideBody(activePreviewSlide.type)}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {PREVIEW_SLIDES.map((slide, index) => {
                  const isActive = index === activeSlideIndex;
                  return (
                    <button
                      key={slide.type}
                      type="button"
                      onClick={() => setActiveSlideIndex(index)}
                      className="h-2.5 w-2.5 shrink-0 rounded-full border transition-opacity"
                      style={{
                        borderColor: 'var(--color-border)',
                        background: isActive ? 'var(--color-accent)' : 'transparent',
                        opacity: isActive ? 1 : 0.6,
                      }}
                      aria-label={`Preview ${slide.title}`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setActiveSlideIndex((prev) => (prev - 1 + PREVIEW_SLIDES.length) % PREVIEW_SLIDES.length)
                  }
                  className="rounded-md border px-2 py-1 text-xs"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                    borderRadius: 'var(--radius)',
                    fontFamily: 'var(--font-body)',
                  }}
                  aria-label="Previous preview slide"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlideIndex((prev) => (prev + 1) % PREVIEW_SLIDES.length)}
                  className="rounded-md border px-2 py-1 text-xs"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                    borderRadius: 'var(--radius)',
                    fontFamily: 'var(--font-body)',
                  }}
                  aria-label="Next preview slide"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </ThemeProvider>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="min-h-4 text-xs text-gray-500">
          {saving ? 'Saving…' : saveMessage || (hasChanges ? 'Unsaved changes' : '')}
        </p>
        <Button
          type="button"
          size="sm"
          disabled={disabled || saving || !hasChanges}
          onClick={() => void handleSave()}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
