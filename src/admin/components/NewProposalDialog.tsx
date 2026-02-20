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
  onClose: () => void;
  onCreate: (values: NewProposalFormValues) => Promise<void>;
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

export function NewProposalDialog({ isOpen, isCreating, onClose, onCreate }: NewProposalDialogProps) {
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

  const canCreate = useMemo(() => values.partnerName.trim().length > 0, [values.partnerName]);

  const updateField = <K extends keyof NewProposalFormValues>(key: K, value: NewProposalFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate || isCreating) return;
    await onCreate(values);
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
              />
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
              />
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
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="new-proposal-contact-email-input">Contact email</Label>
                <Input
                  id="new-proposal-contact-email-input"
                  type="email"
                  value={values.contactEmail}
                  onChange={(event) => updateField('contactEmail', event.target.value)}
                  placeholder="jane@acme.com"
                />
              </div>
            </div>

            <div className="grid gap-1.5 md:max-w-[15rem]">
              <Label htmlFor="new-proposal-date-input">Proposal date</Label>
              <Input
                id="new-proposal-date-input"
                type="date"
                value={values.proposalDate}
                onChange={(event) => updateField('proposalDate', event.target.value)}
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
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
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
