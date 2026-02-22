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

const LIMITS = {
  companyName: 50,
  email: 100,
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
      className="w-full cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 transition-colors duration-150 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
      style={{
        borderColor: dragging ? '#6366f1' : '#e5e7eb',
        background: dragging ? 'rgba(99,102,241,0.04)' : '#fafafa',
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
    removeMember,
    refreshMembers,
    clearError,
  } = useWorkspaceStore();
  const [companyName, setCompanyName] = useState('Acme Corp');
  const [email, setEmail] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [companyNameTouched, setCompanyNameTouched] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const isOwner = currentUserRole === 'owner';

  useEffect(() => {
    if (email || !user?.email) return;
    setEmail(user.email);
  }, [email, user?.email]);

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    void refreshMembers();
  }, [currentWorkspace?.id, refreshMembers]);

  const companyNameError = companyNameTouched && companyName.trim() === ''
    ? 'Company name is required'
    : companyName.length > LIMITS.companyName
    ? `Max ${LIMITS.companyName} characters`
    : null;

  const handleInviteMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    const invited = await inviteMember(inviteEmail);
    if (invited) {
      setInviteEmail('');
    }
    setInviting(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    setRemovingMemberId(memberId);
    await removeMember(memberId);
    setRemovingMemberId(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Global settings for your proposal workspace.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Brand */}
        <Card className="rounded-2xl border-gray-100">
          <CardHeader>
            <CardTitle className="text-sm text-gray-900">Brand</CardTitle>
            <CardDescription className="text-xs">Configure your company's identity for proposals.</CardDescription>
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
                placeholder="Acme Corp"
                maxLength={LIMITS.companyName}
                required
                onChange={(e) => setCompanyName(e.target.value)}
                onBlur={() => setCompanyNameTouched(true)}
              />
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
          </CardContent>
        </Card>

        {/* Team */}
        <Card className="rounded-2xl border-gray-100">
          <CardHeader>
            <CardTitle className="text-sm text-gray-900">Team</CardTitle>
            <CardDescription className="text-xs">
              Invite teammates to access and manage proposals in this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <span className="font-medium text-gray-700">Workspace:</span>{' '}
              {currentWorkspace?.name ?? 'Loading workspace...'}
            </div>

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
                      </div>
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
