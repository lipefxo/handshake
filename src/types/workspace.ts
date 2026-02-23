export type WorkspaceRole = 'owner' | 'member';
export type WorkspaceMemberStatus = 'active' | 'pending';

export interface WorkspaceBrandTheme {
  colors?: {
    bgPrimary?: string;
    bgSecondary?: string;
    bgSurface?: string;
    accent?: string;
    accentHover?: string;
    accentMuted?: string;
    textPrimary?: string;
    textSecondary?: string;
    textTertiary?: string;
    border?: string;
    borderLight?: string;
    gradientStart?: string;
    gradientEnd?: string;
    overlayBg?: string;
  };
  fonts?: {
    display?: string;
    displayWeight?: number;
    body?: string;
    bodyWeight?: number;
    mono?: string;
    googleFontsImport?: string;
  };
  style?: {
    borderRadius?: string;
    decorativeOpacity?: number;
    textShadow?: string;
  };
}

export interface Workspace {
  id: string;
  name: string;
  companyName: string;
  brandTheme?: WorkspaceBrandTheme;
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
