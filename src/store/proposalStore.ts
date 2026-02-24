import { create } from 'zustand';
import type {
  BrandOverrides,
  Proposal,
  ProposalAccessGrant,
  ProposalAccessMeta,
  ProposalVersion,
  SlideConfig,
} from '../types/proposal';
import { supabase } from '../supabaseClient';
import { generateShortCode, generateSlug } from '../shared/utils/helpers';
import { useAuthStore } from './authStore';
import { useWorkspaceStore } from './workspaceStore';
import { defaultThemeId, isValidThemeId } from '../themes/themeDefinitions';
import type { ThemeId } from '../themes/themeTypes';
import { normalizeSlidesIconIds } from '../shared/icons/iconMigration';
import { generateSafeSlug, sanitizeText, validateUrl } from '../shared/utils/validation';
import { appendErrorDiagnostic, logStructuredError } from '../shared/utils/errorHandling';
import type { WorkspaceBrandTheme } from '../types/workspace';
import { isDemoProposal } from '../data/demoProposal';

interface ProposalStore {
  proposals: Proposal[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  fetchProposals: () => Promise<void>;
  createProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>) => Promise<Proposal | null>;
  updateProposal: (id: string, updates: Partial<Proposal>) => Promise<void>;
  fetchVersions: (proposalId: string) => Promise<ProposalVersion[]>;
  saveVersion: (
    proposalId: string,
    snapshot?: Pick<Proposal, 'title' | 'partnerName' | 'slides' | 'themeId' | 'brandOverrides'>,
  ) => Promise<ProposalVersion | null>;
  restoreVersion: (
    proposalId: string,
    versionId: string,
    currentSnapshot?: Pick<Proposal, 'title' | 'partnerName' | 'slides' | 'themeId' | 'brandOverrides'>,
  ) => Promise<Pick<Proposal, 'title' | 'partnerName' | 'slides' | 'themeId' | 'brandOverrides'> | null>;
  deleteProposal: (id: string) => Promise<boolean>;
  duplicateProposal: (id: string) => Promise<Proposal | null>;
  getProposalMetaBySlug: (slug: string) => Promise<ProposalAccessMeta | null>;
  getProposalMetaByShortCode: (shortCode: string) => Promise<ProposalAccessMeta | null>;
  getProposalContentBySlug: (slug: string, accessToken?: string) => Promise<Proposal | null>;
  verifyProposalPassword: (proposalId: string, password: string) => Promise<ProposalAccessGrant | null>;
  verifyProposalEmail: (proposalId: string, email: string) => Promise<ProposalAccessGrant | null>;
  getProposalBySlug: (slug: string) => Promise<Proposal | null>;
  getProposalByShortCode: (shortCode: string) => Promise<Proposal | null>;
  getOwnProposalBySlug: (slug: string) => Promise<Proposal | null>;
  createFromMarkdown: (
    markdown: string,
    frontmatter: { title?: string; partner?: string; date?: string; theme?: string },
    slides: SlideConfig[],
  ) => Promise<Proposal | null>;
  importMarkdownToProposal: (
    proposalId: string,
    slides: SlideConfig[],
    mode: 'append' | 'replace',
  ) => Promise<void>;
}

function resolveThemeId(row: Record<string, unknown>): ThemeId {
  const rawThemeId = row.theme_id;
  if (isValidThemeId(rawThemeId)) return rawThemeId;
  return defaultThemeId;
}

function dbRowToProposal(row: Record<string, unknown>): Proposal {
  const slides = normalizeSlidesIconIds(((row.slides as Proposal['slides']) || []));

  return {
    id: row.id as string,
    workspace_id: row.workspace_id as string,
    slug: row.slug as string,
    shortCode: row.short_code as string | undefined,
    title: row.title as string,
    partnerName: row.partner_name as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    updatedBy: row.updated_by as string | undefined,
    status: row.status as 'draft' | 'published',
    slides,
    themeId: resolveThemeId(row),
    visibility: (row.visibility as Proposal['visibility']) || 'public',
    accessPassword: row.access_password as string | undefined,
    expiresAt: row.expires_at as string | undefined,
    brandOverrides: (row.brand_overrides as BrandOverrides) || {},
    workspaceBrandTheme:
      (row.workspace_brand_theme as WorkspaceBrandTheme | undefined)
      ?? (row.workspaceBrandTheme as WorkspaceBrandTheme | undefined),
  };
}

