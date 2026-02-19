import { create } from 'zustand';
import type { AppUser } from '../types/auth';

interface AuthStore {
  user: AppUser | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
}));
