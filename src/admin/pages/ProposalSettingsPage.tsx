import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useProposalStore } from '../../store/proposalStore';
import type { Proposal } from '../../types/proposal';
import { AppIcon } from '../../shared/icons/AppIcon';
import { SettingsNav } from '../components/settings/SettingsNav';
import { MetadataSection } from '../components/settings/MetadataSection';
import { ThemeSection } from '../components/settings/ThemeSection';
import { SharingSection } from '../components/settings/SharingSection';
import { DangerZoneSection } from '../components/settings/DangerZoneSection';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const AUTOSAVE_DELAY = 1500;

export function ProposalSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const { proposals, loading: proposalsLoading, fetchProposals, updateProposal } = useProposalStore();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync from store on mount / store changes
  useEffect(() => {
    const p = proposals.find((p) => p.id === id);
    if (p && !hasUnsavedChanges) {
      setProposal({ ...p });
    }
  }, [id, proposals, hasUnsavedChanges]);

  useEffect(() => {
    if (proposals.length > 0) return;
    void fetchProposals();
  }, [fetchProposals, proposals.length]);

  const save = useCallback(
    async (updatedProposal: Proposal) => {
      setSaveState('saving');
      try {
        await updateProposal(updatedProposal.id, {
          title: updatedProposal.title,
          partnerName: updatedProposal.partnerName,
          slug: updatedProposal.slug,
          status: updatedProposal.status,
          themeId: updatedProposal.themeId,
          visibility: updatedProposal.visibility,
          accessPassword: updatedProposal.accessPassword,
          expiresAt: updatedProposal.expiresAt,
          brandOverrides: updatedProposal.brandOverrides,
        });
        setSaveState('saved');
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('error');
      }
    },
    [updateProposal],
  );

  // Debounced autosave
  useEffect(() => {
    if (!proposal || !hasUnsavedChanges) return;
    const timer = setTimeout(() => void save(proposal), AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [proposal, save, hasUnsavedChanges]);

  const updateLocal = (updates: Partial<Proposal>) => {
    setProposal((prev) => (prev ? { ...prev, ...updates } : prev));
    setHasUnsavedChanges(true);
  };

  // Immediate save (no debounce) for status / visibility changes
  const immediateSave = useCallback(
    async (updates: Partial<Proposal>) => {
      if (!proposal) return;
      const updated = { ...proposal, ...updates };
      setProposal(updated);
      await save(updated);
    },
    [proposal, save],
  );

  if (!proposal && proposalsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">Proposal not found.</p>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
          >
            <AppIcon icon="ui.sidebar-toggle" className="w-3.5 h-3.5" />
            Back to proposals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-3.5 border-b border-gray-100 bg-white flex-shrink-0">
        <Link
          to="/admin"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors duration-150 flex items-center gap-1.5 rounded-md px-1.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
        >
          <AppIcon icon="ui.sidebar-toggle" className="w-4 h-4" />
          Proposals
        </Link>

        {/* Tab strip */}
        <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5 gap-0.5 flex-shrink-0">
          <Link
            to={`/admin/proposals/${id}`}
            className="px-3 py-1 text-xs font-medium rounded-md text-gray-500 hover:text-gray-700 transition-colors duration-150"
          >
            Slides
          </Link>
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-white shadow-sm text-gray-800">
            Settings
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{proposal.title}</p>
        </div>

        {/* Save state */}
        <div className="flex-shrink-0 flex items-center gap-1.5">
          <AnimatePresence mode="wait">
            {saveState === 'saving' && (
              <motion.span
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-gray-400 flex items-center gap-1.5"
              >
                <span className="w-3 h-3 border border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                Saving…
              </motion.span>
            )}
            {saveState === 'saved' && (
              <motion.span
                key="saved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-green-500 flex items-center gap-1"
              >
                <AppIcon icon="ui.check" className="w-3 h-3" />
                Saved
              </motion.span>
            )}
            {saveState === 'error' && (
              <motion.span
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-500"
              >
                Save failed
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto admin-scroll">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-[12rem_1fr] gap-8">
            {/* Left nav */}
            <SettingsNav />

            {/* Content */}
            <div className="space-y-12">
              <MetadataSection
                proposal={proposal}
                onChange={updateLocal}
                onImmediateSave={immediateSave}
              />
              <ThemeSection proposal={proposal} onChange={updateLocal} />
              <SharingSection
                proposal={proposal}
                onChange={updateLocal}
                onImmediateSave={immediateSave}
              />
              <DangerZoneSection proposal={proposal} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
