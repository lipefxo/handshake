import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ThemePicker } from '../../themes/ThemePicker';
import { defaultThemeId } from '../../themes/themeDefinitions';
import type { ThemeId } from '../../themes/themeTypes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppIcon } from '../../shared/icons/AppIcon';
import { PROPOSAL_TEMPLATES, type ProposalTemplate } from '../../data/proposalTemplates';
import { useCustomTemplateStore, customTemplateToProposalTemplate } from '../../store/customTemplateStore';

export interface NewProposalFormValues {
  title: string;
  partnerName: string;
  proposalDate: string;
  themeId: ThemeId;
  templateId: string | null;
}

interface NewProposalDialogProps {
  isOpen: boolean;
  isCreating: boolean;
  createError: string | null;
  onClose: () => void;
  onCreate: (values: NewProposalFormValues) => Promise<void>;
  onCreateFromMarkdown?: () => void;
}

function getTodayDateValue(): string {
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

function getInitialFormValues(): NewProposalFormValues {
  return {
    title: '',
    partnerName: '',
    proposalDate: getTodayDateValue(),
    themeId: defaultThemeId,
    templateId: null,
  };
}

const INPUT_LIMITS = {
  title: 45,
  partnerName: 45,
} as const;

type FormErrors = Partial<Record<keyof NewProposalFormValues, string>>;

function isValidDateValue(value: string): boolean {
  if (!value) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(value).getTime());
}

const CATEGORY_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  partnership: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400' },
  sales: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400' },
  sponsorship: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
  agency: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-400' },
  event: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-400' },
  general: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' },
};

function TemplateCard({
  template,
  isSelected,
  onSelect,
  isCustom,
  onDelete,
}: {
  template: ProposalTemplate;
  isSelected: boolean;
  onSelect: () => void;
  isCustom?: boolean;
  onDelete?: () => void;
}) {
  const slideCount = template.slides.length;
  const slideTypes = template.slides.map((s) => s.type);
  const uniqueTypes = [...new Set(slideTypes)];
  const cat = CATEGORY_STYLE[template.category] ?? CATEGORY_STYLE.general;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-xl border p-3.5 transition-all duration-200 relative group flex flex-col gap-2 ${
        isSelected
          ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
      }`}
    >
      {onDelete && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onDelete(); } }}
          className="absolute top-2 right-2 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-md bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors z-10"
          title="Delete template"
        >
          <AppIcon icon="ui.close" className="w-3 h-3" />
        </span>
      )}

      {/* Category + Custom badge row */}
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cat.bg} ${cat.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
          {template.category}
        </span>
        {isCustom && (
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-600 uppercase tracking-wide">
            Custom
          </span>
        )}
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold leading-tight ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>
          {template.name}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-400 line-clamp-2">{template.description}</p>
      </div>

      {/* Slide metadata */}
      <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
        <span className="flex items-center gap-1 text-[11px] text-gray-400">
          <AppIcon icon="slide.type.features" className="w-3 h-3 opacity-50" />
          {slideCount} slides
        </span>
        <span className="flex items-center gap-1 text-[11px] text-gray-400">
          <AppIcon icon="slide.type.comparison" className="w-3 h-3 opacity-50" />
          {uniqueTypes.length} types
        </span>
      </div>
    </button>
  );
}

function BlankCard({
  isSelected,
  onSelect,
}: {
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-xl border p-3.5 transition-all duration-200 flex flex-col gap-2 ${
        isSelected
          ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900 shadow-sm'
          : 'border-dashed border-gray-300 bg-white hover:border-gray-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
      }`}
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
        <AppIcon icon="ui.add" className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold leading-tight ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>
          Blank proposal
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-400">Start from scratch with default slides.</p>
      </div>
    </button>
  );
}

