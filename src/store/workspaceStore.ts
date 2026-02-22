import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import type { AppUser } from '../types/auth';
import type { Workspace, WorkspaceMember } from '../types/workspace';
import { appendErrorDiagnostic, logStructuredError } from '../shared/utils/errorHandling';
import { sanitizeText } from '../shared/utils/validation';

interface WorkspaceStore {
  currentWorkspace: Workspace | null;
  currentUserRole: WorkspaceMember['role'] | null;
  members: WorkspaceMember[];
  loading: boolean;
  error: string | null;
  clearWorkspaceState: () => void;
  clearError: () => void;
  initializeWorkspace: (user: AppUser | null) => Promise<void>;
  inviteMember: (email: string) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  refreshMembers: () => Promise<void>;
}

function normalizeEmail(email: string): string {
  return sanitizeText(email).toLowerCase();
}

function toWorkspace(row: Record<string, unknown>): Workspace {
  return {
    id: row.id as string,
    name: (row.name as string) || 'My Workspace',
    createdBy: row.created_by as string | undefined,
    createdAt: row.created_at as string,
  };
}

function toWorkspaceMember(row: Record<string, unknown>): WorkspaceMember {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    userId: row.user_id as string | undefined,
    email: row.email as string,
    role: row.role as WorkspaceMember['role'],
    status: row.status as WorkspaceMember['status'],
    invitedAt: row.invited_at as string,
  };
}

async function fetchPrimaryWorkspaceForUser(userId: string): Promise<{
  workspace: Workspace | null;
  role: WorkspaceMember['role'] | null;
}> {
  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      role,
      workspaces!inner (
        id,
        name,
        created_by,
        created_at
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('invited_at', { ascending: true })
    .limit(1);

  if (error) throw error;

  const memberRow = data?.[0] as
    | { role?: WorkspaceMember['role']; workspaces?: Record<string, unknown> | Array<Record<string, unknown>> | null }
    | undefined;
  const workspaceRow = Array.isArray(memberRow?.workspaces)
    ? memberRow?.workspaces[0]
    : memberRow?.workspaces;
  if (!workspaceRow) {
    return { workspace: null, role: null };
  }

  return {
    workspace: toWorkspace(workspaceRow),
    role: memberRow?.role ?? null,
  };
}

async function ensureWorkspaceForUser(user: AppUser): Promise<void> {
  const primary = await fetchPrimaryWorkspaceForUser(user.id);
  if (primary.workspace) return;

  const { data: workspaceInsert, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      created_by: user.id,
      name: `${user.displayName?.trim() || user.email}'s Workspace`,
    })
    .select('id')
    .single();

  if (workspaceError || !workspaceInsert) {
    throw workspaceError || new Error('Failed to create workspace');
  }

  const { error: ownerError } = await supabase.from('workspace_members').insert({
    workspace_id: workspaceInsert.id,
    user_id: user.id,
    email: normalizeEmail(user.email),
    role: 'owner',
    status: 'active',
  });

  if (ownerError) throw ownerError;
}

async function activatePendingInvitesForUser(user: AppUser): Promise<void> {
  const normalized = normalizeEmail(user.email);
  const { error } = await supabase
    .from('workspace_members')
    .update({
      user_id: user.id,
      status: 'active',
    })
    .is('user_id', null)
    .eq('status', 'pending')
    .eq('email', normalized);

  if (error) {
    throw error;
  }
}

const GENERIC_WORKSPACE_ERROR = 'Failed to load workspace. Please try again.';

function getWorkspaceError(error: unknown, fallback: string): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === '23505') {
    return appendErrorDiagnostic('This member is already in your workspace.', error);
  }
  if (code === '42501') {
    return appendErrorDiagnostic('You do not have permission for this workspace action.', error);
  }
  return appendErrorDiagnostic(fallback, error);
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  currentWorkspace: null,
  currentUserRole: null,
  members: [],
  loading: false,
  error: null,

  clearWorkspaceState: () => {
    set({
      currentWorkspace: null,
      currentUserRole: null,
      members: [],
      loading: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),

  initializeWorkspace: async (user) => {
    if (!user) {
      get().clearWorkspaceState();
      return;
    }

    set({ loading: true, error: null });
    try {
      await activatePendingInvitesForUser(user);
      await ensureWorkspaceForUser(user);
      const primary = await fetchPrimaryWorkspaceForUser(user.id);
      if (!primary.workspace) {
        throw new Error('Workspace provisioning failed');
      }

      set({
        currentWorkspace: primary.workspace,
        currentUserRole: primary.role,
      });
      await get().refreshMembers();
      set({ loading: false });
    } catch (error) {
      logStructuredError('initializeWorkspace failed', error);
      set({
        error: getWorkspaceError(error, GENERIC_WORKSPACE_ERROR),
        loading: false,
      });
    }
  },

  refreshMembers: async () => {
    const workspaceId = get().currentWorkspace?.id;
    if (!workspaceId) {
      set({ members: [] });
      return;
    }

    const { data, error } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('role', { ascending: true })
      .order('invited_at', { ascending: true });

    if (error) {
      logStructuredError('refreshMembers failed', error);
      set({ error: getWorkspaceError(error, GENERIC_WORKSPACE_ERROR) });
      return;
    }

    set({ members: (data ?? []).map((row) => toWorkspaceMember(row as Record<string, unknown>)) });
  },

  inviteMember: async (email) => {
    const workspace = get().currentWorkspace;
    const role = get().currentUserRole;
    if (!workspace || role !== 'owner') {
      set({ error: 'Only workspace owners can invite members.' });
      return false;
    }

    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail || !cleanEmail.includes('@')) {
      set({ error: 'Enter a valid email address.' });
      return false;
    }

    set({ error: null });
    const { error } = await supabase.from('workspace_members').insert({
      workspace_id: workspace.id,
      email: cleanEmail,
      role: 'member',
      status: 'pending',
    });

    if (error) {
      logStructuredError('inviteMember failed', error);
      set({ error: getWorkspaceError(error, 'Failed to invite member. Please try again.') });
      return false;
    }

    await get().refreshMembers();
    return true;
  },

  removeMember: async (memberId) => {
    const workspace = get().currentWorkspace;
    const role = get().currentUserRole;
    if (!workspace || role !== 'owner') {
      set({ error: 'Only workspace owners can remove members.' });
      return false;
    }

    set({ error: null });
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspace.id)
      .eq('id', memberId);

    if (error) {
      logStructuredError('removeMember failed', error);
      set({ error: getWorkspaceError(error, 'Failed to remove member. Please try again.') });
      return false;
    }

    await get().refreshMembers();
    return true;
  },
}));
