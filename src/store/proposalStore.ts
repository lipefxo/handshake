import { create } from 'zustand';
import type { Proposal, SlideConfig } from '../types/proposal';
import { supabase } from '../supabaseClient';
import { generateSlug } from '../shared/utils/helpers';
import { useAuthStore } from './authStore';

interface ProposalStore {
  proposals: Proposal[];
  loading: boolean;
  error: string | null;
  fetchProposals: () => Promise<void>;
  createProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Proposal | null>;
  updateProposal: (id: string, updates: Partial<Proposal>) => Promise<void>;
  deleteProposal: (id: string) => Promise<void>;
  getProposalBySlug: (slug: string) => Promise<Proposal | null>;
  createFromMarkdown: (
    markdown: string,
    frontmatter: { title?: string; partner?: string; date?: string },
    slides: SlideConfig[],
  ) => Promise<Proposal | null>;
  importMarkdownToProposal: (
    proposalId: string,
    slides: SlideConfig[],
    mode: 'append' | 'replace',
  ) => Promise<void>;
}

function dbRowToProposal(row: Record<string, unknown>): Proposal {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    slug: row.slug as string,
    title: row.title as string,
    partnerName: row.partner_name as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    status: row.status as 'draft' | 'published',
    slides: (row.slides as Proposal['slides']) || [],
    theme: (row.theme as Proposal['theme']) || undefined,
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
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        user_id: proposal.user_id,
        slug: proposal.slug,
        title: proposal.title,
        partner_name: proposal.partnerName,
        status: proposal.status,
        slides: proposal.slides,
        theme: proposal.theme || null,
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
    if (updates.slides !== undefined) dbUpdates.slides = updates.slides;
    if (updates.theme !== undefined) dbUpdates.theme = updates.theme;

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
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },

  deleteProposal: async (id) => {
    const { error } = await supabase.from('proposals').delete().eq('id', id);
    if (error) {
      set({ error: error.message });
      return;
    }
    set((state) => ({
      proposals: state.proposals.filter((p) => p.id !== id),
    }));
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

    const proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt'> = {
      user_id: user.id,
      slug: generateSlug(partnerName),
      title,
      partnerName,
      status: 'draft',
      slides,
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
        theme: null,
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
    const existing = get().proposals.find((p) => p.id === proposalId);
    const updatedSlides =
      mode === 'replace'
        ? newSlides
        : [...(existing?.slides ?? []), ...newSlides];

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

