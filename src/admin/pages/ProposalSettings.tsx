import { motion } from 'motion/react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { AppIcon } from '../../shared/icons/AppIcon';
import { useAuthStore } from '../../store/authStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatDateTime, formatRelativeTime } from '../../shared/utils/helpers';
import { useActionFeedback } from '@/shared/hooks/useActionFeedback';
import { BrandThemeConfigurator } from '../components/settings/BrandThemeConfigurator';

const LIMITS = {
  companyName: 50,
  email: 100,
  workspaceName: 30,
};

function CharCounter({ value, max }: { value: string; max: number }) {
  const remaining = max - value.length;
  const isNearLimit = remaining <= Math.floor(max * 0.15);
  return (
    <span
      className="text-xs tabular-nums"
      style={{ color: isNearLimit ? (remaining <= 0 ? '#ef4444' : '#f59e0b') : '#9ca3af' }}
    >
      {value.length}/{max}
    </span>
  );
}

interface LogoUploadProps {
  logo: string | null;
  onLogoChange: (dataUrl: string | null) => void;
}

function LogoUpload({ logo, onLogoChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onLogoChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  if (logo) {
    return (
      <div className="space-y-2">
        <div
          className="w-full h-32 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden"
          style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <img src={logo} alt="Company logo" className="w-full h-full object-contain" />
        </div>
        <Button
          type="button"
          onClick={() => onLogoChange(null)}
          variant="ghost"
          size="sm"
          className="h-auto px-0 py-0 text-xs text-gray-500 hover:text-red-500"
          title="Remove logo"
        >
          Remove logo
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      className="w-full cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 transition-colors duration-150 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4785c]/50 focus-visible:ring-offset-2"
      style={{
        borderColor: dragging ? '#d4785c' : '#e5e3de',
        background: dragging ? 'rgba(212,120,92,0.06)' : '#fafaf7',
      }}
    >
      <AppIcon icon="ui.image" className="mx-auto mb-1.5 w-6 h-6 text-gray-300" />
      <p className="text-xs font-medium text-gray-600">
        {dragging ? 'Drop to upload' : 'Click or drag to upload logo'}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, SVG · Recommended 256×256</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

export function ProposalSettings() {
  const user = useAuthStore((state) => state.user);
  const {
    currentWorkspace,
    currentUserRole,
    members,
    error: workspaceError,
    inviteMember,
    resendInvite,
    removeMember,
    renameWorkspace,
    updateCompanyName,
    updateBrandTheme,
    refreshMembers,
    clearError,
  } = useWorkspaceStore();
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [companyNameTouched, setCompanyNameTouched] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [renamingWorkspace, setRenamingWorkspace] = useState(false);
  const [resendingMemberId, setResendingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const isOwner = currentUserRole === 'owner';
  const { executeWithFeedback } = useActionFeedback();

  useEffect(() => {
    if (email || !user?.email) return;
    setEmail(user.email);
  }, [email, user?.email]);

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    void refreshMembers();
  }, [currentWorkspace?.id, refreshMembers]);

  useEffect(() => {
    setWorkspaceName(currentWorkspace?.name ?? '');
  }, [currentWorkspace?.name]);

  useEffect(() => {
    setCompanyName(currentWorkspace?.companyName ?? '');
  }, [currentWorkspace?.companyName]);

  const [savingCompanyName, setSavingCompanyName] = useState(false);
  const companyNameDirty = companyName !== (currentWorkspace?.companyName ?? '');

  useEffect(() => {
    if (!companyNameDirty || !currentWorkspace || companyName.trim() === '' || companyName.length > LIMITS.companyName) return;
    const timer = setTimeout(() => {
      setSavingCompanyName(true);
      void updateCompanyName(companyName).finally(() => setSavingCompanyName(false));
    }, 800);
    return () => clearTimeout(timer);
  }, [companyName, companyNameDirty, currentWorkspace, updateCompanyName]);

  const companyNameError = companyNameTouched && companyName.trim() === ''
    ? 'Company name is required'
    : companyName.length > LIMITS.companyName
    ? `Max ${LIMITS.companyName} characters`
    : null;

  const handleInviteMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteEmail.trim()) return;
    const targetEmail = inviteEmail.trim().toLowerCase();

    setInviting(true);
    const inviteResult = await executeWithFeedback(() => inviteMember(inviteEmail), {
      successMessage: `Invitation sent to ${targetEmail}`,
      errorMessage: 'Failed to send invitation',
      isSuccess: (result) => result.emailSent,
      getErrorDescription: (result) =>
        !result.added ? workspaceError ?? undefined : 'Member was added but email delivery failed.',
    });
    if (inviteResult.added) {
      setInviteEmail('');
    }
    setInviting(false);
  };

  const handleResendInvite = async (memberId: string, memberEmail: string) => {
    setResendingMemberId(memberId);
    await executeWithFeedback(() => resendInvite(memberId), {
      successMessage: `Invitation resent to ${memberEmail.toLowerCase()}`,
      errorMessage: 'Failed to resend invitation',
      isSuccess: (result) => result,
      getErrorDescription: () => workspaceError ?? undefined,
    });
    setResendingMemberId(null);
  };

  const handleRemoveMember = async (memberId: string) => {
    setRemovingMemberId(memberId);
    await executeWithFeedback(() => removeMember(memberId), {
      successMessage: 'Member removed',
      errorMessage: 'Failed to remove member',
      isSuccess: (result) => result,
      getErrorDescription: () => workspaceError ?? undefined,
    });
    setRemovingMemberId(null);
  };

  const handleRenameWorkspace = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!workspaceName.trim() || !currentWorkspace) return;
    if (workspaceName.trim() === currentWorkspace.name) return;

    setRenamingWorkspace(true);
    await executeWithFeedback(() => renameWorkspace(workspaceName), {
      successMessage: 'Workspace renamed',
      errorMessage: 'Failed to rename workspace',
      isSuccess: (result) => result,
      getErrorDescription: () => workspaceError ?? undefined,
    });
    setRenamingWorkspace(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="font-brand-serif text-2xl text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-[#6b6b6b]">Global settings for your proposal workspace.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Brand */}
        <Card className="rounded-2xl border-gray-100">
          <CardHeader>
            <CardTitle className="font-brand-serif text-base text-gray-900">Brand</CardTitle>
            <CardDescription className="mt-1 text-xs text-[#6b6b6b]">
              Configure your company's identity for proposals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Logo */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Company logo</label>
              <LogoUpload logo={logo} onLogoChange={setLogo} />
            </div>

            {/* Company name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Company name
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <CharCounter value={companyName} max={LIMITS.companyName} />
              </div>
              <Input
                className={cn(companyNameError && 'border-red-400 focus-visible:ring-red-200')}
                value={companyName}
                placeholder="Your company name"
                maxLength={LIMITS.companyName}
                required
                onChange={(e) => setCompanyName(e.target.value)}
                onBlur={() => setCompanyNameTouched(true)}
              />
              {savingCompanyName && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 border border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                  Saving…
                </p>
              )}
              {companyNameError && (
                <p className="text-xs text-red-500 mt-1">{companyNameError}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-600">Default contact email</label>
                <CharCounter value={email} max={LIMITS.email} />
              </div>
              <Input
                type="email"
                placeholder={user?.email ?? 'you@acmecorp.com'}
                value={email}
                maxLength={LIMITS.email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <BrandThemeConfigurator
              key={currentWorkspace?.id ?? 'workspace-brand-theme'}
              value={currentWorkspace?.brandTheme}
              onSave={updateBrandTheme}
              disabled={!isOwner}
            />
            {!isOwner && (
              <p className="text-xs text-gray-500">
                Only workspace owners can edit brand theme settings.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Team */}
        <Card className="rounded-2xl border-gray-100">
          <CardHeader>
            <CardTitle className="font-brand-serif text-base text-gray-900">Team</CardTitle>
            <CardDescription className="mt-1 text-xs text-[#6b6b6b]">
              Invite teammates to access and manage proposals in this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={handleRenameWorkspace}
              className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="workspace-name" className="text-xs font-medium text-gray-700">
                  Workspace name
                </label>
                <CharCounter value={workspaceName} max={LIMITS.workspaceName} />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  maxLength={LIMITS.workspaceName}
                  disabled={!isOwner || renamingWorkspace || !currentWorkspace}
                  placeholder="My Workspace"
                />
                <Button
                  type="submit"
                  disabled={
                    !isOwner ||
                    renamingWorkspace ||
                    !workspaceName.trim() ||
                    workspaceName.trim() === (currentWorkspace?.name ?? '')
                  }
                >
                  {renamingWorkspace ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>

            {workspaceError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-center justify-between gap-2">
                <span>{workspaceError}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs text-red-700 hover:text-red-800"
                  onClick={clearError}
                >
                  Dismiss
                </Button>
              </div>
            )}

            <form onSubmit={handleInviteMember} className="flex items-center gap-2">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                disabled={!isOwner || inviting}
              />
              <Button type="submit" disabled={!isOwner || inviting || !inviteEmail.trim()}>
                {inviting ? 'Inviting...' : 'Invite'}
              </Button>
            </form>
            {!isOwner && (
              <p className="text-xs text-gray-500">Only workspace owners can invite and remove members.</p>
            )}

            <div className="space-y-2">
              {members.length === 0 ? (
                <p className="text-xs text-gray-500">No team members yet.</p>
              ) : (
                members.map((member) => {
                  const isSelf = member.userId === user?.id;
                  const isPending = member.status === 'pending';
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 truncate">{member.email}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                            {member.role}
                          </Badge>
                          <Badge
                            variant={isPending ? 'outline' : 'secondary'}
                            className={isPending ? 'text-amber-700 border-amber-200' : ''}
                          >
                            {member.status}
                          </Badge>
                        </div>
                        {isPending && (
                          <p
                            className="mt-1 text-[11px] text-gray-500"
                            title={formatDateTime(member.invitedAt)}
                          >
                            Invite sent {formatRelativeTime(member.invitedAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isPending && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={!isOwner || resendingMemberId === member.id}
                            onClick={() => handleResendInvite(member.id, member.email)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {resendingMemberId === member.id ? 'Resending...' : 'Resend'}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={!isOwner || isSelf || removingMemberId === member.id}
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          {removingMemberId === member.id ? 'Removing...' : 'Remove'}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

      </motion.div>
    </div>
  );
}
