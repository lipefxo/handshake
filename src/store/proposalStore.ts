import { create } from 'zustand';
import type { BrandOverrides, Proposal, SlideConfig } from '../types/proposal';
import { supabase } from '../supabaseClient';
import { generateSlug } from '../shared/utils/helpers';
import { useAuthStore } from './authStore';
import { defaultThemeId, isValidThemeId } from '../themes/themeDefinitions';
import type { ThemeId } from '../themes/themeTypes';
import { normalizeSlidesIconIds } from '../shared/icons/iconMigration';
import { generateSafeSlug, sanitizeText, validateUrl } from '../shared/utils/validation';
import { appendErrorDiagnostic, logStructuredError } from '../shared/utils/errorHandling';

interface ProposalStore {
  proposals: Proposal[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  fetchProposals: () => Promise<void>;
  createProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Proposal | null>;
  updateProposal: (id: string, updates: Partial<Proposal>) => Promise<void>;
  deleteProposal: (id: string) => Promise<boolean>;
  duplicateProposal: (id: string) => Promise<Proposal | null>;
  getProposalBySlug: (slug: string) => Promise<Proposal | null>;
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
    user_id: row.user_id as string,
    slug: row.slug as string,
    title: row.title as string,
    partnerName: row.partner_name as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    status: row.status as 'draft' | 'published',
    slides,
    themeId: resolveThemeId(row),
    visibility: (row.visibility as Proposal['visibility']) || 'public',
    accessPassword: row.access_password as string | undefined,
    expiresAt: row.expires_at as string | undefined,
    brandOverrides: (row.brand_overrides as BrandOverrides) || {},
  };
}

const GENERIC_FETCH_ERROR = 'Failed to load proposals. Please try again.';
const GENERIC_SAVE_ERROR = 'Failed to save proposal. Please try again.';
const GENERIC_DELETE_ERROR = 'Failed to delete proposal. Please try again.';

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
      return value === 'left' || value === 'right' ? value : '';
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

function getCurrentUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

export const useProposalStore = create<ProposalStore>((set, get) => ({
  proposals: [],
  loading: false,
  error: null,
  clearError: () => set({ error: null }),

  fetchProposals: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
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
    const currentUserId = getCurrentUserId();
    if (!currentUserId || currentUserId !== proposal.user_id) {
      set({ error: 'Unauthorized: cannot create proposal for another user.' });
      return null;
    }

    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count, error: rateLimitError } = await supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUserId)
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

    const { data, error } = await supabase
      .from('proposals')
      .insert({
        user_id: proposal.user_id,
        slug: safeSlug,
        title: safeTitle,
        partner_name: safePartnerName,
        status: proposal.status,
        slides: normalizedSlides,
        theme_id: proposal.themeId,
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
    const currentUserId = getCurrentUserId();
    const existingProposal = get().proposals.find((proposal) => proposal.id === id);
    if (!existingProposal || !currentUserId || existingProposal.user_id !== currentUserId) {
      set({ error: 'Unauthorized: cannot update proposal you do not own.' });
      throw new Error('Unauthorized: cannot update proposal you do not own.');
    }

    const sanitizedUpdates: Partial<Proposal> = {
      ...updates,
      ...(updates.title !== undefined && { title: sanitizeText(updates.title) }),
      ...(updates.partnerName !== undefined && { partnerName: sanitizeText(updates.partnerName) }),
      ...(updates.slug !== undefined && { slug: generateSafeSlug(updates.slug) }),
      ...(updates.slides && { slides: normalizeSlidesIconIds(sanitizeSlides(updates.slides)) }),
    };

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

    const { error } = await supabase
      .from('proposals')
      .update(dbUpdates)
      .eq('id', id);
    if (error) {
      logStructuredError('updateProposal failed', error);
      set({ error: getSafeErrorMessage(error, GENERIC_SAVE_ERROR), proposals: previousProposals });
      throw error;
    }
  },

  deleteProposal: async (id) => {
    const currentUserId = getCurrentUserId();
    const existingProposal = get().proposals.find((proposal) => proposal.id === id);
    if (!existingProposal || !currentUserId || existingProposal.user_id !== currentUserId) {
      set({ error: 'Unauthorized: cannot delete proposal you do not own.' });
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
    const existing = get().proposals.find((p) => p.id === id);
    if (!existing) return null;
    const currentUserId = getCurrentUserId();
    if (!currentUserId || existing.user_id !== currentUserId) return null;

    const newSlug = generateSafeSlug(generateSlug(`${existing.partnerName}-copy`));
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        user_id: currentUserId,
        slug: newSlug,
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

  getProposalBySlug: async (slug) => {
    const safeSlug = generateSafeSlug(slug);
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('slug', safeSlug)
      .eq('status', 'published')
      .single();
    if (error || !data) return null;
    return dbRowToProposal(data);
  },

  getOwnProposalBySlug: async (slug) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return null;

    const safeSlug = generateSafeSlug(slug);
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('slug', safeSlug)
      .eq('user_id', currentUserId)
      .single();

    if (error || !data) return null;
    return dbRowToProposal(data);
  },

  createFromMarkdown: async (_markdown, frontmatter, slides) => {
    set({ error: null });
    const user = useAuthStore.getState().user;
    if (!user) return null;

    const partnerName = sanitizeText(frontmatter.partner || 'Untitled Partner');
    const title = sanitizeText(frontmatter.title || `${partnerName} Proposal`);
    const themeId = isValidThemeId(frontmatter.theme) ? frontmatter.theme : defaultThemeId;

    const normalizedSlides = normalizeSlidesIconIds(sanitizeSlides(slides));

    const proposalBase: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt'> = {
      user_id: user.id,
      slug: generateSafeSlug(generateSlug(partnerName)),
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
          user_id: proposal.user_id,
          slug: proposal.slug,
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
    const currentUserId = getCurrentUserId();
    const existing = get().proposals.find((p) => p.id === proposalId);
    if (!existing || !currentUserId || existing.user_id !== currentUserId) {
      set({ error: 'Unauthorized: cannot update proposal you do not own.' });
      return;
    }

    const normalizedNewSlides = normalizeSlidesIconIds(sanitizeSlides(newSlides));
    const updatedSlides =
      mode === 'replace'
        ? normalizedNewSlides
        : [...(existing?.slides ?? []), ...normalizedNewSlides];

    const { error } = await supabase
      .from('proposals')
      .update({ slides: updatedSlides })
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

