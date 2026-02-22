import type { ThemeSlideTransition } from '../themes/themeTypes';

export type WorkspaceRole = 'owner' | 'member';
export type WorkspaceMemberStatus = 'active' | 'pending';

export interface WorkspaceBrandTheme {
  colors?: {
    bgPrimary?: string;
    bgSecondary?: string;
    accent?: string;
    accentHover?: string;
    textPrimary?: string;
    textSecondary?: string;
  };
  fonts?: {
    display?: string;
    displayWeight?: number;
    body?: string;
    bodyWeight?: number;
    googleFontsImport?: string;
  };
  style?: {
    borderRadius?: string;
    slideTransitionDefault?: ThemeSlideTransition;
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
