import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import type { AppUser } from '../types/auth';
import type { Workspace, WorkspaceBrandTheme, WorkspaceMember } from '../types/workspace';
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
  inviteMember: (email: string) => Promise<{ added: boolean; emailSent: boolean }>;
  resendInvite: (memberId: string) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  renameWorkspace: (name: string) => Promise<boolean>;
  updateCompanyName: (companyName: string) => Promise<boolean>;
  updateBrandTheme: (brandTheme: WorkspaceBrandTheme) => Promise<boolean>;
  refreshMembers: () => Promise<void>;
}

function normalizeEmail(email: string): string {
  return sanitizeText(email).toLowerCase();
}

function toWorkspace(row: Record<string, unknown>): Workspace {
  const brandTheme = (row.brand_theme as WorkspaceBrandTheme | null | undefined) ?? undefined;
  return {
    id: row.id as string,
    name: (row.name as string) || 'My Workspace',
    companyName: (row.company_name as string) || '',
    brandTheme,
    createdBy: row.created_by as string | undefined,
    createdAt: row.created_at as string,
  };
}

function sanitizeCssColor(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? sanitizeText(trimmed) : undefined;
}

function sanitizeFontValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = sanitizeText(value).trim();
  return cleaned || undefined;
}

function sanitizePositiveNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return undefined;
  return value;
}

