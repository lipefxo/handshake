import React from 'react';
import type { SlideConfig, TitleSlideContent, IntroSlideContent, StatsSlideContent, FeaturesSlideContent, TestimonialSlideContent, ComparisonSlideContent, TimelineSlideContent, MediaSlideContent, BenefitsSlideContent, ClosingSlideContent } from '../../types/proposal';
import { ImageUploader } from './ImageUploader';
import { SLIDE_TYPE_META } from '../../data/slideDefaults';
import { AppIcon } from '../../shared/icons/AppIcon';
import type { AppIconId } from '../../shared/icons/iconRegistry';
import { FIELD_LIMITS } from '../../shared/utils/validation';
import { Button } from '@/components/ui/button';
import { Input as BaseInput } from '@/components/ui/input';
import { Textarea as BaseTextarea } from '@/components/ui/textarea';

interface SlideConfiguratorProps {
  slide: SlideConfig;
  onChange: (updates: Partial<SlideConfig>) => void;
}

const TRANSITIONS = ['fade', 'slide-up', 'slide-left', 'scale', 'blur'] as const;
type IconOption = { value: AppIconId; label: string };

const FEATURE_ICON_OPTIONS: IconOption[] = [
  { value: 'slide.features.default', label: 'Default' },
  { value: 'slide.features.protection', label: 'Protection' },
  { value: 'slide.features.branding', label: 'Branding' },
  { value: 'slide.features.speed', label: 'Speed' },
  { value: 'slide.features.sustainability', label: 'Sustainability' },
];
const BENEFIT_ICON_OPTIONS: IconOption[] = [
  { value: 'slide.benefits.default', label: 'Default' },
  { value: 'slide.benefits.account-manager', label: 'Account Manager' },
  { value: 'slide.benefits.priority-production', label: 'Priority Production' },
  { value: 'slide.benefits.volume-pricing', label: 'Volume Pricing' },
  { value: 'slide.benefits.performance-reports', label: 'Performance Reports' },
];

const MOCK_STATS = [
  { value: 24, suffix: '%', label: 'Faster Fulfillment', description: 'After launch quarter' },
  { value: 3, suffix: 'x', label: 'Higher Engagement', description: 'On campaign assets' },
  { value: 99.9, suffix: '%', label: 'On-time Delivery', description: 'Across all regions' },
];

const MOCK_FEATURES = [
  { icon: 'slide.features.default' as AppIconId, title: 'Workflow Automation', description: 'Automate repetitive steps and reduce manual follow-up for every campaign.' },
  { icon: 'slide.features.default' as AppIconId, title: 'Live Collaboration', description: 'Keep your team aligned with shared updates and quick in-context feedback.' },
  { icon: 'slide.features.default' as AppIconId, title: 'Performance Insights', description: 'Track outcomes in real time with clear reporting and trend visibility.' },
];

const MOCK_BENEFITS = [
  { icon: 'slide.benefits.default' as AppIconId, title: 'Faster Time to Value', description: 'Launch sooner with a guided rollout and proven implementation playbooks.' },
  { icon: 'slide.benefits.default' as AppIconId, title: 'Reduced Operational Risk', description: 'Standardized processes and QA checks keep launches predictable and stable.' },
  { icon: 'slide.benefits.default' as AppIconId, title: 'Scalable Foundation', description: 'Build once and reuse across teams, markets, and future campaign cycles.' },
];

const MOCK_TIMELINE_MILESTONES = [
  { date: 'Phase 4', title: 'Pilot Expansion', description: 'Extend to a second region and validate operational readiness.' },
  { date: 'Phase 5', title: 'Team Enablement', description: 'Run training sessions and publish rollout documentation.' },
  { date: 'Phase 6', title: 'Optimization Sprint', description: 'Analyze results and prioritize improvements for the next cycle.' },
];

const MOCK_BEFORE_ITEMS = ['Disconnected tools', 'Manual reporting', 'Slow decision cycles'];
const MOCK_AFTER_ITEMS = ['Single source of truth', 'Automated insights', 'Faster execution'];

function getMockItem<T>(items: T[], index: number): T {
  return items[index % items.length];
}

const selectClassName = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50';

function Input({
  maxLength,
  type,
  ...props
}: React.ComponentProps<typeof BaseInput>) {
  const defaultMaxLength = type === 'email' || type === 'tel'
    ? FIELD_LIMITS.contactField
    : FIELD_LIMITS.slideHeading;
  return (
    <BaseInput
      type={type}
      maxLength={type === 'number' ? undefined : (maxLength ?? defaultMaxLength)}
      {...props}
    />
  );
}

