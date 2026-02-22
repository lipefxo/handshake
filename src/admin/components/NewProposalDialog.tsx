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

export interface NewProposalFormValues {
  title: string;
  partnerName: string;
  contactName: string;
  contactEmail: string;
  proposalDate: string;
  themeId: ThemeId;
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
    contactName: '',
    contactEmail: '',
    proposalDate: getTodayDateValue(),
    themeId: defaultThemeId,
  };
}

const INPUT_LIMITS = {
  title: 45,
  partnerName: 45,
  contactName: 45,
  contactEmail: 45,
} as const;

type FormErrors = Partial<Record<keyof NewProposalFormValues, string>>;

function isValidDateValue(value: string): boolean {
  if (!value) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(value).getTime());
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

  useEffect(() => {
    if (!isOpen) return;
    setValues(getInitialFormValues());
  }, [isOpen]);

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
    if (!values.partnerName.trim()) {
      next.partnerName = 'Partner / client name is required.';
    }

    if (values.contactEmail.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(values.contactEmail.trim())) {
        next.contactEmail = 'Enter a valid email address.';
      }
    }

    if (!isValidDateValue(values.proposalDate)) {
      next.proposalDate = 'Select a valid proposal date.';
    }

    return next;
  }, [values.contactEmail, values.partnerName, values.proposalDate]);

  const canCreate = useMemo(() => Object.keys(errors).length === 0, [errors]);

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
      contactName: values.contactName.trim(),
      contactEmail: values.contactEmail.trim(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isCreating) onClose(); }}>
      <DialogContent className="w-[min(44rem,calc(100vw-2rem))]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle id="new-proposal-title">New Proposal</DialogTitle>
            <DialogDescription>
              Set the global configuration before creating the proposal.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="new-proposal-title-input">Proposal title</Label>
              <Input
                id="new-proposal-title-input"
                type="text"
                value={values.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Q3 2026 Partnership Proposal"
                maxLength={INPUT_LIMITS.title}
              />
              <p className="text-xs text-gray-500 text-right">
                {values.title.length}/{INPUT_LIMITS.title}
              </p>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="new-proposal-partner-input">Partner / client name</Label>
              <Input
                id="new-proposal-partner-input"
                type="text"
                value={values.partnerName}
                onChange={(event) => updateField('partnerName', event.target.value)}
                placeholder="Acme Corp"
                required
                maxLength={INPUT_LIMITS.partnerName}
                aria-invalid={Boolean(errors.partnerName)}
              />
              <div className="flex items-center justify-between gap-2 text-xs">
                <p className={errors.partnerName ? 'text-red-600' : 'text-transparent'}>{errors.partnerName ?? '.'}</p>
                <p className="text-gray-500">
                  {values.partnerName.length}/{INPUT_LIMITS.partnerName}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="new-proposal-contact-name-input">Contact name</Label>
                <Input
                  id="new-proposal-contact-name-input"
                  type="text"
                  value={values.contactName}
                  onChange={(event) => updateField('contactName', event.target.value)}
                  placeholder="Jane Doe"
                  maxLength={INPUT_LIMITS.contactName}
                />
                <p className="text-xs text-gray-500 text-right">
                  {values.contactName.length}/{INPUT_LIMITS.contactName}
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="new-proposal-contact-email-input">Contact email</Label>
                <Input
                  id="new-proposal-contact-email-input"
                  type="email"
                  value={values.contactEmail}
                  onChange={(event) => updateField('contactEmail', event.target.value)}
                  placeholder="jane@acme.com"
                  maxLength={INPUT_LIMITS.contactEmail}
                  aria-invalid={Boolean(errors.contactEmail)}
                />
                <div className="flex items-center justify-between gap-2 text-xs">
                  <p className={errors.contactEmail ? 'text-red-600' : 'text-transparent'}>{errors.contactEmail ?? '.'}</p>
                  <p className="text-gray-500">
                    {values.contactEmail.length}/{INPUT_LIMITS.contactEmail}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-1.5 md:max-w-[15rem]">
              <Label htmlFor="new-proposal-date-input">Proposal date</Label>
              <Input
                id="new-proposal-date-input"
                type="date"
                value={values.proposalDate}
                onChange={(event) => updateField('proposalDate', event.target.value)}
                required
                aria-invalid={Boolean(errors.proposalDate)}
              />
              {errors.proposalDate ? (
                <p className="text-xs text-red-600">{errors.proposalDate}</p>
              ) : null}
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
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
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
