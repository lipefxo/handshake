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
    proposalDate: getTodayDateValue(),
    themeId: defaultThemeId,
  };
}

const INPUT_LIMITS = {
  title: 45,
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
    if (!isValidDateValue(values.proposalDate)) {
      next.proposalDate = 'Select a valid proposal date.';
    }

    return next;
  }, [values.proposalDate]);

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
            <div className="grid gap-3 md:grid-cols-3 md:items-start">
              <div className="grid gap-1.5 md:col-span-2">
                <Label htmlFor="new-proposal-title-input">Proposal title</Label>
                <Input
                  id="new-proposal-title-input"
                  type="text"
                  value={values.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  placeholder="Q3 2026 Partnership Proposal"
                  maxLength={INPUT_LIMITS.title}
                />
              </div>
              <div className="grid gap-1.5 md:col-span-1">
                <Label htmlFor="new-proposal-date-input">Proposal date</Label>
                <Input
                  id="new-proposal-date-input"
                  type="date"
                  value={values.proposalDate}
                  onChange={(event) => updateField('proposalDate', event.target.value)}
                  required
                  aria-invalid={Boolean(errors.proposalDate)}
                />
              </div>
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