const MAX_PROPOSAL_VERSIONS = 8;

function dbRowToProposalVersion(row: Record<string, unknown>): ProposalVersion {
  return {
    id: row.id as string,
    proposalId: row.proposal_id as string,
    versionNumber: row.version_number as number,
    title: row.title as string,
    partnerName: row.partner_name as string,
    slides: normalizeSlidesIconIds(((row.slides as Proposal['slides']) || [])),
    themeId: resolveThemeId(row),
    brandOverrides: (row.brand_overrides as BrandOverrides) || {},
    createdBy: row.created_by as string | undefined,
    createdAt: row.created_at as string,
  };
}

function mapMetaRowToProposalAccessMeta(row: Record<string, unknown>): ProposalAccessMeta {
  return {
    id: row.id as string,
    slug: row.slug as string,
    shortCode: row.shortCode as string | undefined,
    title: row.title as string,
    partnerName: row.partnerName as string,
    status: row.status as ProposalAccessMeta['status'],
    visibility: (row.visibility as Proposal['visibility']) ?? 'public',
    expiresAt: row.expiresAt as string | undefined,
    themeId: isValidThemeId(row.themeId) ? row.themeId : defaultThemeId,
  };
}

const GENERIC_FETCH_ERROR = 'Failed to load proposals. Please try again.';
const GENERIC_SAVE_ERROR = 'Failed to save proposal. Please try again.';
const GENERIC_DELETE_ERROR = 'Failed to delete proposal. Please try again.';
const FOOTER_BRANDING_ALLOWED_EMAIL = 'lipefxo@gmail.com';

function getSafeErrorMessage(error: unknown, fallback: string): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === '23505') {
    return appendErrorDiagnostic('A proposal with this URL already exists. Try a different name.', error);
  }
  if (code === '42501') {
    return appendErrorDiagnostic('Your session is no longer valid. Please sign in again.', error);
  }
  if (code === '42703') {
    return appendErrorDiagnostic('Database schema is out of date. Please run the latest Supabase migrations.', error);
  }
  if (code === 'PGRST204') {
    return appendErrorDiagnostic('Database schema cache is missing expected columns. Please refresh migrations/schema.', error);
  }

  return appendErrorDiagnostic(fallback, error);
}


function sanitizeUnknown(value: unknown, key = ''): unknown {
  if (typeof value === 'string') {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'imageposition') {
      return value === 'left' || value === 'right' ? value : 'right';
    }
    if (lowerKey === 'imagelayout') {
      return (
        value === 'constrained'
        || value === 'split'
        || value === 'full-width-top'
        || value === 'full-width-middle'
        || value === 'full-width-bottom'
      )
        ? value
        : 'constrained';
    }
    if (lowerKey === 'imageenabled') {
      return value === 'true';
    }
    if (lowerKey.includes('url') || lowerKey.includes('image') || lowerKey.includes('logo') || lowerKey === 'src') {
      const validated = validateUrl(value);
      return validated.isValid ? validated.value : '';
    }
    return sanitizeText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUnknown(item, key));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeUnknown(entryValue, entryKey),
      ]),
    );
  }

  return value;
}

function sanitizeSlides(slides: SlideConfig[]): SlideConfig[] {
  return slides.map((slide) => ({
    ...slide,
    content: sanitizeUnknown(slide.content) as SlideConfig['content'],
  }));
}

function getCurrentWorkspaceId(): string | null {
  return useWorkspaceStore.getState().currentWorkspace?.id ?? null;
}

function getCurrentUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

function getCurrentUserEmail(): string | null {
  return useAuthStore.getState().user?.email?.toLowerCase() ?? null;
}

function normalizeShortCode(shortCode: string): string {
  return shortCode.trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
}

