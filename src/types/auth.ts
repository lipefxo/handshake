export interface AppUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: AppUser | null;
  loading: boolean;
  initialized: boolean;
}
