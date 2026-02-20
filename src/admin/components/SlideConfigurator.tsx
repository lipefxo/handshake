import React from 'react';
import type { SlideConfig, TitleSlideContent, IntroSlideContent, StatsSlideContent, FeaturesSlideContent, TestimonialSlideContent, ComparisonSlideContent, TimelineSlideContent, MediaSlideContent, BenefitsSlideContent, ClosingSlideContent } from '../../types/proposal';
import { ImageUploader } from './ImageUploader';
import { SLIDE_TYPE_META } from '../../data/slideDefaults';

interface SlideConfiguratorProps {
  slide: SlideConfig;
  onChange: (updates: Partial<SlideConfig>) => void;
}

const TRANSITIONS = ['fade', 'slide-up', 'slide-left', 'scale', 'blur'] as const;

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
            <button
              key={t}
              onClick={() => onChange({ transition: t })}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                slide.transition === t
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-medium'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {t}
            </button>
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

function TitleFields({ content, onChange }: { content: TitleSlideContent; onChange: (u: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <FieldGroup label="Partner Name">
        <input className="admin-input" value={content.partnerName || ''} onChange={(e) => onChange({ partnerName: e.target.value })} placeholder="e.g. Acme Corp" />
      </FieldGroup>
      <FieldGroup label="Headline">
        <input className="admin-input" value={content.headline || ''} onChange={(e) => onChange({ headline: e.target.value })} placeholder="A Strategic Partnership" />
      </FieldGroup>
      <FieldGroup label="Subheadline">
        <input className="admin-input" value={content.subheadline || ''} onChange={(e) => onChange({ subheadline: e.target.value })} placeholder="Together, we grow." />
      </FieldGroup>
      <FieldGroup label="Date">
        <input className="admin-input" value={content.date || ''} onChange={(e) => onChange({ date: e.target.value })} placeholder="January 2025" />
      </FieldGroup>
      <ImageUploader label="Partner Logo" value={content.partnerLogo} onChange={(url) => onChange({ partnerLogo: url })} />
      <ImageUploader label="SecureBags Logo" value={content.secureBagsLogo} onChange={(url) => onChange({ secureBagsLogo: url })} />
    </div>
  );
}

function IntroFields({ content, onChange }: { content: IntroSlideContent; onChange: (u: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <FieldGroup label="Heading">
        <input className="admin-input" value={content.heading || ''} onChange={(e) => onChange({ heading: e.target.value })} />
      </FieldGroup>
      <FieldGroup label="Body">
        <textarea className="admin-textarea" value={content.body || ''} onChange={(e) => onChange({ body: e.target.value })} rows={4} />
      </FieldGroup>
      <FieldGroup label="Image Position">
        <select className="admin-input" value={content.imagePosition || 'right'} onChange={(e) => onChange({ imagePosition: e.target.value })}>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </FieldGroup>
      <ImageUploader label="Image (optional)" value={content.image} onChange={(url) => onChange({ image: url })} />
    </div>
  );
}

function StatsFields({ content, onChange }: { content: StatsSlideContent; onChange: (u: Record<string, unknown>) => void }) {
  const updateStat = (index: number, field: string, value: string | number) => {
    const newStats = content.stats.map((s, i) => i === index ? { ...s, [field]: value } : s);
    onChange({ stats: newStats });
  };
  const addStat = () => {
    onChange({ stats: [...content.stats, { value: 0, label: 'New Metric' }] });
  };
  const removeStat = (index: number) => {
    onChange({ stats: content.stats.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <FieldGroup label="Section Heading">
        <input className="admin-input" value={content.heading || ''} onChange={(e) => onChange({ heading: e.target.value })} placeholder="Our Track Record" />
      </FieldGroup>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600">Stats</label>
          <button onClick={addStat} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ Add stat</button>
        </div>
        <div className="space-y-3">
          {content.stats.map((stat, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Stat {i + 1}</span>
                <button onClick={() => removeStat(i)} className="text-xs text-red-400 hover:text-red-500">Remove</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Prefix</label>
                  <input className="admin-input" value={stat.prefix || ''} onChange={(e) => updateStat(i, 'prefix', e.target.value)} placeholder="$" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Value</label>
                  <input type="number" className="admin-input" value={stat.value} onChange={(e) => updateStat(i, 'value', Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Suffix</label>
                  <input className="admin-input" value={stat.suffix || ''} onChange={(e) => updateStat(i, 'suffix', e.target.value)} placeholder="%" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Label</label>
                <input className="admin-input" value={stat.label} onChange={(e) => updateStat(i, 'label', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <input className="admin-input" value={stat.description || ''} onChange={(e) => updateStat(i, 'description', e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturesFields({ content, onChange }: { content: FeaturesSlideContent; onChange: (u: Record<string, unknown>) => void }) {
  const updateFeature = (index: number, field: string, value: string) => {
    const updated = content.features.map((f, i) => i === index ? { ...f, [field]: value } : f);
    onChange({ features: updated });
  };
  const addFeature = () => {
    onChange({ features: [...content.features, { icon: '⭐', title: 'New Feature', description: '' }] });
  };
  const removeFeature = (index: number) => {
    onChange({ features: content.features.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <FieldGroup label="Heading"><input className="admin-input" value={content.heading || ''} onChange={(e) => onChange({ heading: e.target.value })} /></FieldGroup>
      <FieldGroup label="Subheading"><input className="admin-input" value={content.subheading || ''} onChange={(e) => onChange({ subheading: e.target.value })} /></FieldGroup>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600">Features</label>
          <button onClick={addFeature} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ Add feature</button>
        </div>
        <div className="space-y-3">
          {content.features.map((feature, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Feature {i + 1}</span>
                <button onClick={() => removeFeature(i)} className="text-xs text-red-400 hover:text-red-500">Remove</button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Icon</label>
                  <input className="admin-input" value={feature.icon || ''} onChange={(e) => updateFeature(i, 'icon', e.target.value)} placeholder="🚀" />
                </div>
                <div className="col-span-3">
                  <label className="text-xs text-gray-400 mb-1 block">Title</label>
                  <input className="admin-input" value={feature.title} onChange={(e) => updateFeature(i, 'title', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <textarea className="admin-textarea" style={{ minHeight: '56px' }} value={feature.description} onChange={(e) => updateFeature(i, 'description', e.target.value)} rows={2} />
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
        <textarea className="admin-textarea" value={content.quote || ''} onChange={(e) => onChange({ quote: e.target.value })} rows={4} placeholder="This partnership transformed our business..." />
      </FieldGroup>
      <FieldGroup label="Author Name">
        <input className="admin-input" value={content.author || ''} onChange={(e) => onChange({ author: e.target.value })} />
      </FieldGroup>
      <FieldGroup label="Role">
        <input className="admin-input" value={content.role || ''} onChange={(e) => onChange({ role: e.target.value })} placeholder="CEO" />
      </FieldGroup>
      <FieldGroup label="Company">
        <input className="admin-input" value={content.company || ''} onChange={(e) => onChange({ company: e.target.value })} />
      </FieldGroup>
      <ImageUploader label="Avatar (optional)" value={content.avatar} onChange={(url) => onChange({ avatar: url })} />
    </div>
  );
}

function ComparisonFields({ content, onChange }: { content: ComparisonSlideContent; onChange: (u: Record<string, unknown>) => void }) {
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

  return (
    <div className="space-y-4">
      <FieldGroup label="Heading"><input className="admin-input" value={content.heading || ''} onChange={(e) => onChange({ heading: e.target.value })} /></FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">Before label</label>
          <input className="admin-input mb-2" value={content.before.label} onChange={(e) => onChange({ before: { ...content.before, label: e.target.value } })} />
          {content.before.items.map((item, i) => (
            <input key={i} className="admin-input mb-1.5" value={item} onChange={(e) => updateBeforeItem(i, e.target.value)} />
          ))}
          <button onClick={() => onChange({ before: { ...content.before, items: [...content.before.items, ''] } })} className="text-xs text-indigo-600 hover:text-indigo-700">+ Add item</button>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">After label</label>
          <input className="admin-input mb-2" value={content.after.label} onChange={(e) => onChange({ after: { ...content.after, label: e.target.value } })} />
          {content.after.items.map((item, i) => (
            <input key={i} className="admin-input mb-1.5" value={item} onChange={(e) => updateAfterItem(i, e.target.value)} />
          ))}
          <button onClick={() => onChange({ after: { ...content.after, items: [...content.after.items, ''] } })} className="text-xs text-indigo-600 hover:text-indigo-700">+ Add item</button>
        </div>
      </div>
    </div>
  );
}

function TimelineFields({ content, onChange }: { content: TimelineSlideContent; onChange: (u: Record<string, unknown>) => void }) {
  const updateMilestone = (index: number, field: string, value: string) => {
    const updated = content.milestones.map((m, i) => i === index ? { ...m, [field]: value } : m);
    onChange({ milestones: updated });
  };
  const addMilestone = () => {
    onChange({ milestones: [...content.milestones, { date: 'Phase X', title: 'New Milestone', description: '' }] });
  };
  const removeMilestone = (index: number) => {
    onChange({ milestones: content.milestones.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <FieldGroup label="Heading"><input className="admin-input" value={content.heading || ''} onChange={(e) => onChange({ heading: e.target.value })} /></FieldGroup>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600">Milestones</label>
          <button onClick={addMilestone} className="text-xs text-indigo-600 font-medium">+ Add</button>
        </div>
        <div className="space-y-3">
          {content.milestones.map((milestone, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-xs font-medium text-gray-500">Milestone {i + 1}</span>
                <button onClick={() => removeMilestone(i)} className="text-xs text-red-400">Remove</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-gray-400 mb-1 block">Date/Phase</label><input className="admin-input" value={milestone.date} onChange={(e) => updateMilestone(i, 'date', e.target.value)} /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Title</label><input className="admin-input" value={milestone.title} onChange={(e) => updateMilestone(i, 'title', e.target.value)} /></div>
              </div>
              <div><label className="text-xs text-gray-400 mb-1 block">Description</label><input className="admin-input" value={milestone.description || ''} onChange={(e) => updateMilestone(i, 'description', e.target.value)} /></div>
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
        <select className="admin-input" value={content.mediaType} onChange={(e) => onChange({ mediaType: e.target.value })}>
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
      />
      <FieldGroup label="Caption">
        <input className="admin-input" value={content.caption || ''} onChange={(e) => onChange({ caption: e.target.value })} placeholder="Optional caption..." />
      </FieldGroup>
      <FieldGroup label="Fit">
        <select className="admin-input" value={content.fit || 'cover'} onChange={(e) => onChange({ fit: e.target.value })}>
          <option value="cover">Cover (fill)</option>
          <option value="contain">Contain (fit)</option>
        </select>
      </FieldGroup>
    </div>
  );
}

function BenefitsFields({ content, onChange }: { content: BenefitsSlideContent; onChange: (u: Record<string, unknown>) => void }) {
  const updateBenefit = (index: number, field: string, value: string) => {
    const updated = content.benefits.map((b, i) => i === index ? { ...b, [field]: value } : b);
    onChange({ benefits: updated });
  };
  const addBenefit = () => {
    onChange({ benefits: [...content.benefits, { icon: '✨', title: 'New Benefit', description: '' }] });
  };
  const removeBenefit = (index: number) => {
    onChange({ benefits: content.benefits.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <FieldGroup label="Heading"><input className="admin-input" value={content.heading || ''} onChange={(e) => onChange({ heading: e.target.value })} /></FieldGroup>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600">Benefits</label>
          <button onClick={addBenefit} className="text-xs text-indigo-600 font-medium">+ Add benefit</button>
        </div>
        <div className="space-y-3">
          {content.benefits.map((benefit, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-xs font-medium text-gray-500">Benefit {i + 1}</span>
                <button onClick={() => removeBenefit(i)} className="text-xs text-red-400">Remove</button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div><label className="text-xs text-gray-400 mb-1 block">Icon</label><input className="admin-input" value={benefit.icon || ''} onChange={(e) => updateBenefit(i, 'icon', e.target.value)} placeholder="💎" /></div>
                <div className="col-span-3"><label className="text-xs text-gray-400 mb-1 block">Title</label><input className="admin-input" value={benefit.title} onChange={(e) => updateBenefit(i, 'title', e.target.value)} /></div>
              </div>
              <div><label className="text-xs text-gray-400 mb-1 block">Description</label><textarea className="admin-textarea" style={{ minHeight: '56px' }} value={benefit.description} onChange={(e) => updateBenefit(i, 'description', e.target.value)} rows={2} /></div>
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
      <FieldGroup label="Heading"><input className="admin-input" value={content.heading || ''} onChange={(e) => onChange({ heading: e.target.value })} /></FieldGroup>
      <FieldGroup label="Subheading"><textarea className="admin-textarea" value={content.subheading || ''} onChange={(e) => onChange({ subheading: e.target.value })} rows={2} /></FieldGroup>
      <FieldGroup label="CTA Button Text"><input className="admin-input" value={content.ctaText || ''} onChange={(e) => onChange({ ctaText: e.target.value })} placeholder="Schedule a Call" /></FieldGroup>
      <FieldGroup label="CTA URL"><input className="admin-input" value={content.ctaUrl || ''} onChange={(e) => onChange({ ctaUrl: e.target.value })} placeholder="https://calendly.com/..." /></FieldGroup>
      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-3">Contact Info</p>
        <div className="space-y-3">
          <FieldGroup label="Name"><input className="admin-input" value={content.contactName || ''} onChange={(e) => onChange({ contactName: e.target.value })} /></FieldGroup>
          <FieldGroup label="Email"><input className="admin-input" type="email" value={content.contactEmail || ''} onChange={(e) => onChange({ contactEmail: e.target.value })} /></FieldGroup>
          <FieldGroup label="Phone"><input className="admin-input" type="tel" value={content.contactPhone || ''} onChange={(e) => onChange({ contactPhone: e.target.value })} /></FieldGroup>
        </div>
      </div>
    </div>
  );
}
