import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import bcrypt from 'bcryptjs';
import { useProposalStore } from '../../store/proposalStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../shared/feedback/toastStore';
import type { Proposal, ProposalVersion, SlideConfig, SlideType, TitleSlideContent } from '../../types/proposal';
import { SlideSortableList } from '../components/SlideSortableList';
import { SlideConfigurator } from '../components/SlideConfigurator';
import { VersionDropdown } from '../components/VersionDropdown';
import { createDefaultSlide } from '../../data/slideDefaults';
import { copyToClipboard, formatRelativeTime } from '../../shared/utils/helpers';
import { MarkdownIngestorModal } from '../../ingestor/MarkdownIngestorModal';
import { useIngestorState } from '../../ingestor/hooks/useIngestorState';
import { ProposalMarkdownEditorModal } from '../components/ProposalMarkdownEditorModal';
import { PublishSuccessModal } from '../components/PublishSuccessModal';
import { checkProposalReadiness, ReadinessCheckDisplay } from '../components/ReadinessCheck';
import { createUndoRedoManager } from '../../shared/hooks/useUndoRedo';
import { exportProposalToPdf } from '../../shared/utils/pdfExport';
import { useCustomTemplateStore } from '../../store/customTemplateStore';
import { AppIcon } from '../../shared/icons/AppIcon';
import { SegmentedTabs } from '../../shared/components/SegmentedTabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type PreviewDevice = 'desktop' | 'mobile';

const AUTOSAVE_DELAY = 800;
const VERSION_COOLDOWN_MS = 5 * 60 * 1000;
const PREVIEW_CONTENT_WIDTH_CLASS = 'w-[92%]';
const FOOTER_BRANDING_ALLOWED_EMAIL = 'lipefxo@gmail.com';
const PREVIEW_DEVICE_CONFIG: Record<PreviewDevice, { scale: number; maxWidthClassName: string; frameAspectClassName: string }> = {
  desktop: {
    scale: 0.7,
    maxWidthClassName: 'max-w-5xl',
    frameAspectClassName: 'aspect-video',
  },
  mobile: {
    scale: 0.78,
    maxWidthClassName: 'max-w-[21rem]',
    frameAspectClassName: 'aspect-[9/19.5]',
  },
};

