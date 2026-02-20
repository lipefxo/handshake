import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Proposal } from '../../../types/proposal';
import { useProposalStore } from '../../../store/proposalStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface DangerZoneSectionProps {
  proposal: Proposal;
}

export function DangerZoneSection({ proposal }: DangerZoneSectionProps) {
  const navigate = useNavigate();
  const { duplicateProposal, deleteProposal } = useProposalStore();

  const [duplicating, setDuplicating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');

  const handleDuplicate = async () => {
    setDuplicating(true);
    setDuplicateError('');
    try {
      const newProposal = await duplicateProposal(proposal.id);
      if (newProposal) {
        navigate(`/admin/proposals/${newProposal.id}/settings`);
      } else {
        setDuplicateError('Failed to duplicate. Please try again.');
      }
    } finally {
      setDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const success = await deleteProposal(proposal.id);
    setDeleting(false);
    if (success) {
      navigate('/admin');
    }
  };

  const canConfirmDelete = deleteConfirmText === proposal.title;

  return (
    <section id="danger" className="scroll-mt-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">Danger Zone</h2>
        <p className="text-xs text-gray-400 mt-0.5">Irreversible actions. Proceed with caution.</p>
        <hr className="mt-3 border-gray-100" />
      </div>

      <div className="space-y-4">
        {/* Duplicate */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-800">Duplicate proposal</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Creates a copy as a draft with a new URL. Does not copy access settings.
            </p>
            {duplicateError && <p className="mt-1 text-xs text-red-500">{duplicateError}</p>}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={duplicating}
            onClick={handleDuplicate}
            className="flex-shrink-0 text-xs"
          >
            {duplicating ? 'Duplicating…' : 'Duplicate'}
          </Button>
        </div>

        {/* Delete */}
        <div className="rounded-xl border border-red-200 bg-red-50/30 p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-red-700">Delete proposal</p>
            <p className="text-xs text-red-500/80 mt-0.5">
              Permanently removes this proposal and its public URL immediately. This cannot be undone.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="flex-shrink-0 text-xs"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeleteConfirmText(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete proposal?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{proposal.title}</strong> and immediately make its public URL inaccessible.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Type <span className="font-semibold text-gray-800">{proposal.title}</span> to confirm
            </label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={proposal.title}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setDeleteOpen(false); setDeleteConfirmText(''); }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={!canConfirmDelete || deleting}
              onClick={handleDelete}
            >
              {deleting ? 'Deleting…' : 'Delete proposal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
