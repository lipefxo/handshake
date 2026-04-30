import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuthStore } from '../store/authStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function UserMenu() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [busyAction, setBusyAction] = useState<'local' | 'global' | null>(null);

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '??';

  const handleSignOut = async () => {
    setBusyAction('local');
    await supabase.auth.signOut();
    localStorage.clear();
    setBusyAction(null);
    navigate('/login', { replace: true });
  };

  const handleSignOutEverywhere = async () => {
    if (!user) return;
    setBusyAction('global');
    const { error } = await supabase.functions.invoke('signout-everywhere', {
      body: { userId: user.id },
    });

    if (error) {
      console.error('Global sign out failed:', error);
    }

    await supabase.auth.signOut();
    localStorage.clear();
    setBusyAction(null);
    navigate('/login', { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto gap-2 px-3 py-1.5 text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-[var(--app-text-strong)] text-xs font-semibold text-[var(--app-text-inverse)]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-32 truncate text-sm">{user?.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate text-xs">{user?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOutEverywhere} disabled={busyAction !== null}>
          {busyAction === 'global' ? 'Signing out everywhere…' : 'Sign out everywhere'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600" disabled={busyAction !== null}>
          {busyAction === 'local' ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