export function ProposalEditor() {
  const { id } = useParams<{ id: string }>();
  const {
    proposals,
    loading: proposalsLoading,
    error: proposalsError,
    fetchProposals,
    updateProposal,
    fetchVersions,
    saveVersion,
    restoreVersion,
    importMarkdownToProposal,
  } = useProposalStore();
  const currentUser = useAuthStore((state) => state.user);
  const members = useWorkspaceStore((state) => state.members);
  const showSuccessToast = useToastStore((state) => state.success);
  const showErrorToast = useToastStore((state) => state.error);
  const workspaceCompanyName = useWorkspaceStore((state) => state.currentWorkspace?.companyName ?? '');
  const ingestor = useIngestorState();

  const editorValues = {
    autosave: {
      enabled: true,
    },
    preview: {
      showPanel: true,
    },
  };

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [markdownEditorOpen, setMarkdownEditorOpen] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [publishVisibility, setPublishVisibility] = useState<Proposal['visibility']>('public');
  const [publishPasswordInput, setPublishPasswordInput] = useState('');
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [publishing, setPublishing] = useState(false);
  const [versions, setVersions] = useState<ProposalVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const saveCustomTemplate = useCustomTemplateStore((s) => s.saveTemplate);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const hydratedProposalIdRef = useRef<string | null>(null);
  const undoRedoRef = useRef(createUndoRedoManager());
  const lastVersionSaveAtRef = useRef(0);
  const editsSinceLastVersionRef = useRef(false);
  const versionSaveInFlightRef = useRef(false);
  const initialVersionCheckedRef = useRef<string | null>(null);

  useEffect(() => {
    const p = proposals.find((p) => p.id === id);
    if (p && hydratedProposalIdRef.current !== p.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProposal({ ...p });
      hydratedProposalIdRef.current = p.id;
      setHasUnsavedChanges(false);
      if (!selectedSlideId && p.slides.length > 0) {
        setSelectedSlideId(p.slides[0].id);
      }
    }
  }, [id, proposals]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (id && hydratedProposalIdRef.current !== id) {
      hydratedProposalIdRef.current = null;
      setProposal(null);
      setHasUnsavedChanges(false);
    }
  }, [id]);

  useEffect(() => {
    if (proposals.length > 0) return;
    void fetchProposals();
  }, [fetchProposals, proposals.length]);

  const selectedSlide = proposal?.slides.find((s) => s.id === selectedSlideId) ?? null;
  const selectedSlideIndex = proposal?.slides.findIndex((s) => s.id === selectedSlideId) ?? -1;
  const hasPrevSlide = selectedSlideIndex > 0;
  const hasNextSlide = proposal ? selectedSlideIndex >= 0 && selectedSlideIndex < proposal.slides.length - 1 : false;
  const hasSlides = (proposal?.slides.length ?? 0) > 0;
  const previewScale = PREVIEW_DEVICE_CONFIG[previewDevice].scale;
  const previewScaleInverse = 1 / previewScale;
  const previewMaxWidthClassName = PREVIEW_DEVICE_CONFIG[previewDevice].maxWidthClassName;
  const previewFrameAspectClassName = PREVIEW_DEVICE_CONFIG[previewDevice].frameAspectClassName;

  const resolveUserLabel = useCallback((userId?: string) => {
    if (!userId) return 'Unknown user';
    if (currentUser?.id === userId) {
      return currentUser.displayName || currentUser.email;
    }
    const member = members.find((entry) => entry.userId === userId);
    return member?.email ?? 'Unknown user';
  }, [currentUser, members]);

  const lastEditedByLabel = proposal?.updatedBy ? resolveUserLabel(proposal.updatedBy) : null;
  const canToggleFooterBranding = currentUser?.email?.toLowerCase() === FOOTER_BRANDING_ALLOWED_EMAIL;

  const snapshotProposalForVersion = useCallback((source: Proposal) => ({
    title: source.title,
    partnerName: source.partnerName,
    slides: source.slides,
    themeId: source.themeId,
    brandOverrides: source.brandOverrides,
  }), []);

  const maybeSaveVersion = useCallback((p: Proposal) => {
    if (versionSaveInFlightRef.current) return;
    if (!editsSinceLastVersionRef.current) return;
    const elapsed = Date.now() - lastVersionSaveAtRef.current;
    if (elapsed < VERSION_COOLDOWN_MS) return;

    versionSaveInFlightRef.current = true;
    void saveVersion(p.id, snapshotProposalForVersion(p)).then(() => {
      lastVersionSaveAtRef.current = Date.now();
      editsSinceLastVersionRef.current = false;
      void fetchVersions(p.id).then(setVersions);
    }).finally(() => {
      versionSaveInFlightRef.current = false;
    });
  }, [saveVersion, snapshotProposalForVersion, fetchVersions]);

  const save = useCallback(
    async (updatedProposal: Proposal): Promise<boolean> => {
      setSaveState('saving');
      try {
        const brandOverrides = {
          ...updatedProposal.brandOverrides,
          companyName: workspaceCompanyName || updatedProposal.brandOverrides?.companyName,
        };
        await updateProposal(updatedProposal.id, {
          title: updatedProposal.title,
          partnerName: updatedProposal.partnerName,
          slug: updatedProposal.slug,
          status: updatedProposal.status,
          slides: updatedProposal.slides,
          themeId: updatedProposal.themeId,
          visibility: updatedProposal.visibility,
          accessPassword: updatedProposal.accessPassword,
          expiresAt: updatedProposal.expiresAt,
          brandOverrides,
        });
        setSaveState('saved');
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveState('idle'), 2000);
        maybeSaveVersion(updatedProposal);
        return true;
      } catch {
        setSaveState('error');
        return false;
      }
    },
    [updateProposal, workspaceCompanyName, maybeSaveVersion]
  );

  useEffect(() => {
    if (!proposal || !editorValues.autosave.enabled || !hasUnsavedChanges) return;
    const timer = setTimeout(() => void save(proposal), AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [proposal, save, editorValues.autosave.enabled, hasUnsavedChanges]);

  useEffect(() => {
    lastVersionSaveAtRef.current = 0;
    editsSinceLastVersionRef.current = false;
    initialVersionCheckedRef.current = null;
  }, [id]);

  useEffect(() => {
    if (!proposal || !proposal.id) return;
    if (initialVersionCheckedRef.current === proposal.id) return;
    if (proposal.slides.length === 0) return;
    initialVersionCheckedRef.current = proposal.id;

    void fetchVersions(proposal.id).then((existing) => {
      setVersions(existing);
      if (existing.length === 0) {
        void saveVersion(proposal.id, snapshotProposalForVersion(proposal)).then(() => {
          lastVersionSaveAtRef.current = Date.now();
          void fetchVersions(proposal.id).then(setVersions);
        });
      } else {
        lastVersionSaveAtRef.current = Date.now();
      }
    });
  }, [proposal, fetchVersions, saveVersion, snapshotProposalForVersion]);

  const sendPreviewMessage = useCallback((p: Proposal, slideId: string | null, targetWindow?: Window | null) => {
    const message = {
      type: 'handshake-editor-preview-update',
      proposal: p,
      selectedSlideId: slideId,
    };
    const iframeWindow = previewIframeRef.current?.contentWindow;
    iframeWindow?.postMessage(message, window.location.origin);
    targetWindow?.postMessage(message, window.location.origin);
  }, []);

  const pushUndoSnapshot = useCallback(() => {
    if (!proposal) return;
    undoRedoRef.current.push({
      slides: JSON.parse(JSON.stringify(proposal.slides)),
      selectedSlideId,
    });
  }, [proposal, selectedSlideId]);

  const updateLocal = (updates: Partial<Proposal>, { skipUndo = false } = {}) => {
    if (!skipUndo) pushUndoSnapshot();
    editsSinceLastVersionRef.current = true;
    setProposal((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      queueMicrotask(() => sendPreviewMessage(next, selectedSlideId));
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const handleUndo = useCallback(() => {
    if (!proposal) return;
    const snapshot = undoRedoRef.current.undo({
      slides: JSON.parse(JSON.stringify(proposal.slides)),
      selectedSlideId,
    });
    if (!snapshot) return;
    const restoredSlides = snapshot.slides as SlideConfig[];
    setProposal((prev) => prev ? { ...prev, slides: restoredSlides } : prev);
    if (snapshot.selectedSlideId) setSelectedSlideId(snapshot.selectedSlideId);
    setHasUnsavedChanges(true);
    editsSinceLastVersionRef.current = true;
  }, [proposal, selectedSlideId]);

  const handleRedo = useCallback(() => {
    if (!proposal) return;
    const snapshot = undoRedoRef.current.redo({
      slides: JSON.parse(JSON.stringify(proposal.slides)),
      selectedSlideId,
    });
    if (!snapshot) return;
    const restoredSlides = snapshot.slides as SlideConfig[];
    setProposal((prev) => prev ? { ...prev, slides: restoredSlides } : prev);
    if (snapshot.selectedSlideId) setSelectedSlideId(snapshot.selectedSlideId);
    setHasUnsavedChanges(true);
    editsSinceLastVersionRef.current = true;
  }, [proposal, selectedSlideId]);

  const updateSlide = (slideId: string, updates: Partial<SlideConfig>) => {
    if (!proposal) return;
    const slides = proposal.slides.map((s) => s.id === slideId ? { ...s, ...updates } : s);
    updateLocal({ slides });
  };

  const handleToggleSlide = (id: string) => {
    const slide = proposal?.slides.find((s) => s.id === id);
    if (slide) updateSlide(id, { enabled: !slide.enabled });
  };

  const handleDeleteSlide = (id: string) => {
    if (!proposal) return;
    const slides = proposal.slides.filter((s) => s.id !== id);
    updateLocal({ slides });
    if (selectedSlideId === id) {
      setSelectedSlideId(slides[0]?.id ?? null);
    }
  };

  const handleDuplicateSlide = useCallback((slideId: string) => {
    if (!proposal) return;
    const sourceIndex = proposal.slides.findIndex((s) => s.id === slideId);
    if (sourceIndex === -1) return;
    const source = proposal.slides[sourceIndex];
    const duplicate: SlideConfig = {
      ...JSON.parse(JSON.stringify(source)),
      id: uuidv4(),
      customLabel: source.customLabel ? `${source.customLabel} (copy)` : undefined,
    };
    const slides = [...proposal.slides];
    slides.splice(sourceIndex + 1, 0, duplicate);
    updateLocal({ slides });
    setSelectedSlideId(duplicate.id);
  }, [proposal]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExportPdf = useCallback(async () => {
    if (!proposal || exportingPdf) return;
    const iframe = previewIframeRef.current;
    if (!iframe?.contentDocument) {
      showErrorToast('Preview must be visible to export PDF.');
      return;
    }
    setExportingPdf(true);
    try {
      // Tell preview to render all slides for export
      const exportMessage = {
        type: 'handshake-editor-preview-update',
        proposal,
        selectedSlideId: selectedSlideId,
        exportMode: true,
      };
      iframe.contentWindow?.postMessage(exportMessage, window.location.origin);
      // Wait for all slides to render in export mode (no animations)
      await new Promise((r) => setTimeout(r, 800));

      const container = iframe.contentDocument.querySelector<HTMLElement>('.slide-container');
      if (!container) {
        showErrorToast('Preview must be visible to export PDF.');
        return;
      }
      const safeName = (proposal.partnerName || proposal.title || 'proposal')
        .replace(/[^a-zA-Z0-9-_ ]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase();
      await exportProposalToPdf(container, { filename: `${safeName}.pdf` });
      showSuccessToast('PDF exported successfully.');
    } catch {
      showErrorToast('Failed to export PDF. Try again.');
    } finally {
      // Restore single-slide preview mode
      sendPreviewMessage(proposal, selectedSlideId);
      setExportingPdf(false);
    }
  }, [proposal, exportingPdf, selectedSlideId, sendPreviewMessage, showSuccessToast, showErrorToast]);

  const handleSaveAsTemplate = useCallback(async () => {
    if (!proposal || savingTemplate || !templateName.trim()) return;
    setSavingTemplate(true);
    try {
      const result = await saveCustomTemplate({
        name: templateName.trim(),
        description: `Custom template from "${proposal.title}"`,
        themeId: proposal.themeId,
        slides: proposal.slides,
      });
      if (result) {
        showSuccessToast(`Template "${templateName.trim()}" saved.`);
        setShowSaveTemplate(false);
        setTemplateName('');
      } else {
        showErrorToast('Failed to save template.');
      }
    } catch {
      showErrorToast('Failed to save template.');
    } finally {
      setSavingTemplate(false);
    }
  }, [proposal, savingTemplate, templateName, saveCustomTemplate, showSuccessToast, showErrorToast]);

  const handleAddSlide = (type: SlideType) => {
    if (!proposal) return;
    const newSlide = createDefaultSlide(type);
    const slides = [...proposal.slides, newSlide];
    updateLocal({ slides });
    if (!selectedSlideId) {
      setSelectedSlideId(newSlide.id);
    }
  };

  const handleRenameSlide = (slideId: string, label: string) => {
    updateSlide(slideId, { customLabel: label });
  };

  const handleRenameGroup = (groupId: string, title: string) => {
    if (!proposal) return;
    const slides = proposal.slides.map((slide) =>
      slide.groupId === groupId ? { ...slide, groupTitle: title } : slide
    );
    updateLocal({ slides });
  };

  const handleAssignSlideGroup = (slideId: string, groupId: string | null) => {
    if (!proposal) return;
    const targetGroupTitle = groupId
      ? proposal.slides.find((slide) => slide.groupId === groupId)?.groupTitle || 'Untitled group'
      : undefined;
    const slides = proposal.slides.map((slide) => {
      if (slide.id !== slideId) return slide;
      if (!groupId) return { ...slide, groupId: undefined, groupTitle: undefined };
      return { ...slide, groupId, groupTitle: targetGroupTitle };
    });
    updateLocal({ slides });
  };

  const handleGoToPrevSlide = useCallback(() => {
    if (!proposal || !hasPrevSlide) return;
    const prevSlide = proposal.slides[selectedSlideIndex - 1];
    if (prevSlide) setSelectedSlideId(prevSlide.id);
  }, [proposal, hasPrevSlide, selectedSlideIndex]);

  const handleGoToNextSlide = useCallback(() => {
    if (!proposal || !hasNextSlide) return;
    const nextSlide = proposal.slides[selectedSlideIndex + 1];
    if (nextSlide) setSelectedSlideId(nextSlide.id);
  }, [proposal, hasNextSlide, selectedSlideIndex]);

  const handlePublish = async () => {
    if (!proposal) return;
    if (!hasSlides) return;
    if (proposal.status === 'published') {
      setShowUnpublishConfirm(true);
      return;
    }
    setPublishVisibility(proposal.visibility ?? 'public');
    setPublishPasswordInput('');
    setShowPublishConfirm(true);
  };

  const handleConfirmUnpublish = async () => {
    if (!proposal) return;
    const previousProposal = proposal;
    const nextProposal = { ...proposal, status: 'draft' as const };
    setProposal(nextProposal);
    const saved = await save(nextProposal);
    if (!saved) {
      setProposal(previousProposal);
      return;
    }
    setShowUnpublishConfirm(false);
  };

  const handleConfirmPublish = async () => {
    if (!proposal) return;
    if (!hasSlides) return;
    setPublishing(true);
    try {
      const updates: Partial<Proposal> = {
        status: 'published',
        visibility: publishVisibility,
      };
      if (publishVisibility === 'password' && publishPasswordInput.trim()) {
        const hash = await bcrypt.hash(publishPasswordInput.trim(), 10);
        updates.accessPassword = hash;
      }
      const previousProposal = proposal;
      const nextProposal = { ...proposal, ...updates };
      setProposal(nextProposal);
      const saved = await save(nextProposal);
      if (!saved) {
        setProposal(previousProposal);
        return;
      }
      const publishVersion = await saveVersion(nextProposal.id, snapshotProposalForVersion(nextProposal));
      if (!publishVersion) {
        showErrorToast('Published, but failed to save version history checkpoint.');
      } else {
        const refreshedVersions = await fetchVersions(nextProposal.id);
        setVersions(refreshedVersions);
      }
      setShowPublishConfirm(false);
      setShowPublishSuccess(true);
      setPublishPasswordInput('');
    } finally {
      setPublishing(false);
    }
  };

  const handlePartnerNameChange = (value: string) => {
    if (!proposal) return;
    const slides = proposal.slides.map((slide) => {
      if (slide.type !== 'title') return slide;
      const titleContent = slide.content as TitleSlideContent;
      return {
        ...slide,
        content: {
          ...titleContent,
          partnerName: value,
        },
      };
    });
    updateLocal({ partnerName: value, slides });
  };

  const handleMarkdownImport = useCallback(
    async (newSlides: SlideConfig[]) => {
      if (!proposal) return;
      const mode = ingestor.mode === 'import' ? 'append' : 'replace';
      await importMarkdownToProposal(proposal.id, newSlides, mode);
      const updated = useProposalStore.getState().proposals.find((p) => p.id === proposal.id);
      if (updated) setProposal({ ...updated });
      ingestor.close();
    },
    [proposal, ingestor, importMarkdownToProposal],
  );

  const handleVersionMenuOpenChange = useCallback((open: boolean) => {
    if (!open || !proposal) return;
    setLoadingVersions(true);
    void fetchVersions(proposal.id)
      .then((items) => setVersions(items))
      .finally(() => setLoadingVersions(false));
  }, [fetchVersions, proposal]);

  const handleRestoreVersion = useCallback(async (version: ProposalVersion) => {
    if (!proposal) return;
    setRestoringVersionId(version.id);
    try {
      const restored = await restoreVersion(proposal.id, version.id, snapshotProposalForVersion(proposal));
      if (!restored) {
        showErrorToast('Failed to restore this version');
        return;
      }

      const restoredProposal: Proposal = {
        ...proposal,
        ...restored,
      };
      setProposal(restoredProposal);
      setHasUnsavedChanges(true);
      setSaveState('idle');
      editsSinceLastVersionRef.current = false;
      lastVersionSaveAtRef.current = Date.now();
      showSuccessToast(`Restored to version ${version.versionNumber}`);

      const refreshedVersions = await fetchVersions(proposal.id);
      setVersions(refreshedVersions);
    } finally {
      setRestoringVersionId(null);
    }
  }, [fetchVersions, proposal, restoreVersion, showErrorToast, showSuccessToast, snapshotProposalForVersion]);

  const handleMarkdownApply = useCallback((slides: SlideConfig[]) => {
    updateLocal({ slides });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyLink = async () => {
    if (!proposal) return;
    const shareUrl = proposal.shortCode
      ? `${window.location.origin}/s/${proposal.shortCode}`
      : `${window.location.origin}/p/${proposal.slug}`;
    await copyToClipboard(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const proposalRef = useRef(proposal);
  proposalRef.current = proposal;
  const selectedSlideIdRef = useRef(selectedSlideId);
  selectedSlideIdRef.current = selectedSlideId;

  useEffect(() => {
    if (proposal) {
      sendPreviewMessage(proposal, selectedSlideId);
    }
  }, [selectedSlideId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handlePreviewReady = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'handshake-editor-preview-ready') return;
      const p = proposalRef.current;
      if (p) {
        sendPreviewMessage(p, selectedSlideIdRef.current, event.source instanceof Window ? event.source : null);
      }
    };

    window.addEventListener('message', handlePreviewReady);
    return () => window.removeEventListener('message', handlePreviewReady);
  }, [sendPreviewMessage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isMod = e.metaKey || e.ctrlKey;

      // Undo/redo works globally (even in inputs)
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (isMod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // Duplicate selected slide
      if (isMod && e.key === 'd' && selectedSlideId) {
        e.preventDefault();
        handleDuplicateSlide(selectedSlideId);
        return;
      }

      if (e.key === 'ArrowLeft') handleGoToPrevSlide();
      else if (e.key === 'ArrowRight') handleGoToNextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGoToPrevSlide, handleGoToNextSlide, handleUndo, handleRedo, handleDuplicateSlide, selectedSlideId]);

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
          <p className="text-sm font-medium text-gray-700">
            {proposalsError ? 'Could not load this proposal.' : 'Proposal not found.'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {proposalsError ? proposalsError : 'It may have been deleted or you may not have access.'}
          </p>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4785c]/50 focus-visible:ring-offset-2"
          >
            <AppIcon icon="ui.sidebar-toggle" className="w-3.5 h-3.5" />
            Back to proposals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="grid grid-cols-[17rem_minmax(0,1fr)_28rem] items-center gap-4 px-4 py-2.5 border-b border-gray-100 bg-white flex-shrink-0">
        {id && (
          <SegmentedTabs
            value="slides"
            className="w-[17rem] flex-shrink-0"
            tabClassName="flex-1"
            indicatorLayoutId="proposal-editor-mode-tabs"
            options={[
              { value: 'slides', label: 'Slides' },
              { value: 'settings', label: 'Settings', href: `/admin/proposals/${id}/settings` },
              { value: 'analytics', label: 'Analytics', href: `/admin/proposals/${id}/analytics` },
            ]}
          />
        )}

        <div className="min-w-0 flex flex-col items-center justify-center gap-0.5">
          <Input
            className="h-7 border-0 bg-transparent px-2 py-0.5 text-sm font-semibold text-center text-gray-900 shadow-none focus-visible:bg-gray-50 focus-visible:ring-0 min-w-0 w-full max-w-xl"
            value={proposal.title}
            onChange={(e) => updateLocal({ title: e.target.value })}
            placeholder="Proposal title..."
          />
          <Input
            className="h-6 border-0 bg-transparent px-2 py-0 text-xs text-center text-gray-500 shadow-none focus-visible:bg-gray-50 focus-visible:ring-0 min-w-0 w-full max-w-sm"
            value={proposal.partnerName}
            onChange={(e) => handlePartnerNameChange(e.target.value)}
            placeholder="Partner name"
            aria-label="Partner name"
          />
        </div>

        <div className="w-[28rem] flex items-center justify-end gap-1.5">
          <div className="flex items-center gap-0.5 mr-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!undoRedoRef.current.canUndo}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              title="Undo (Cmd+Z)"
            >
              <AppIcon icon="ui.undo" className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!undoRedoRef.current.canRedo}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              title="Redo (Cmd+Shift+Z)"
            >
              <AppIcon icon="ui.redo" className="w-3.5 h-3.5" />
            </button>
          </div>
          <VersionDropdown
            versions={versions}
            loading={loadingVersions}
            restoringVersionId={restoringVersionId}
            onOpenChange={handleVersionMenuOpenChange}
            onRestore={handleRestoreVersion}
            resolveUserLabel={resolveUserLabel}
          />
          <Button
            onClick={() => setMarkdownEditorOpen(true)}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            title="Edit proposal as Markdown"
          >
            <AppIcon icon="ui.file" className="w-3.5 h-3.5" />
            Markdown
          </Button>
          <Button
            onClick={handleExportPdf}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            disabled={exportingPdf}
            title="Download proposal as PDF"
          >
            {exportingPdf ? (
              <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <AppIcon icon="ui.download" className="w-3.5 h-3.5" />
            )}
            {exportingPdf ? 'Exporting…' : 'PDF'}
          </Button>
          <Button
            onClick={() => { setTemplateName(proposal.title); setShowSaveTemplate(true); }}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            title="Save current slides as a reusable template"
          >
            <AppIcon icon="ui.copy" className="w-3.5 h-3.5" />
            Save template
          </Button>
          {canToggleFooterBranding && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={() =>
                updateLocal({
                  brandOverrides: {
                    ...proposal.brandOverrides,
                    showFooterBranding: proposal.brandOverrides?.showFooterBranding === false,
                  },
                })
              }
              title="Toggle the final-slide Built with Handshake footer branding"
            >
              Footer branding: {proposal.brandOverrides?.showFooterBranding === false ? 'Off' : 'On'}
            </Button>
          )}
          {proposal.status === 'published' && (
            <Button
              onClick={handleCopyLink}
              variant="secondary"
              size="sm"
              className="h-9 gap-1.5 text-xs"
            >
              {copiedLink ? (
                <><AppIcon icon="ui.check" className="w-3.5 h-3.5 text-green-500" /> Copied!</>
              ) : (
                <><AppIcon icon="ui.copy" className="w-3.5 h-3.5" /> Copy link</>
              )}
            </Button>
          )}
          <Button
            onClick={handlePublish}
            variant={proposal.status === 'published' ? 'destructive' : 'default'}
            className="h-9 px-4 text-xs font-semibold transition-all"
            disabled={proposal.status !== 'published' && !hasSlides}
            title={proposal.status !== 'published' && !hasSlides ? 'Add at least one slide before publishing' : undefined}
          >
            {proposal.status === 'published' ? 'Unpublish' : 'Publish'}
          </Button>
        </div>

      </div>

      {/* Main editor area */}
      <motion.div
        className="flex-1 flex overflow-hidden"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
        {/* Slide list — left panel */}
        <div className="w-[19.5rem] min-h-0 flex-shrink-0 border-r border-gray-100 flex flex-col bg-gray-50/50">
          <div className="px-3 pt-3 pb-1 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-1">Slides</p>
            <span className="text-[11px] text-gray-400 px-1">{proposal.slides.filter((s) => s.enabled).length} active</span>
          </div>
          <SlideSortableList
            slides={proposal.slides}
            selectedId={selectedSlideId}
            onSelect={setSelectedSlideId}
            onReorder={(slides) => updateLocal({ slides })}
            onToggle={handleToggleSlide}
            onDelete={handleDeleteSlide}
            onDuplicate={handleDuplicateSlide}
            onAdd={handleAddSlide}
            onRenameSlide={handleRenameSlide}
            onRenameGroup={handleRenameGroup}
            onAssignGroup={handleAssignSlideGroup}
            onBulkDelete={(ids) => {
              if (!proposal) return;
              const idSet = new Set(ids);
              updateLocal({ slides: proposal.slides.filter((s) => !idSet.has(s.id)) });
              if (selectedSlideId && idSet.has(selectedSlideId)) {
                setSelectedSlideId(null);
              }
            }}
            onBulkToggle={(ids, enabled) => {
              if (!proposal) return;
              const idSet = new Set(ids);
              updateLocal({
                slides: proposal.slides.map((s) => idSet.has(s.id) ? { ...s, enabled } : s),
              });
            }}
          />
        </div>

        {proposal.slides.length === 0 ? (
          <div className="flex-1 min-w-0 flex items-center justify-center bg-admin px-6">
            <div className="w-full max-w-md rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <AppIcon icon="slide.type.title" size={24} />
              </div>
              <h3 className="font-brand-serif text-base text-gray-900">Add your first slide to start</h3>
              <p className="mt-1.5 text-sm text-[#6b6b6b]">
                Build your presentation by adding a first slide, then customize content and order from the sidebar.
              </p>
              <Button
                type="button"
                onClick={() => handleAddSlide('title')}
                className="mt-5 inline-flex items-center gap-2"
              >
                <AppIcon icon="ui.add" className="h-3.5 w-3.5" />
                Add slide
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0 grid grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] overflow-hidden">
            {/* Preview panel */}
            {editorValues.preview.showPanel && <div className="relative overflow-hidden bg-admin">
              <div className="h-full w-full max-w-[66rem] mx-auto border-x border-gray-100 bg-admin flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</span>
                  <div className="flex items-center gap-1.5">
                    <SegmentedTabs
                      value={previewDevice}
                      onValueChange={setPreviewDevice}
                      className="h-7"
                      tabClassName="h-6 w-6 px-0"
                      indicatorLayoutId="proposal-editor-preview-device-tabs"
                      options={[
                        {
                          value: 'desktop',
                          label: (
                            <>
                              <AppIcon icon="ui.computer" className="h-3.5 w-3.5" />
                              <span className="sr-only">Desktop preview</span>
                            </>
                          ),
                        },
                        {
                          value: 'mobile',
                          label: (
                            <>
                              <AppIcon icon="ui.smart-phone-02" className="h-3.5 w-3.5" />
                              <span className="sr-only">Mobile preview</span>
                            </>
                          ),
                        },
                      ]}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const iframe = previewIframeRef.current;
                        if (!iframe) return;
                        const frameWindow = iframe.contentWindow;
                        if (frameWindow) {
                          frameWindow.location.reload();
                          return;
                        }
                        iframe.src = iframe.src;
                      }}
                      className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Refresh preview"
                    >
                      <AppIcon icon="ui.refresh" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="px-4 py-2 border-b border-gray-100 flex-shrink-0 flex items-center justify-center gap-2">
                  <AnimatePresence mode="wait">
                    {saveState === 'saving' && (
                      <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-xs text-gray-400 flex items-center gap-1.5">
                        <span className="w-3 h-3 border border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                        Saving…
                      </motion.span>
                    )}
                    {saveState === 'saved' && (
                      <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-xs text-green-500 flex items-center gap-1">
                        <AppIcon icon="ui.check" className="w-3 h-3" />
                        Saved
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {proposal.updatedAt && (
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      Updated {formatRelativeTime(proposal.updatedAt)}
                    </span>
                  )}
                  {lastEditedByLabel && (
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      by {lastEditedByLabel}
                    </span>
                  )}
                </div>
                <div className="relative flex-1 overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    {selectedSlide && selectedSlide.enabled ? (
                      <motion.div
                        key="preview-enabled"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="absolute inset-0 overflow-auto admin-scroll p-2.5 flex flex-col gap-2"
                      >
                        <div
                          className={`${PREVIEW_CONTENT_WIDTH_CLASS} ${previewMaxWidthClassName} ${previewFrameAspectClassName} mx-auto relative rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm group cursor-pointer`}
                          onClick={() => window.open(`/p/${proposal.slug}#preview`, '_blank')}
                        >
                          <iframe
                            ref={previewIframeRef}
                            src={`/p/${proposal.slug}#preview`}
                            onLoad={() => {
                              sendPreviewMessage(proposal, selectedSlideId);
                              setTimeout(() => sendPreviewMessage(proposal, selectedSlideId), 300);
                            }}
                            className="absolute inset-0 border-0 pointer-events-none [transition:filter_0.3s_ease] group-hover:[filter:blur(2px)]"
                            style={{
                              width: `${previewScaleInverse * 100}%`,
                              height: `${previewScaleInverse * 100}%`,
                              transform: `scale(${previewScale})`,
                              transformOrigin: 'top left',
                            }}
                            title="Slide preview"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <span className="bg-white/90 text-gray-800 text-xs font-medium px-4 py-2 rounded-full shadow-md border border-gray-200">
                              Open full preview
                            </span>
                          </div>
                        </div>
                        <div className={`${PREVIEW_CONTENT_WIDTH_CLASS} ${previewMaxWidthClassName} mx-auto flex items-center justify-between gap-2 px-1`}>
                          <Button
                            type="button"
                            onClick={handleGoToPrevSlide}
                            disabled={!hasPrevSlide}
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-[11px] text-gray-600"
                          >
                            <AppIcon icon="ui.sidebar-toggle" className="h-3 w-3" />
                            Previous
                          </Button>
                          <Button
                            type="button"
                            onClick={handleGoToNextSlide}
                            disabled={!hasNextSlide}
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-[11px] text-gray-600"
                          >
                            Next
                            <AppIcon icon="ui.chevron-right" className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="preview-empty"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <p className="text-xs text-gray-400">No preview available</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>}

            {/* Configurator — right panel */}
            <div className="flex-1 min-w-0 overflow-y-auto admin-scroll border-l border-gray-100">
              <div className="max-w-lg mx-auto px-3 py-3">
              {selectedSlide ? (
                <SlideConfigurator
                  slide={selectedSlide}
                  onChange={(updates) => updateSlide(selectedSlide.id, updates)}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center">
                  <div className="mb-3 flex justify-center text-gray-300">
                    <AppIcon icon="ui.home" size={28} />
                  </div>
                  <p className="text-sm text-gray-400">Select a slide to configure it</p>
                </div>
              )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>

    <MarkdownIngestorModal
      isOpen={ingestor.isOpen}
      mode={ingestor.mode}
      editorContent={ingestor.editorContent}
      onContentChange={ingestor.setEditorContent}
      onCursorChange={ingestor.setCursorPosition}
      onGenerate={handleMarkdownImport}
      onClose={ingestor.close}
    />

    {proposal && (
      <ProposalMarkdownEditorModal
        isOpen={markdownEditorOpen}
        proposal={proposal}
        onApply={handleMarkdownApply}
        onClose={() => setMarkdownEditorOpen(false)}
      />
    )}

    {proposal && (
      <PublishSuccessModal
        isOpen={showPublishSuccess}
        proposalUrl={`${window.location.origin}/p/${proposal.slug}`}
        shortCode={proposal.shortCode}
        partnerName={proposal.partnerName}
        proposalTitle={proposal.title}
        onClose={() => setShowPublishSuccess(false)}
      />
    )}

    <Dialog
      open={showPublishConfirm}
      onOpenChange={(open) => {
        if (publishing) return;
        setShowPublishConfirm(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-brand-serif">Publish proposal?</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-[#6b6b6b]">
            Choose how people can access this proposal once it is published.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {proposal && (() => {
            const issues = checkProposalReadiness(proposal);
            return issues.length > 0 ? (
              <ReadinessCheckDisplay
                issues={issues}
                onClickSlide={(idx) => {
                  const slide = proposal.slides[idx];
                  if (slide) {
                    setSelectedSlideId(slide.id);
                    setShowPublishConfirm(false);
                  }
                }}
              />
            ) : (
              <ReadinessCheckDisplay issues={[]} />
            );
          })()}
          <div className="space-y-2">
            {([
              { value: 'public', label: 'Public', desc: 'Anyone with the link can view.' },
              { value: 'password', label: 'Private (password protected)', desc: 'Viewers must enter a password.' },
              { value: 'email_gated', label: 'Email gate', desc: 'Viewers submit their email to access.' },
            ] as const).map((opt) => (
              <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="publish-visibility"
                  value={opt.value}
                  checked={publishVisibility === opt.value}
                  onChange={() => setPublishVisibility(opt.value)}
                  className="mt-0.5 accent-gray-900"
                />
                <div>
                  <span className="text-sm text-gray-800">{opt.label}</span>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {publishVisibility === 'password' && (
            <div className="pl-6">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                {proposal.accessPassword ? 'Update password (optional)' : 'Set password'}
              </label>
              <Input
                type="password"
                value={publishPasswordInput}
                onChange={(e) => setPublishPasswordInput(e.target.value)}
                placeholder={proposal.accessPassword ? 'Leave blank to keep current password' : 'Enter password'}
                className="text-sm"
              />
              {proposal.accessPassword && (
                <p className="mt-1 text-xs text-gray-400">A password is already set for this proposal.</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPublishConfirm(false)}
            disabled={publishing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirmPublish}
            disabled={publishing || (publishVisibility === 'password' && !proposal.accessPassword && !publishPasswordInput.trim())}
            className="inline-flex items-center gap-2"
          >
            {publishing ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={showSaveTemplate} onOpenChange={(open) => { if (!savingTemplate) setShowSaveTemplate(open); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-brand-serif">Save as template</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-[#6b6b6b]">
            Save the current slides as a reusable template for future proposals.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Template name</label>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g. Agency pitch"
            maxLength={60}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveAsTemplate(); } }}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowSaveTemplate(false)}
            disabled={savingTemplate}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSaveAsTemplate}
            disabled={savingTemplate || !templateName.trim()}
            className="inline-flex items-center gap-2"
          >
            {savingTemplate ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            Save template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={showUnpublishConfirm} onOpenChange={setShowUnpublishConfirm}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-brand-serif">Unpublish proposal?</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-[#6b6b6b]">
            If this proposal is unpublished, it will no longer be available to anyone who currently has access to it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowUnpublishConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirmUnpublish}
          >
            Unpublish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