export const useProposalStore = create<ProposalStore>((set, get) => ({
  proposals: [],
  loading: false,
  error: null,
  clearError: () => set({ error: null }),

  fetchProposals: async () => {
    const currentWorkspaceId = getCurrentWorkspaceId();
    if (!currentWorkspaceId) {
      set({ proposals: [], loading: false });
      return;
    }
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('workspace_id', currentWorkspaceId)
      .order('created_at', { ascending: false });
    if (error) {
      logStructuredError('fetchProposals failed', error);
      set({ error: getSafeErrorMessage(error, GENERIC_FETCH_ERROR), loading: false });
      return;
    }
    set({ proposals: (data || []).map(dbRowToProposal), loading: false });
  },

  createProposal: async (proposal) => {
    set({ error: null });
    const currentWorkspaceId = getCurrentWorkspaceId();
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      set({ error: 'You must be signed in to create proposals.' });
      return null;
    }
    if (!currentWorkspaceId || currentWorkspaceId !== proposal.workspace_id) {
      set({ error: 'Unauthorized: cannot create proposal for another workspace.' });
      return null;
    }

    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count, error: rateLimitError } = await supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspaceId)
      .gte('created_at', oneHourAgo);

    if (rateLimitError) {
      logStructuredError('createProposal rate-limit check failed', rateLimitError);
      set({ error: getSafeErrorMessage(rateLimitError, GENERIC_SAVE_ERROR) });
      return null;
    }

    if ((count ?? 0) >= 20) {
      set({ error: 'Rate limit: too many proposals created. Try again later.' });
      return null;
    }

    const normalizedSlides = normalizeSlidesIconIds(sanitizeSlides(proposal.slides));
    const safeTitle = sanitizeText(proposal.title);
    const safePartnerName = sanitizeText(proposal.partnerName);
    const safeSlug = generateSafeSlug(proposal.slug);
    const safeShortCode = normalizeShortCode(proposal.shortCode ?? generateShortCode());

    const currentWorkspaceBrandTheme = useWorkspaceStore.getState().currentWorkspace?.brandTheme;
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        user_id: currentUserId,
        updated_by: currentUserId,
        workspace_id: proposal.workspace_id,
        slug: safeSlug,
        short_code: safeShortCode,
        title: safeTitle,
        partner_name: safePartnerName,
        status: proposal.status,
        slides: normalizedSlides,
        theme_id: proposal.themeId,
        ...(currentWorkspaceBrandTheme ? { workspace_brand_theme: currentWorkspaceBrandTheme } : {}),
      })
      .select()
      .single();
    if (error) {
      logStructuredError('createProposal failed', error);
      set({ error: getSafeErrorMessage(error, GENERIC_SAVE_ERROR) });
      return null;
    }
    const newProposal = dbRowToProposal(data);
    set((state) => ({ proposals: [newProposal, ...state.proposals] }));
    return newProposal;
  },

  updateProposal: async (id, updates) => {
    if (isDemoProposal(id)) {
      set({ error: 'The demo proposal is read-only and cannot be edited.' });
      throw new Error('The demo proposal is read-only and cannot be edited.');
    }

    const currentWorkspaceId = getCurrentWorkspaceId();
    const currentUserId = getCurrentUserId();
    const currentUserEmail = getCurrentUserEmail();
    const existingProposal = get().proposals.find((proposal) => proposal.id === id);
    if (!existingProposal || !currentWorkspaceId || existingProposal.workspace_id !== currentWorkspaceId) {
      set({ error: 'Unauthorized: cannot update proposal outside your workspace.' });
      throw new Error('Unauthorized: cannot update proposal outside your workspace.');
    }

    const sanitizedUpdates: Partial<Proposal> = {
      ...updates,
      ...(updates.title !== undefined && { title: sanitizeText(updates.title) }),
      ...(updates.partnerName !== undefined && { partnerName: sanitizeText(updates.partnerName) }),
      ...(updates.slug !== undefined && { slug: generateSafeSlug(updates.slug) }),
      ...(updates.slides && { slides: normalizeSlidesIconIds(sanitizeSlides(updates.slides)) }),
      ...(currentUserId ? { updatedBy: currentUserId } : {}),
    };

    if (sanitizedUpdates.brandOverrides && currentUserEmail !== FOOTER_BRANDING_ALLOWED_EMAIL) {
      const safeBrandOverrides = { ...sanitizedUpdates.brandOverrides };
      delete safeBrandOverrides.showFooterBranding;
      sanitizedUpdates.brandOverrides = safeBrandOverrides;
    }

    const previousProposals = get().proposals;
    set((state) => ({
      proposals: state.proposals.map((p) =>
        p.id === id ? { ...p, ...sanitizedUpdates } : p
      ),
    }));

    const dbUpdates: Record<string, unknown> = {};
    if (sanitizedUpdates.title !== undefined) dbUpdates.title = sanitizedUpdates.title;
    if (sanitizedUpdates.partnerName !== undefined) dbUpdates.partner_name = sanitizedUpdates.partnerName;
    if (sanitizedUpdates.slug !== undefined) dbUpdates.slug = sanitizedUpdates.slug;
    if (sanitizedUpdates.status !== undefined) dbUpdates.status = sanitizedUpdates.status;
    if (sanitizedUpdates.slides !== undefined) dbUpdates.slides = sanitizedUpdates.slides;
    if (sanitizedUpdates.themeId !== undefined) dbUpdates.theme_id = sanitizedUpdates.themeId;
    if (sanitizedUpdates.visibility !== undefined) dbUpdates.visibility = sanitizedUpdates.visibility;
    if (sanitizedUpdates.accessPassword !== undefined) dbUpdates.access_password = sanitizedUpdates.accessPassword;
    if (sanitizedUpdates.expiresAt !== undefined) dbUpdates.expires_at = sanitizedUpdates.expiresAt;
    if (sanitizedUpdates.brandOverrides !== undefined) dbUpdates.brand_overrides = sanitizedUpdates.brandOverrides;
    if (currentUserId) dbUpdates.updated_by = currentUserId;

    const { data: updatedRows, error } = await supabase
      .from('proposals')
      .update(dbUpdates)
      .eq('id', id)
      .select('id');
    if (error) {
      logStructuredError('updateProposal failed', error);
      set({ error: getSafeErrorMessage(error, GENERIC_SAVE_ERROR), proposals: previousProposals });
      throw error;
    }
    if (!updatedRows || updatedRows.length === 0) {
      const noMatchError = new Error(
        'Update had no effect — the proposal may belong to a different workspace or your session has expired.',
      );
      logStructuredError('updateProposal affected 0 rows', { id, dbUpdates });
      set({ error: noMatchError.message, proposals: previousProposals });
      throw noMatchError;
    }
  },

  fetchVersions: async (proposalId) => {
    const currentWorkspaceId = getCurrentWorkspaceId();
    const existingProposal = get().proposals.find((proposal) => proposal.id === proposalId);
    if (!existingProposal || !currentWorkspaceId || existingProposal.workspace_id !== currentWorkspaceId) {
      set({ error: 'Unauthorized: cannot access versions outside your workspace.' });
      return [];
    }

    const { data, error } = await supabase
      .from('proposal_versions')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('version_number', { ascending: false });

    if (error) {
      logStructuredError('fetchVersions failed', error);
      set({ error: getSafeErrorMessage(error, GENERIC_FETCH_ERROR) });
      return [];
    }

    return (data ?? []).map((row) => dbRowToProposalVersion(row as Record<string, unknown>));
  },

  saveVersion: async (proposalId, snapshot) => {
    const currentWorkspaceId = getCurrentWorkspaceId();
    const currentUserId = getCurrentUserId();
    const existingProposal = get().proposals.find((proposal) => proposal.id === proposalId);
    if (!existingProposal || !currentWorkspaceId || existingProposal.workspace_id !== currentWorkspaceId) {
      set({ error: 'Unauthorized: cannot save version outside your workspace.' });
      return null;
    }

    const source = snapshot ?? {
      title: existingProposal.title,
      partnerName: existingProposal.partnerName,
      slides: existingProposal.slides,
      themeId: existingProposal.themeId,
      brandOverrides: existingProposal.brandOverrides,
    };

    const normalizedSlides = normalizeSlidesIconIds(sanitizeSlides(source.slides));
    const { data: latestVersionRows, error: latestVersionError } = await supabase
      .from('proposal_versions')
      .select('version_number')
      .eq('proposal_id', proposalId)
      .order('version_number', { ascending: false })
      .limit(1);

    if (latestVersionError) {
      logStructuredError('saveVersion latest-version query failed', latestVersionError);
      set({ error: getSafeErrorMessage(latestVersionError, GENERIC_SAVE_ERROR) });
      return null;
    }

    const nextVersionNumber = ((latestVersionRows?.[0] as { version_number?: number } | undefined)?.version_number ?? 0) + 1;

    const { data: insertedVersion, error: insertError } = await supabase
      .from('proposal_versions')
      .insert({
        proposal_id: proposalId,
        version_number: nextVersionNumber,
        title: sanitizeText(source.title),
        partner_name: sanitizeText(source.partnerName),
        slides: normalizedSlides,
        theme_id: source.themeId,
        brand_overrides: source.brandOverrides ?? {},
        created_by: currentUserId,
      })
      .select('*')
      .single();

    if (insertError || !insertedVersion) {
      logStructuredError('saveVersion insert failed', insertError);
      set({ error: getSafeErrorMessage(insertError, GENERIC_SAVE_ERROR) });
      return null;
    }

    const { data: allVersionRows, error: pruneLookupError } = await supabase
      .from('proposal_versions')
      .select('id')
      .eq('proposal_id', proposalId)
      .order('version_number', { ascending: false });

    if (pruneLookupError) {
      logStructuredError('saveVersion prune lookup failed', pruneLookupError);
      set({ error: getSafeErrorMessage(pruneLookupError, GENERIC_SAVE_ERROR) });
      return dbRowToProposalVersion(insertedVersion as Record<string, unknown>);
    }

    const idsToDelete = (allVersionRows ?? []).slice(MAX_PROPOSAL_VERSIONS).map((row) => row.id as string);
    if (idsToDelete.length > 0) {
      const { error: pruneError } = await supabase
        .from('proposal_versions')
        .delete()
        .in('id', idsToDelete);

      if (pruneError) {
        logStructuredError('saveVersion prune failed', pruneError);
        set({ error: getSafeErrorMessage(pruneError, GENERIC_SAVE_ERROR) });
      }
    }

    return dbRowToProposalVersion(insertedVersion as Record<string, unknown>);
  },

  restoreVersion: async (proposalId, versionId, currentSnapshot) => {
    const currentWorkspaceId = getCurrentWorkspaceId();
    const existingProposal = get().proposals.find((proposal) => proposal.id === proposalId);
    if (!existingProposal || !currentWorkspaceId || existingProposal.workspace_id !== currentWorkspaceId) {
      set({ error: 'Unauthorized: cannot restore version outside your workspace.' });
      return null;
    }

    const checkpointSnapshot = currentSnapshot ?? {
      title: existingProposal.title,
      partnerName: existingProposal.partnerName,
      slides: existingProposal.slides,
      themeId: existingProposal.themeId,
      brandOverrides: existingProposal.brandOverrides,
    };
    const checkpoint = await get().saveVersion(proposalId, checkpointSnapshot);
    if (!checkpoint) {
      set({ error: 'Failed to create safety checkpoint before restore.' });
      return null;
    }

    const { data: versionRow, error } = await supabase
      .from('proposal_versions')
      .select('*')
      .eq('id', versionId)
      .eq('proposal_id', proposalId)
      .maybeSingle();

    if (error || !versionRow) {
      logStructuredError('restoreVersion failed', error);
      set({ error: getSafeErrorMessage(error, GENERIC_FETCH_ERROR) });
      return null;
    }

    const version = dbRowToProposalVersion(versionRow as Record<string, unknown>);
    return {
      title: version.title,
      partnerName: version.partnerName,
      slides: version.slides,
      themeId: version.themeId,
      brandOverrides: version.brandOverrides ?? {},
    };
  },

  deleteProposal: async (id) => {
    if (isDemoProposal(id)) {
      set({ error: 'The demo proposal is read-only and cannot be deleted.' });
      return false;
    }

    const currentWorkspaceId = getCurrentWorkspaceId();
    const existingProposal = get().proposals.find((proposal) => proposal.id === id);
    if (!existingProposal || !currentWorkspaceId || existingProposal.workspace_id !== currentWorkspaceId) {
      set({ error: 'Unauthorized: cannot delete proposal outside your workspace.' });
      return false;
    }

    const { error } = await supabase.from('proposals').delete().eq('id', id);
    if (error) {
      logStructuredError('deleteProposal failed', error);
      set({ error: getSafeErrorMessage(error, GENERIC_DELETE_ERROR) });
      return false;
    }
    set((state) => ({
      proposals: state.proposals.filter((p) => p.id !== id),
    }));
    return true;
  },

  duplicateProposal: async (id) => {
    if (isDemoProposal(id)) {
      set({ error: 'The demo proposal cannot be duplicated.' });
      return null;
    }

    const existing = get().proposals.find((p) => p.id === id);
    if (!existing) return null;
    const currentWorkspaceId = getCurrentWorkspaceId();
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return null;
    if (!currentWorkspaceId || existing.workspace_id !== currentWorkspaceId) return null;

    const newSlug = generateSafeSlug(generateSlug(`${existing.partnerName}-copy`));
    const newShortCode = normalizeShortCode(generateShortCode());
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        user_id: currentUserId,
        updated_by: currentUserId,
        workspace_id: currentWorkspaceId,
        slug: newSlug,
        short_code: newShortCode,
        title: `${existing.title} (Copy)`,
        partner_name: existing.partnerName,
        status: 'draft',
        slides: existing.slides,
        theme_id: existing.themeId,
        brand_overrides: existing.brandOverrides ?? {},
        visibility: 'public',
      })
      .select()
      .single();

    if (error || !data) {
      logStructuredError('duplicateProposal failed', error);
      set({ error: getSafeErrorMessage(error, GENERIC_SAVE_ERROR) });
      return null;
    }
    const newProposal = dbRowToProposal(data);
    set((state) => ({ proposals: [newProposal, ...state.proposals] }));
    return newProposal;
  },

  getProposalMetaBySlug: async (slug) => {
    const safeSlug = generateSafeSlug(slug);
    if (!safeSlug) return null;

    // Try edge function first (handles all visibility types via service role).
    const { data, error } = await supabase.functions.invoke('proposal-meta', {
      body: { slug: safeSlug },
    });
    if (!error && data?.proposal) {
      return mapMetaRowToProposalAccessMeta(data.proposal as Record<string, unknown>);
    }

    // Direct query fallback — works for public published proposals via RLS.
    const { data: row } = await supabase
      .from('proposals')
      .select('id, slug, short_code, title, partner_name, status, visibility, expires_at, theme_id')
      .eq('slug', safeSlug)
      .eq('status', 'published')
      .maybeSingle();
    if (!row) return null;
    return mapMetaRowToProposalAccessMeta({
      id: row.id,
      slug: row.slug,
      shortCode: row.short_code,
      title: row.title,
      partnerName: row.partner_name,
      status: row.status,
      visibility: row.visibility,
      expiresAt: row.expires_at,
      themeId: row.theme_id,
    });
  },

  getProposalMetaByShortCode: async (shortCode) => {
    const safeShortCode = normalizeShortCode(shortCode);
    if (!safeShortCode) return null;

    const { data, error } = await supabase.functions.invoke('proposal-meta', {
      body: { shortCode: safeShortCode },
    });
    if (!error && data?.proposal) {
      return mapMetaRowToProposalAccessMeta(data.proposal as Record<string, unknown>);
    }

    const { data: row } = await supabase
      .from('proposals')
      .select('id, slug, short_code, title, partner_name, status, visibility, expires_at, theme_id')
      .eq('short_code', safeShortCode)
      .eq('status', 'published')
      .maybeSingle();
    if (!row) return null;
    return mapMetaRowToProposalAccessMeta({
      id: row.id,
      slug: row.slug,
      shortCode: row.short_code,
      title: row.title,
      partnerName: row.partner_name,
      status: row.status,
      visibility: row.visibility,
      expiresAt: row.expires_at,
      themeId: row.theme_id,
    });
  },

  getProposalContentBySlug: async (slug, accessToken) => {
    const safeSlug = generateSafeSlug(slug);
    if (!safeSlug) return null;

    // Try edge function first (handles gated access, workspace member bypass, etc.).
    const { data, error } = await supabase.functions.invoke('proposal-content', {
      body: { slug: safeSlug, accessToken: accessToken?.trim() || undefined },
    });
    if (!error && data?.proposal) {
      return dbRowToProposal(data.proposal as Record<string, unknown>);
    }

    // Direct query fallback — only works for public published proposals via RLS.
    // Gated proposals (password/email) still require the edge function.
    if (!accessToken) {
      const { data: row } = await supabase
        .from('proposals')
        .select('*')
        .eq('slug', safeSlug)
        .eq('status', 'published')
        .maybeSingle();
      if (row) return dbRowToProposal(row as Record<string, unknown>);
    }

    return null;
  },

  verifyProposalPassword: async (proposalId, password) => {
    const proposalIdValue = proposalId.trim();
    if (!proposalIdValue || !password.trim()) return null;

    const { data, error } = await supabase.functions.invoke('proposal-verify-password', {
      body: { proposalId: proposalIdValue, password },
    });
    if (error || !data?.token || !data?.expiresAt) return null;
    return {
      token: data.token as string,
      expiresAt: data.expiresAt as string,
    };
  },

  verifyProposalEmail: async (proposalId, email) => {
    const proposalIdValue = proposalId.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!proposalIdValue || !normalizedEmail) return null;

    const { data, error } = await supabase.functions.invoke('proposal-verify-email', {
      body: { proposalId: proposalIdValue, email: normalizedEmail },
    });
    if (error || !data?.token || !data?.expiresAt) return null;
    return {
      token: data.token as string,
      expiresAt: data.expiresAt as string,
    };
  },

  getProposalBySlug: async (slug) => {
    return get().getProposalContentBySlug(slug);
  },

  getProposalByShortCode: async (shortCode) => {
    const meta = await get().getProposalMetaByShortCode(shortCode);
    if (!meta?.slug) return null;
    return get().getProposalContentBySlug(meta.slug);
  },

  getOwnProposalBySlug: async (slug) => {
    const currentWorkspaceId = getCurrentWorkspaceId();
    if (!currentWorkspaceId) return null;

    const safeSlug = generateSafeSlug(slug);
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('slug', safeSlug)
      .eq('workspace_id', currentWorkspaceId)
      .single();

    if (error || !data) return null;
    return dbRowToProposal(data);
  },

  createFromMarkdown: async (_markdown, frontmatter, slides) => {
    set({ error: null });
    const workspaceId = getCurrentWorkspaceId();
    const currentUserId = getCurrentUserId();
    if (!workspaceId || !currentUserId) return null;

    const partnerName = sanitizeText(frontmatter.partner || 'Untitled Partner');
    const title = sanitizeText(frontmatter.title || `${partnerName} Proposal`);
    const themeId = isValidThemeId(frontmatter.theme) ? frontmatter.theme : defaultThemeId;

    const normalizedSlides = normalizeSlidesIconIds(sanitizeSlides(slides));

    const proposalBase: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'> = {
      workspace_id: workspaceId,
      slug: generateSafeSlug(generateSlug(partnerName)),
      shortCode: normalizeShortCode(generateShortCode()),
      title,
      partnerName,
      status: 'draft',
      slides: normalizedSlides,
      themeId,
    };

    let proposal = proposalBase;
    let lastError: { code?: string; message?: string } | null = null;
    let insertedRow: Record<string, unknown> | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          user_id: currentUserId,
          updated_by: currentUserId,
          workspace_id: proposal.workspace_id,
          slug: proposal.slug,
          short_code: proposal.shortCode,
          title: proposal.title,
          partner_name: proposal.partnerName,
          status: proposal.status,
          slides: proposal.slides,
          theme_id: proposal.themeId,
        })
        .select()
        .single();

      if (!error && data) {
        insertedRow = data;
        break;
      }

      lastError = error;

      if (error?.code === '23505') {
        proposal = {
          ...proposal,
          slug: generateSafeSlug(generateSlug(`${partnerName}-${Math.random().toString(36).slice(2, 4)}`)),
          shortCode: normalizeShortCode(generateShortCode()),
        };
        continue;
      }

      break;
    }

    if (!insertedRow) {
      logStructuredError('createFromMarkdown failed', lastError);
      set({ error: getSafeErrorMessage(lastError, GENERIC_SAVE_ERROR) });
      return null;
    }

    const newProposal = dbRowToProposal(insertedRow);
    set((state) => ({ proposals: [newProposal, ...state.proposals] }));
    return newProposal;
  },

  importMarkdownToProposal: async (proposalId, newSlides, mode) => {
    const currentWorkspaceId = getCurrentWorkspaceId();
    const existing = get().proposals.find((p) => p.id === proposalId);
    if (!existing || !currentWorkspaceId || existing.workspace_id !== currentWorkspaceId) {
      set({ error: 'Unauthorized: cannot update proposal outside your workspace.' });
      return;
    }

    const normalizedNewSlides = normalizeSlidesIconIds(sanitizeSlides(newSlides));
    const updatedSlides =
      mode === 'replace'
        ? normalizedNewSlides
        : [...(existing?.slides ?? []), ...normalizedNewSlides];

    const currentUserId = getCurrentUserId();
    const { error } = await supabase
      .from('proposals')
      .update({ slides: updatedSlides, ...(currentUserId ? { updated_by: currentUserId } : {}) })
      .eq('id', proposalId);

    if (error) {
      logStructuredError('importMarkdownToProposal failed', error);
      set({ error: getSafeErrorMessage(error, GENERIC_SAVE_ERROR) });
      return;
    }

    set((state) => ({
      proposals: state.proposals.map((p) =>
        p.id === proposalId ? { ...p, slides: updatedSlides } : p
      ),
    }));
  },
}));