export function NewProposalDialog({
  isOpen,
  isCreating,
  createError,
  onClose,
  onCreate,
  onCreateFromMarkdown,
}: NewProposalDialogProps) {
  const [values, setValues] = useState<NewProposalFormValues>(getInitialFormValues);
  const customTemplates = useCustomTemplateStore((s) => s.templates);
  const fetchCustomTemplates = useCustomTemplateStore((s) => s.fetchTemplates);
  const deleteCustomTemplate = useCustomTemplateStore((s) => s.deleteTemplate);

  const allTemplates = useMemo(() => {
    const custom = customTemplates.map(customTemplateToProposalTemplate);
    return [...custom, ...PROPOSAL_TEMPLATES];
  }, [customTemplates]);

  useEffect(() => {
    if (!isOpen) return;
    setValues(getInitialFormValues());
    fetchCustomTemplates();
  }, [isOpen, fetchCustomTemplates]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isCreating) {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isCreating, onClose]);

  const errors = useMemo<FormErrors>(() => {
    const next: FormErrors = {};
    if (!isValidDateValue(values.proposalDate)) {
      next.proposalDate = 'Select a valid proposal date.';
    }

    return next;
  }, [values.proposalDate]);

  const hasProposalTitle = values.title.trim().length > 0;
  const hasPartnerName = values.partnerName.trim().length > 0;
  const canCreate = useMemo(
    () => Object.keys(errors).length === 0 && hasProposalTitle && hasPartnerName,
    [errors, hasProposalTitle, hasPartnerName],
  );

  const updateField = <K extends keyof NewProposalFormValues>(key: K, value: NewProposalFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate || isCreating) return;
    await onCreate({
      ...values,
      title: values.title.trim(),
      partnerName: values.partnerName.trim(),
    });
  };

  const handleSelectTemplate = (templateId: string | null) => {
    setValues((prev) => {
      const updates: Partial<NewProposalFormValues> = { templateId };
      if (templateId) {
        const template = allTemplates.find((t) => t.id === templateId);
        if (template) {
          updates.themeId = template.themeId;
        }
      }
      return { ...prev, ...updates };
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isCreating) onClose(); }}>
      <DialogContent className="w-[min(64rem,calc(100vw-2rem))] max-h-[calc(100vh-4rem)] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle id="new-proposal-title" className="font-brand-serif">New Proposal</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-[#6b6b6b]">
              Pick a template or start blank, then set your proposal details.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Template picker */}
            <div className="grid gap-1.5">
              <Label>Start from</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[22rem] overflow-y-auto admin-scroll pr-1">
                <BlankCard
                  isSelected={values.templateId === null}
                  onSelect={() => handleSelectTemplate(null)}
                />
                {allTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={values.templateId === template.id}
                    onSelect={() => handleSelectTemplate(template.id)}
                    isCustom={template.id.startsWith('custom:')}
                    onDelete={template.id.startsWith('custom:')
                      ? () => deleteCustomTemplate(template.id.replace('custom:', ''))
                      : undefined
                    }
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3 md:items-start">
              <div className="grid gap-1.5 md:col-span-2">
                <Label htmlFor="new-proposal-title-input">
                  Proposal title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="new-proposal-title-input"
                  type="text"
                  value={values.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  placeholder="Q3 2026 Partnership Proposal"
                  maxLength={INPUT_LIMITS.title}
                  required
                />
              </div>
              <div className="grid gap-1.5 md:col-span-1">
                <Label htmlFor="new-proposal-date-input">
                  Proposal date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="new-proposal-date-input"
                  type="date"
                  value={values.proposalDate}
                  onChange={(event) => updateField('proposalDate', event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="new-proposal-partner-input">
                Partner / client name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-proposal-partner-input"
                type="text"
                value={values.partnerName}
                onChange={(event) => updateField('partnerName', event.target.value)}
                placeholder="Acme Corp"
                maxLength={INPUT_LIMITS.partnerName}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Theme</Label>
              <ThemePicker
                activeThemeId={values.themeId}
                onChange={(themeId) => updateField('themeId', themeId)}
              />
            </div>
          </div>

          <DialogFooter>
            {createError ? (
              <p className="mr-auto rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {createError}
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={onCreateFromMarkdown}
              disabled={isCreating}
              className="inline-flex items-center gap-2"
            >
              <AppIcon icon="ui.file" className="h-3.5 w-3.5" />
              From Markdown
            </Button>
            <Button
              type="submit"
              disabled={!canCreate || isCreating}
              className="inline-flex items-center gap-2"
            >
              {isCreating ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : null}
              Create proposal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