function Textarea({
  maxLength = FIELD_LIMITS.slideBody,
  ...props
}: React.ComponentProps<typeof BaseTextarea>) {
  return <BaseTextarea maxLength={maxLength} {...props} />;
}

export function SlideConfigurator({ slide, onChange }: SlideConfiguratorProps) {
  const updateContent = (updates: Record<string, unknown>) => {
    onChange({ content: { ...slide.content, ...updates } });
  };

  const meta = SLIDE_TYPE_META[slide.type];

  return (
    <div className="space-y-6">
      {/* Slide header */}
      <div className="pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{meta.label}</h3>
          <p className="text-xs text-gray-400">{meta.description}</p>
        </div>
      </div>

      {/* Transition selector */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Transition</label>
        <div className="flex gap-2 flex-wrap">
          {TRANSITIONS.map((t) => (
            <Button
              key={t}
              type="button"
              onClick={() => onChange({ transition: t })}
              variant={slide.transition === t ? 'secondary' : 'outline'}
              size="sm"
              className={`h-8 rounded-lg text-xs capitalize ${
                slide.transition === t
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'text-gray-600'
              }`}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      {/* Type-specific fields */}
      {slide.type === 'title' && <TitleFields content={slide.content as TitleSlideContent} onChange={updateContent} />}
      {slide.type === 'intro' && <IntroFields content={slide.content as IntroSlideContent} onChange={updateContent} />}
      {slide.type === 'stats' && <StatsFields content={slide.content as StatsSlideContent} onChange={updateContent} />}
      {slide.type === 'features' && <FeaturesFields content={slide.content as FeaturesSlideContent} onChange={updateContent} />}
      {slide.type === 'testimonial' && <TestimonialFields content={slide.content as TestimonialSlideContent} onChange={updateContent} />}
      {slide.type === 'comparison' && <ComparisonFields content={slide.content as ComparisonSlideContent} onChange={updateContent} />}
      {slide.type === 'timeline' && <TimelineFields content={slide.content as TimelineSlideContent} onChange={updateContent} />}
      {slide.type === 'media' && <MediaFields content={slide.content as MediaSlideContent} onChange={updateContent} />}
      {slide.type === 'benefits' && <BenefitsFields content={slide.content as BenefitsSlideContent} onChange={updateContent} />}
      {slide.type === 'closing' && <ClosingFields content={slide.content as ClosingSlideContent} onChange={updateContent} />}
    </div>
  );
}

// --- Field components ---

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ItemCounter({ count, max, label = 'items' }: { count: number; max: number; label?: string }) {
  const atLimit = count >= max;
  return (
    <span className={`text-[11px] ${atLimit ? 'text-amber-600' : 'text-gray-400'}`}>
      {count} / {max} {label}
    </span>
  );
}

function CharCounter({ value, max }: { value: string; max: number }) {
  const atLimit = value.length >= max;
  return (
    <p className={`mt-1 text-[11px] text-right ${atLimit ? 'text-amber-600' : 'text-gray-400'}`}>
      {value.length} / {max}
    </p>
  );
}

function IconSelect({
  options,
  value,
  onChange,
}: {
  options: IconOption[];
  value: AppIconId;
  onChange: (next: AppIconId) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const activeOption = options.find((option) => option.value === value) ?? options[0];

  React.useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        className="h-9 w-9 rounded-md border border-gray-200 bg-white text-gray-700 hover:border-gray-300 transition-colors duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
        onClick={() => setIsOpen((prev) => !prev)}
        title={activeOption.label}
        aria-label={`Icon: ${activeOption.label}`}
        aria-expanded={isOpen}
      >
        <AppIcon icon={value} size={16} />
      </button>
      <button
        type="button"
        className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full border border-gray-200 bg-white text-gray-500 flex items-center justify-center"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-hidden
        tabIndex={-1}
      >
        <AppIcon icon="ui.chevron-down" size={10} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-11 z-20 min-w-44 rounded-md border border-gray-200 bg-white p-1 shadow-lg">
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full rounded-md px-2 py-1.5 text-left text-xs flex items-center gap-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1 ${
                  selected
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <AppIcon icon={option.value} size={14} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TitleFields({ content, onChange }: { content: TitleSlideContent; onChange: (u: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <FieldGroup label="Headline">
        <Input value={content.headline || ''} onChange={(e) => onChange({ headline: e.target.value })} placeholder="A Strategic Partnership" />
      </FieldGroup>
      <FieldGroup label="Subheadline">
        <Input value={content.subheadline || ''} onChange={(e) => onChange({ subheadline: e.target.value })} placeholder="Together, we grow." />
      </FieldGroup>
      <FieldGroup label="Date">
        <Input value={content.date || ''} onChange={(e) => onChange({ date: e.target.value })} placeholder="January 2025" />
      </FieldGroup>
      <ImageUploader label="Partner Logo" value={content.partnerLogo} onChange={(url) => onChange({ partnerLogo: url })} context="logo" />
      <ImageUploader label="SecureBags Logo" value={content.secureBagsLogo} onChange={(url) => onChange({ secureBagsLogo: url })} context="logo" />
    </div>
  );
}

function IntroFields({ content, onChange }: { content: IntroSlideContent; onChange: (u: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <FieldGroup label="Heading">
        <Input value={content.heading || ''} onChange={(e) => onChange({ heading: e.target.value })} />
      </FieldGroup>
      <FieldGroup label="Body">
        <div>
          <Textarea
            value={content.body || ''}
            onChange={(e) => onChange({ body: e.target.value })}
            rows={4}
            maxLength={FIELD_LIMITS.introBody}
          />
          <CharCounter value={content.body || ''} max={FIELD_LIMITS.introBody} />
        </div>
      </FieldGroup>
      <FieldGroup label="Image Position">
        <select className={selectClassName} value={content.imagePosition || 'right'} onChange={(e) => onChange({ imagePosition: e.target.value })}>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </FieldGroup>
      <ImageUploader label="Image (optional)" value={content.image} onChange={(url) => onChange({ image: url })} context="slide-image" />
    </div>
  );
}

function StatsFields({ content, onChange }: { content: StatsSlideContent; onChange: (u: Record<string, unknown>) => void }) {
  const atMaxStats = content.stats.length >= FIELD_LIMITS.maxStats;

  const updateStat = (index: number, field: string, value: string | number) => {
    const newStats = content.stats.map((s, i) => i === index ? { ...s, [field]: value } : s);
    onChange({ stats: newStats });
  };
  const addStat = () => {
    if (atMaxStats) return;
    onChange({ stats: [...content.stats, getMockItem(MOCK_STATS, content.stats.length)] });
  };
  const removeStat = (index: number) => {
    onChange({ stats: content.stats.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <FieldGroup label="Section Heading">
        <Input value={content.heading || ''} onChange={(e) => onChange({ heading: e.target.value })} placeholder="Our Track Record" />
      </FieldGroup>
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Stats</label>
            <ItemCounter count={content.stats.length} max={FIELD_LIMITS.maxStats} />
          </div>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={addStat}
            disabled={atMaxStats}
            title={atMaxStats ? `Limit reached (${FIELD_LIMITS.maxStats})` : undefined}
            className="h-auto p-0 text-xs text-indigo-600"
          >
            + Add stat
          </Button>
        </div>
        <div className="space-y-3">
          {content.stats.map((stat, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Stat {i + 1}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeStat(i)} className="h-auto px-1 py-0 text-xs text-red-500 hover:text-red-600">Remove</Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Prefix</label>
                  <Input value={stat.prefix || ''} onChange={(e) => updateStat(i, 'prefix', e.target.value)} placeholder="$" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Value</label>
                  <Input type="number" value={stat.value} onChange={(e) => updateStat(i, 'value', Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Suffix</label>
                  <Input value={stat.suffix || ''} onChange={(e) => updateStat(i, 'suffix', e.target.value)} placeholder="%" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Label</label>
                <Input value={stat.label} onChange={(e) => updateStat(i, 'label', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <Input value={stat.description || ''} onChange={(e) => updateStat(i, 'description', e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturesFields({ content, onChange }: { content: FeaturesSlideContent; onChange: (u: Record<string, unknown>) => void }) {
  const atMaxFeatures = content.features.length >= FIELD_LIMITS.maxFeatures;

  const updateFeature = (index: number, field: 'icon' | 'title' | 'description', value: string | AppIconId) => {
    const updated = content.features.map((f, i) => i === index ? { ...f, [field]: value } : f);
    onChange({ features: updated });
  };
  const addFeature = () => {
    if (atMaxFeatures) return;
    onChange({ features: [...content.features, getMockItem(MOCK_FEATURES, content.features.length)] });
  };
  const removeFeature = (index: number) => {
    onChange({ features: content.features.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <FieldGroup label="Heading"><Input value={content.heading || ''} onChange={(e) => onChange({ heading: e.target.value })} /></FieldGroup>
      <FieldGroup label="Subheading"><Input value={content.subheading || ''} onChange={(e) => onChange({ subheading: e.target.value })} /></FieldGroup>
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Features</label>
            <ItemCounter count={content.features.length} max={FIELD_LIMITS.maxFeatures} />
          </div>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={addFeature}
            disabled={atMaxFeatures}
            title={atMaxFeatures ? `Limit reached (${FIELD_LIMITS.maxFeatures})` : undefined}
            className="h-auto p-0 text-xs text-indigo-600"
          >
            + Add feature
          </Button>
        </div>
        <div className="space-y-3">
          {content.features.map((feature, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Feature {i + 1}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeFeature(i)} className="h-auto px-1 py-0 text-xs text-red-500 hover:text-red-600">Remove</Button>
              </div>
              <div className="grid grid-cols-4 gap-2 items-start">
                <div className="space-y-1.5 col-span-1">
                  <label className="text-xs text-gray-400 block">Icon</label>
                  <IconSelect
                    options={FEATURE_ICON_OPTIONS}
                    value={feature.icon || 'slide.features.default'}
                    onChange={(next) => updateFeature(i, 'icon', next)}
                  />
                </div>
                <div className="space-y-1.5 col-span-3">
                  <label className="text-xs text-gray-400 block">Title</label>
                  <Input value={feature.title} onChange={(e) => updateFeature(i, 'title', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <Textarea style={{ minHeight: '56px' }} value={feature.description} onChange={(e) => updateFeature(i, 'description', e.target.value)} rows={2} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialFields({ content, onChange }: { content: TestimonialSlideContent; onChange: (u: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <FieldGroup label="Quote">
        <div>
          <Textarea
            value={content.quote || ''}
            onChange={(e) => onChange({ quote: e.target.value })}
            rows={4}
            placeholder="This partnership transformed our business..."
            maxLength={FIELD_LIMITS.testimonialQuote}
          />
          <CharCounter value={content.quote || ''} max={FIELD_LIMITS.testimonialQuote} />
        </div>
      </FieldGroup>
      <FieldGroup label="Author Name">
        <Input value={content.author || ''} onChange={(e) => onChange({ author: e.target.value })} />
      </FieldGroup>
      <FieldGroup label="Role">
        <Input value={content.role || ''} onChange={(e) => onChange({ role: e.target.value })} placeholder="CEO" />
      </FieldGroup>
      <FieldGroup label="Company">
        <Input value={content.company || ''} onChange={(e) => onChange({ company: e.target.value })} />
      </FieldGroup>
      <ImageUploader label="Avatar (optional)" value={content.avatar} onChange={(url) => onChange({ avatar: url })} context="avatar" />
    </div>
  );
}

function ComparisonFields({ content, onChange }: { content: ComparisonSlideContent; onChange: (u: Record<string, unknown>) => void }) {
  const atMaxBeforeItems = content.before.items.length >= FIELD_LIMITS.maxComparisonItems;
  const atMaxAfterItems = content.after.items.length >= FIELD_LIMITS.maxComparisonItems;

  const updateBeforeItem = (index: number, value: string) => {
    const items = [...content.before.items];
    items[index] = value;
    onChange({ before: { ...content.before, items } });
  };
  const updateAfterItem = (index: number, value: string) => {
    const items = [...content.after.items];
    items[index] = value;
    onChange({ after: { ...content.after, items } });
  };
  const removeBeforeItem = (index: number) => {
    onChange({ before: { ...content.before, items: content.before.items.filter((_, i) => i !== index) } });
  };
  const removeAfterItem = (index: number) => {
    onChange({ after: { ...content.after, items: content.after.items.filter((_, i) => i !== index) } });
  };

  return (
    <div className="space-y-4">
      <FieldGroup label="Heading"><Input value={content.heading || ''} onChange={(e) => onChange({ heading: e.target.value })} /></FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-600">Before label</label>
            <ItemCounter count={content.before.items.length} max={FIELD_LIMITS.maxComparisonItems} />
          </div>
          <Input className="mb-2" value={content.before.label} onChange={(e) => onChange({ before: { ...content.before, label: e.target.value } })} />
          {content.before.items.map((item, i) => (
            <div key={i} className="mb-1.5 flex items-center gap-1.5">
              <Input value={item} onChange={(e) => updateBeforeItem(i, e.target.value)} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeBeforeItem(i)}
                className="h-9 px-2 text-xs text-red-500 hover:text-red-600"
                aria-label={`Remove before item ${i + 1}`}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => {
              if (atMaxBeforeItems) return;
              onChange({ before: { ...content.before, items: [...content.before.items, getMockItem(MOCK_BEFORE_ITEMS, content.before.items.length)] } });
            }}
            disabled={atMaxBeforeItems}
            title={atMaxBeforeItems ? `Limit reached (${FIELD_LIMITS.maxComparisonItems})` : undefined}
            className="h-auto p-0 text-xs text-indigo-600"
          >
            + Add item
          </Button>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-600">After label</label>
            <ItemCounter count={content.after.items.length} max={FIELD_LIMITS.maxComparisonItems} />
          </div>
          <Input className="mb-2" value={content.after.label} onChange={(e) => onChange({ after: { ...content.after, label: e.target.value } })} />
          {content.after.items.map((item, i) => (
            <div key={i} className="mb-1.5 flex items-center gap-1.5">
              <Input value={item} onChange={(e) => updateAfterItem(i, e.target.value)} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAfterItem(i)}
                className="h-9 px-2 text-xs text-red-500 hover:text-red-600"
                aria-label={`Remove after item ${i + 1}`}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => {
              if (atMaxAfterItems) return;
              onChange({ after: { ...content.after, items: [...content.after.items, getMockItem(MOCK_AFTER_ITEMS, content.after.items.length)] } });
            }}
            disabled={atMaxAfterItems}
            title={atMaxAfterItems ? `Limit reached (${FIELD_LIMITS.maxComparisonItems})` : undefined}
            className="h-auto p-0 text-xs text-indigo-600"
          >
            + Add item
          </Button>
        </div>
      </div>
    </div>
  );
}

function TimelineFields({ content, onChange }: { content: TimelineSlideContent; onChange: (u: Record<string, unknown>) => void }) {
  const atMaxMilestones = content.milestones.length >= FIELD_LIMITS.maxMilestones;

  const updateMilestone = (index: number, field: string, value: string) => {
    const updated = content.milestones.map((m, i) => i === index ? { ...m, [field]: value } : m);
    onChange({ milestones: updated });
  };
  const addMilestone = () => {
    if (atMaxMilestones) return;
    onChange({ milestones: [...content.milestones, getMockItem(MOCK_TIMELINE_MILESTONES, content.milestones.length)] });
  };
  const removeMilestone = (index: number) => {
    onChange({ milestones: content.milestones.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <FieldGroup label="Heading"><Input value={content.heading || ''} onChange={(e) => onChange({ heading: e.target.value })} /></FieldGroup>
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Milestones</label>
            <ItemCounter count={content.milestones.length} max={FIELD_LIMITS.maxMilestones} />
          </div>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={addMilestone}
            disabled={atMaxMilestones}
            title={atMaxMilestones ? `Limit reached (${FIELD_LIMITS.maxMilestones})` : undefined}
            className="h-auto p-0 text-xs text-indigo-600"
          >
            + Add
          </Button>
        </div>
        <div className="space-y-3">
          {content.milestones.map((milestone, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-xs font-medium text-gray-500">Milestone {i + 1}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeMilestone(i)} className="h-auto px-1 py-0 text-xs text-red-500 hover:text-red-600">Remove</Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-gray-400 mb-1 block">Date/Phase</label><Input value={milestone.date} onChange={(e) => updateMilestone(i, 'date', e.target.value)} /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Title</label><Input value={milestone.title} onChange={(e) => updateMilestone(i, 'title', e.target.value)} /></div>
              </div>
              <div><label className="text-xs text-gray-400 mb-1 block">Description</label><Input value={milestone.description || ''} onChange={(e) => updateMilestone(i, 'description', e.target.value)} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MediaFields({ content, onChange }: { content: MediaSlideContent; onChange: (u: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <FieldGroup label="Media Type">
        <select className={selectClassName} value={content.mediaType} onChange={(e) => onChange({ mediaType: e.target.value })}>
          <option value="image">Image</option>
          <option value="gif">GIF</option>
          <option value="video">Video</option>
        </select>
      </FieldGroup>
      <ImageUploader
        label={content.mediaType === 'video' ? 'Video URL' : 'Media File'}
        value={content.url}
        onChange={(url) => onChange({ url })}
        accept={content.mediaType === 'video' ? 'video/*' : 'image/*'}
        context="media"
      />
      <FieldGroup label="Caption">
        <Input value={content.caption || ''} onChange={(e) => onChange({ caption: e.target.value })} placeholder="Optional caption..." />
      </FieldGroup>
      <FieldGroup label="Fit">
        <select className={selectClassName} value={content.fit || 'cover'} onChange={(e) => onChange({ fit: e.target.value })}>
          <option value="cover">Cover (fill)</option>
          <option value="contain">Contain (fit)</option>
        </select>
      </FieldGroup>
    </div>
  );
}

function BenefitsFields({ content, onChange }: { content: BenefitsSlideContent; onChange: (u: Record<string, unknown>) => void }) {
  const atMaxBenefits = content.benefits.length >= FIELD_LIMITS.maxBenefits;

  const updateBenefit = (index: number, field: 'icon' | 'title' | 'description', value: string | AppIconId) => {
    const updated = content.benefits.map((b, i) => i === index ? { ...b, [field]: value } : b);
    onChange({ benefits: updated });
  };
  const addBenefit = () => {
    if (atMaxBenefits) return;
    onChange({ benefits: [...content.benefits, getMockItem(MOCK_BENEFITS, content.benefits.length)] });
  };
  const removeBenefit = (index: number) => {
    onChange({ benefits: content.benefits.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <FieldGroup label="Heading"><Input value={content.heading || ''} onChange={(e) => onChange({ heading: e.target.value })} /></FieldGroup>
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Benefits</label>
            <ItemCounter count={content.benefits.length} max={FIELD_LIMITS.maxBenefits} />
          </div>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={addBenefit}
            disabled={atMaxBenefits}
            title={atMaxBenefits ? `Limit reached (${FIELD_LIMITS.maxBenefits})` : undefined}
            className="h-auto p-0 text-xs text-indigo-600"
          >
            + Add benefit
          </Button>
        </div>
        <div className="space-y-3">
          {content.benefits.map((benefit, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-xs font-medium text-gray-500">Benefit {i + 1}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeBenefit(i)} className="h-auto px-1 py-0 text-xs text-red-500 hover:text-red-600">Remove</Button>
              </div>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 items-start">
                <div className="space-y-1 w-fit">
                  <label className="text-xs text-gray-400 block">Icon</label>
                  <IconSelect
                    options={BENEFIT_ICON_OPTIONS}
                    value={benefit.icon || 'slide.benefits.default'}
                    onChange={(next) => updateBenefit(i, 'icon', next)}
                  />
                </div>
                <div><label className="text-xs text-gray-400 mb-1 block">Title</label><Input value={benefit.title} onChange={(e) => updateBenefit(i, 'title', e.target.value)} /></div>
              </div>
              <div><label className="text-xs text-gray-400 mb-1 block">Description</label><Textarea style={{ minHeight: '56px' }} value={benefit.description} onChange={(e) => updateBenefit(i, 'description', e.target.value)} rows={2} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClosingFields({ content, onChange }: { content: ClosingSlideContent; onChange: (u: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <FieldGroup label="Heading"><Input value={content.heading || ''} onChange={(e) => onChange({ heading: e.target.value })} /></FieldGroup>
      <FieldGroup label="Subheading">
        <div>
          <Textarea
            value={content.subheading || ''}
            onChange={(e) => onChange({ subheading: e.target.value })}
            rows={2}
            maxLength={FIELD_LIMITS.closingSubheading}
          />
          <CharCounter value={content.subheading || ''} max={FIELD_LIMITS.closingSubheading} />
        </div>
      </FieldGroup>
      <FieldGroup label="CTA Button Text"><Input value={content.ctaText || ''} onChange={(e) => onChange({ ctaText: e.target.value })} placeholder="Schedule a Call" /></FieldGroup>
      <FieldGroup label="CTA URL"><Input maxLength={FIELD_LIMITS.url} value={content.ctaUrl || ''} onChange={(e) => onChange({ ctaUrl: e.target.value })} placeholder="https://calendly.com/..." /></FieldGroup>
      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-3">Contact Info</p>
        <div className="space-y-3">
          <FieldGroup label="Name"><Input value={content.contactName || ''} onChange={(e) => onChange({ contactName: e.target.value })} /></FieldGroup>
          <FieldGroup label="Email"><Input type="email" value={content.contactEmail || ''} onChange={(e) => onChange({ contactEmail: e.target.value })} /></FieldGroup>
          <FieldGroup label="Phone"><Input type="tel" value={content.contactPhone || ''} onChange={(e) => onChange({ contactPhone: e.target.value })} /></FieldGroup>
        </div>
      </div>
    </div>
  );
}
