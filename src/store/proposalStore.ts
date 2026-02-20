import { create } from 'zustand';
import type { Proposal, SlideConfig } from '../types/proposal';
import { supabase } from '../supabaseClient';
import { generateSlug } from '../shared/utils/helpers';
import { useAuthStore } from './authStore';
import { defaultThemeId, isValidThemeId } from '../themes/themeDefinitions';
import type { ThemeId } from '../themes/themeTypes';
import { normalizeSlidesIconIds } from '../shared/icons/iconMigration';

interface ProposalStore {
  proposals: Proposal[];
  loading: boolean;
  error: string | null;
  fetchProposals: () => Promise<void>;
  createProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Proposal | null>;
  updateProposal: (id: string, updates: Partial<Proposal>) => Promise<void>;
  deleteProposal: (id: string) => Promise<boolean>;
  getProposalBySlug: (slug: string) => Promise<Proposal | null>;
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
  };
}

export const useProposalStore = create<ProposalStore>((set, get) => ({
  proposals: [],
  loading: false,
  error: null,

  fetchProposals: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      set({ error: error.message, loading: false });
      return;
    }
    set({ proposals: (data || []).map(dbRowToProposal), loading: false });
  },

  createProposal: async (proposal) => {
    const normalizedSlides = normalizeSlidesIconIds(proposal.slides);

    const { data, error } = await supabase
      .from('proposals')
      .insert({
        user_id: proposal.user_id,
        slug: proposal.slug,
        title: proposal.title,
        partner_name: proposal.partnerName,
        status: proposal.status,
        slides: normalizedSlides,
        theme_id: proposal.themeId,
      })
      .select()
      .single();
    if (error) {
      set({ error: error.message });
      return null;
    }
    const newProposal = dbRowToProposal(data);
    set((state) => ({ proposals: [newProposal, ...state.proposals] }));
    return newProposal;
  },

  updateProposal: async (id, updates) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.partnerName !== undefined) dbUpdates.partner_name = updates.partnerName;
    if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.slides !== undefined) dbUpdates.slides = normalizeSlidesIconIds(updates.slides);
    if (updates.themeId !== undefined) dbUpdates.theme_id = updates.themeId;

    const { error } = await supabase
      .from('proposals')
      .update(dbUpdates)
      .eq('id', id);
    if (error) {
      set({ error: error.message });
      return;
    }
    set((state) => ({
      proposals: state.proposals.map((p) =>
        p.id === id
          ? {
              ...p,
              ...updates,
              slides: updates.slides ? normalizeSlidesIconIds(updates.slides) : p.slides,
            }
          : p
      ),
    }));
  },

  deleteProposal: async (id) => {
    const { error } = await supabase.from('proposals').delete().eq('id', id);
    if (error) {
      set({ error: error.message });
      return false;
    }
    set((state) => ({
      proposals: state.proposals.filter((p) => p.id !== id),
    }));
    return true;
  },

  getProposalBySlug: async (slug) => {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error || !data) return null;
    return dbRowToProposal(data);
  },

  createFromMarkdown: async (_markdown, frontmatter, slides) => {
    const user = useAuthStore.getState().user;
    if (!user) return null;

    const partnerName = frontmatter.partner || 'Untitled Partner';
    const title = frontmatter.title || `${partnerName} Proposal`;
    const themeId = isValidThemeId(frontmatter.theme) ? frontmatter.theme : defaultThemeId;

    const normalizedSlides = normalizeSlidesIconIds(slides);

    const proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt'> = {
      user_id: user.id,
      slug: generateSlug(partnerName),
      title,
      partnerName,
      status: 'draft',
      slides: normalizedSlides,
      themeId,
    };

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

    if (error) {
      set({ error: error.message });
      return null;
    }

    const newProposal = dbRowToProposal(data);
    set((state) => ({ proposals: [newProposal, ...state.proposals] }));
    return newProposal;
  },

  importMarkdownToProposal: async (proposalId, newSlides, mode) => {
    const normalizedNewSlides = normalizeSlidesIconIds(newSlides);
    const existing = get().proposals.find((p) => p.id === proposalId);
    const updatedSlides =
      mode === 'replace'
        ? normalizedNewSlides
        : [...(existing?.slides ?? []), ...normalizedNewSlides];

    const { error } = await supabase
      .from('proposals')
      .update({ slides: updatedSlides })
      .eq('id', proposalId);

    if (error) {
      set({ error: error.message });
      return;
    }

    set((state) => ({
      proposals: state.proposals.map((p) =>
        p.id === proposalId ? { ...p, slides: updatedSlides } : p
      ),
    }));
  },
}));