function sanitizeWorkspaceBrandTheme(brandTheme: WorkspaceBrandTheme): WorkspaceBrandTheme {
  return {
    colors: {
      bgPrimary: sanitizeCssColor(brandTheme.colors?.bgPrimary),
      bgSecondary: sanitizeCssColor(brandTheme.colors?.bgSecondary),
      accent: sanitizeCssColor(brandTheme.colors?.accent),
      accentHover: sanitizeCssColor(brandTheme.colors?.accentHover),
      textPrimary: sanitizeCssColor(brandTheme.colors?.textPrimary),
      textSecondary: sanitizeCssColor(brandTheme.colors?.textSecondary),
    },
    fonts: {
      display: sanitizeFontValue(brandTheme.fonts?.display),
      displayWeight: sanitizePositiveNumber(brandTheme.fonts?.displayWeight),
      body: sanitizeFontValue(brandTheme.fonts?.body),
      bodyWeight: sanitizePositiveNumber(brandTheme.fonts?.bodyWeight),
      googleFontsImport: sanitizeFontValue(brandTheme.fonts?.googleFontsImport),
    },
    style: {
      borderRadius: sanitizeFontValue(brandTheme.style?.borderRadius),
      slideTransitionDefault: brandTheme.style?.slideTransitionDefault,
    },
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

function sortMembersWithOwnerFirst(members: WorkspaceMember[]): WorkspaceMember[] {
  return [...members].sort((a, b) => {
    if (a.role === 'owner' && b.role !== 'owner') return -1;
    if (a.role !== 'owner' && b.role === 'owner') return 1;
    if (a.invitedAt < b.invitedAt) return -1;
    if (a.invitedAt > b.invitedAt) return 1;
    return a.email.localeCompare(b.email);
  });
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
        company_name,
        brand_theme,
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

  const { data, error } = await supabase.rpc('bootstrap_workspace', {
    owner_name: user.displayName?.trim() || user.email,
    owner_email: normalizeEmail(user.email),
  });

  if (error) {
    if (error.code === '23505') return;
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create workspace');
  }
}

async function activatePendingInvitesForUser(user: AppUser): Promise<number> {
  const normalized = normalizeEmail(user.email);
  const { data, error } = await supabase.rpc('activate_pending_invites_for_user', {
    target_user_id: user.id,
    target_email: normalized,
  });

  if (error) {
    throw error;
  }

  return typeof data === 'number' ? data : 0;
}

let initializationInFlight: Promise<void> | null = null;

const GENERIC_WORKSPACE_ERROR = 'Failed to load workspace. Please try again.';

function getWorkspaceError(error: unknown, fallback: string): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === '23505') {
    return appendErrorDiagnostic('This member is already in your workspace.', error);
  }
  if (code === '42501') {
    return appendErrorDiagnostic('You do not have permission for this workspace action.', error);
  }
  if (code === 'PGRST204' || code === 'PGRST205') {
    return appendErrorDiagnostic(
      'Workspace tables are missing or schema cache is stale. Run the latest Supabase schema migration and reload the API schema cache.',
      error,
    );
  }
  return appendErrorDiagnostic(fallback, error);
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function extractFunctionInvokeErrorMessage(error: unknown): Promise<string | null> {
  const directMessage = toNonEmptyString((error as { message?: unknown } | null)?.message);
  const maybeContext = (error as { context?: unknown } | null)?.context;
  if (!(maybeContext instanceof Response)) return directMessage;

  try {
    const payload = (await maybeContext.clone().json()) as { error?: unknown; message?: unknown };
    const payloadMessage = toNonEmptyString(payload.error) ?? toNonEmptyString(payload.message);
    if (payloadMessage) return payloadMessage;
  } catch {
    // Fall through to plain-text body parsing.
  }

  try {
    const payloadText = toNonEmptyString(await maybeContext.clone().text());
    if (payloadText) return payloadText;
  } catch {
    // Ignore body parse errors and use direct message fallback.
  }

  return directMessage;
}

function formatInviteDispatchError(baseMessage: string, error: unknown, reason: string | null): string {
  const diagnostic = appendErrorDiagnostic(baseMessage, error);
  return reason ? `${diagnostic} Reason: ${reason}` : diagnostic;
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

    if (initializationInFlight) {
      await initializationInFlight;
      return;
    }

    set({ loading: true, error: null });
    const run = async () => {
      const attempt = async () => {
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
      };

      try {
        await attempt();
      } catch (firstError) {
        const code = (firstError as { code?: string } | null)?.code;
        if (code === '42501') {
          logStructuredError('initializeWorkspace first attempt failed (42501), retrying', firstError);
          await new Promise((r) => setTimeout(r, 1500));
          try {
            await attempt();
            return;
          } catch (retryError) {
            logStructuredError('initializeWorkspace retry failed', retryError);
            set({
              error: getWorkspaceError(retryError, GENERIC_WORKSPACE_ERROR),
              loading: false,
            });
            return;
          }
        }
        logStructuredError('initializeWorkspace failed', firstError);
        set({
          error: getWorkspaceError(firstError, GENERIC_WORKSPACE_ERROR),
          loading: false,
        });
      } finally {
        initializationInFlight = null;
      }
    };

    initializationInFlight = run();
    await initializationInFlight;
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
      .order('invited_at', { ascending: true });

    if (error) {
      logStructuredError('refreshMembers failed', error);
      set({ error: getWorkspaceError(error, GENERIC_WORKSPACE_ERROR) });
      return;
    }

    set({
      members: sortMembersWithOwnerFirst(
        (data ?? []).map((row) => toWorkspaceMember(row as Record<string, unknown>)),
      ),
    });
  },

  resendInvite: async (memberId) => {
    const workspace = get().currentWorkspace;
    const role = get().currentUserRole;
    if (!workspace || role !== 'owner') {
      set({ error: 'Only workspace owners can resend invites.' });
      return false;
    }

    const pendingMember = get().members.find((member) => member.id === memberId && member.status === 'pending');
    if (!pendingMember) {
      set({ error: 'Only pending members can receive a resend invite.' });
      return false;
    }

    set({ error: null });
    const { error: inviteEmailError } = await supabase.functions.invoke('workspace-invite', {
      body: {
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        email: pendingMember.email,
        origin: window.location.origin,
      },
    });

    if (inviteEmailError) {
      const inviteReason = await extractFunctionInvokeErrorMessage(inviteEmailError);
      logStructuredError('resendInvite email dispatch failed', inviteEmailError);
      set({
        error: formatInviteDispatchError(
          'Could not resend invitation email. Ask them to sign in manually.',
          inviteEmailError,
          inviteReason,
        ),
      });
      return false;
    }

    const { error: updateInviteTimeError } = await supabase
      .from('workspace_members')
      .update({ invited_at: new Date().toISOString() })
      .eq('workspace_id', workspace.id)
      .eq('id', pendingMember.id);

    if (updateInviteTimeError) {
      logStructuredError('resendInvite invited_at update failed', updateInviteTimeError);
    }

    await get().refreshMembers();

    return true;
  },

  inviteMember: async (email) => {
    const workspace = get().currentWorkspace;
    const role = get().currentUserRole;
    if (!workspace || role !== 'owner') {
      set({ error: 'Only workspace owners can invite members.' });
      return { added: false, emailSent: false };
    }

    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail || !cleanEmail.includes('@')) {
      set({ error: 'Enter a valid email address.' });
      return { added: false, emailSent: false };
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
      return { added: false, emailSent: false };
    }

    const { error: inviteEmailError } = await supabase.functions.invoke('workspace-invite', {
      body: {
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        email: cleanEmail,
        origin: window.location.origin,
      },
    });

    if (inviteEmailError) {
      const inviteReason = await extractFunctionInvokeErrorMessage(inviteEmailError);
      logStructuredError('inviteMember email dispatch failed', inviteEmailError);
      set({
        error: formatInviteDispatchError(
          'Member was added, but invitation email could not be sent. Ask them to sign in manually.',
          inviteEmailError,
          inviteReason,
        ),
      });
      await get().refreshMembers();
      return { added: true, emailSent: false };
    }

    await get().refreshMembers();
    return { added: true, emailSent: true };
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

  renameWorkspace: async (name) => {
    const workspace = get().currentWorkspace;
    const role = get().currentUserRole;
    if (!workspace || role !== 'owner') {
      set({ error: 'Only workspace owners can rename the workspace.' });
      return false;
    }

    const cleanName = sanitizeText(name);
    if (!cleanName) {
      set({ error: 'Workspace name cannot be empty.' });
      return false;
    }

    set({ error: null });
    const { error } = await supabase
      .from('workspaces')
      .update({ name: cleanName })
      .eq('id', workspace.id);

    if (error) {
      logStructuredError('renameWorkspace failed', error);
      set({ error: getWorkspaceError(error, 'Failed to rename workspace. Please try again.') });
      return false;
    }

    set({
      currentWorkspace: {
        ...workspace,
        name: cleanName,
      },
    });
    return true;
  },

  updateCompanyName: async (companyName) => {
    const workspace = get().currentWorkspace;
    const role = get().currentUserRole;
    if (!workspace || role !== 'owner') {
      set({ error: 'Only workspace owners can update the company name.' });
      return false;
    }

    const cleanName = sanitizeText(companyName);

    set({ error: null });
    const { error } = await supabase
      .from('workspaces')
      .update({ company_name: cleanName })
      .eq('id', workspace.id);

    if (error) {
      logStructuredError('updateCompanyName failed', error);
      set({ error: getWorkspaceError(error, 'Failed to update company name. Please try again.') });
      return false;
    }

    set({
      currentWorkspace: {
        ...workspace,
        companyName: cleanName,
      },
    });

    // Propagate to all proposals in this workspace via DB function
    const { error: rpcError } = await supabase.rpc('update_workspace_company_name', {
      target_workspace_id: workspace.id,
      new_company_name: cleanName,
    });
    if (rpcError) {
      logStructuredError('propagate company name to proposals failed', rpcError);
    }

    return true;
  },

  updateBrandTheme: async (brandTheme) => {
    const workspace = get().currentWorkspace;
    const role = get().currentUserRole;
    if (!workspace || role !== 'owner') {
      set({ error: 'Only workspace owners can update brand theme settings.' });
      return false;
    }

    const cleanTheme = sanitizeWorkspaceBrandTheme(brandTheme);

    set({ error: null });
    const { error } = await supabase
      .from('workspaces')
      .update({ brand_theme: cleanTheme })
      .eq('id', workspace.id);

    if (error) {
      logStructuredError('updateBrandTheme failed', error);
      set({ error: getWorkspaceError(error, 'Failed to update brand theme settings. Please try again.') });
      return false;
    }

    set({
      currentWorkspace: {
        ...workspace,
        brandTheme: cleanTheme,
      },
    });

    return true;
  },
}));
