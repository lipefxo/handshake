export type WorkspaceRole = 'owner' | 'member';
export type WorkspaceMemberStatus = 'active' | 'pending';

export interface Workspace {
  id: string;
  name: string;
  companyName: string;
  createdBy?: string;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId?: string;
  email: string;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  invitedAt: string;
}
