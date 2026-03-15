import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { SlideConfig } from '../types/proposal';
import type { ThemeId } from '../themes/themeTypes';
import { supabase } from '../supabaseClient';
import { useWorkspaceStore } from './workspaceStore';
import { useAuthStore } from './authStore';
import type { ProposalTemplate } from '../data/proposalTemplates';

export interface CustomTemplate {
  id: string;
  workspaceId: string;
  createdBy: string | null;
  name: string;
  description: string;
  category: string;
  themeId: ThemeId;
  slides: SlideConfig[];
  createdAt: string;
}

interface CustomTemplateStore {
  templates: CustomTemplate[];
  loading: boolean;
  fetchTemplates: () => Promise<void>;
  saveTemplate: (data: {
    name: string;
    description: string;
    themeId: ThemeId;
    slides: SlideConfig[];
  }) => Promise<CustomTemplate | null>;
  deleteTemplate: (id: string) => Promise<boolean>;
}

function dbRowToCustomTemplate(row: Record<string, unknown>): CustomTemplate {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    createdBy: (row.created_by as string) ?? null,
    name: row.name as string,
    description: (row.description as string) ?? '',
    category: (row.category as string) ?? 'general',
    themeId: row.theme_id as ThemeId,
    slides: (row.slides as SlideConfig[]) ?? [],
    createdAt: row.created_at as string,
  };
}

export function customTemplateToProposalTemplate(ct: CustomTemplate): ProposalTemplate {
  return {
    id: `custom:${ct.id}`,
    name: ct.name,
    description: ct.description,
    category: 'general',
    themeId: ct.themeId,
    slides: ct.slides,
  };
}

export function getCustomTemplateSlidesForProposal(
  ct: CustomTemplate,
  seed: { title?: string; partnerName?: string; proposalDate?: string; themeId?: ThemeId },
): { slides: SlideConfig[]; themeId: ThemeId } {
  // Generate fresh IDs for slides
  const slides = ct.slides.map((s) => ({ ...s, id: uuidv4() }));
  return { slides, themeId: seed.themeId ?? ct.themeId };
}

export const useCustomTemplateStore = create<CustomTemplateStore>((set) => ({
  templates: [],
  loading: false,

  fetchTemplates: async () => {
    const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
    if (!workspaceId) {
      set({ templates: [], loading: false });
      return;
    }
    set({ loading: true });
    const { data, error } = await supabase
      .from('custom_templates')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      set({ loading: false });
      return;
    }
    set({
      templates: (data ?? []).map((r) => dbRowToCustomTemplate(r as Record<string, unknown>)),
      loading: false,
    });
  },

  saveTemplate: async ({ name, description, themeId, slides }) => {
    const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
    const userId = useAuthStore.getState().user?.id;
    if (!workspaceId || !userId) return null;

    const { data, error } = await supabase
      .from('custom_templates')
      .insert({
        workspace_id: workspaceId,
        created_by: userId,
        name,
        description,
        theme_id: themeId,
        slides,
      })
      .select()
      .single();

    if (error || !data) return null;
    const template = dbRowToCustomTemplate(data as Record<string, unknown>);
    set((state) => ({ templates: [template, ...state.templates] }));
    return template;
  },

  deleteTemplate: async (id) => {
    const { error } = await supabase.from('custom_templates').delete().eq('id', id);
    if (error) return false;
    set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
    return true;
  },
}));
