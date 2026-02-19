import { create } from 'zustand';
import type { Proposal } from '../types/proposal';
import { supabase } from '../supabaseClient';

interface ProposalStore {
  proposals: Proposal[];
  loading: boolean;
  error: string | null;
  fetchProposals: () => Promise<void>;
  createProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Proposal | null>;
  updateProposal: (id: string, updates: Partial<Proposal>) => Promise<void>;
  deleteProposal: (id: string) => Promise<void>;
  getProposalBySlug: (slug: string) => Promise<Proposal | null>;
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

export const useProposalStore = create<ProposalStore>((set) => ({
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
}));
