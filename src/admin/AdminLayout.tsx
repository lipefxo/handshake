import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { UserMenu } from '../auth/UserMenu';
import { AppIcon } from '../shared/icons/AppIcon';
import { BrandLogo } from '../shared/components/BrandLogo';
import { BrandWordmark } from '../shared/components/BrandWordmark';
import { useWorkspaceStore } from '../store/workspaceStore';
import { KeyboardCommandOverlay } from './components/KeyboardCommandOverlay';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/admin', label: 'Proposals', icon: 'ui.home', end: true },
  { to: '/admin/settings', label: 'Settings', icon: 'ui.settings', end: false },
];

export function AdminLayout() {
  const location = useLocation();
  const workspaceName = useWorkspaceStore((state) => state.currentWorkspace?.name);
  const isProposalEditorView = /^\/admin\/proposals\/[^/]+$/.test(location.pathname);
  const [isSidebarPinned, setIsSidebarPinned] = useState(() => !isProposalEditorView);
  const showTopProposalsLink = location.pathname !== '/admin';
  const isSidebarExpanded = isProposalEditorView ? false : isSidebarPinned;

  return (
    <div className="app-shell dark:bg-[var(--app-bg-canvas)] flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex shrink-0 flex-col border-r border-light bg-[var(--app-bg-canvas)]/94 backdrop-blur transition-all duration-200 ${
          isSidebarExpanded ? 'w-56' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div className={`py-4 border-b border-light ${isSidebarExpanded ? 'px-5' : 'px-2'}`}>
          <div className={`flex ${isSidebarExpanded ? 'items-center' : 'flex-col items-center justify-center gap-1'}`}>
            <div className={`flex items-center justify-center shrink-0 ${isSidebarExpanded ? 'w-10 h-10' : 'w-7 h-7'}`}>
              <BrandLogo
                variant="light"
                className={isSidebarExpanded ? 'w-8 h-8' : 'w-7 h-7'}
                aria-label="Handshake logo"
              />
            </div>
            {isSidebarExpanded && (
              <BrandWordmark variant="light" className="ml-0.5 h-3.5 w-auto" aria-label="Handshake" />
            )}
            <Button
              type="button"
              onClick={() => setIsSidebarPinned((prev) => !prev)}
              variant="ghost"
              size="icon"
              className={`shrink-0 text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] ${isSidebarExpanded ? 'ml-auto h-7 w-7' : 'h-6 w-6'}`}
              aria-label={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              title={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <AppIcon
                icon="ui.sidebar-toggle"
                className={`${isSidebarExpanded ? 'w-4 h-4' : 'w-3.5 h-3.5'} transition-transform ${isSidebarExpanded ? '' : 'rotate-180'}`}
              />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-4 ${isSidebarExpanded ? 'px-3' : 'px-2'}`}>
          {isSidebarExpanded && (
            <div className="px-2 mb-2">
              <p className="font-brand-mono text-[11px] uppercase tracking-[0.12em] text-[var(--app-text-muted)]">Workspace</p>
              <p className="mt-1 truncate text-xs text-[var(--app-text-secondary)]">{workspaceName ?? 'Loading...'}</p>
            </div>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={isSidebarExpanded ? undefined : item.label}
              className={({ isActive }) =>
                `mb-1 flex items-center rounded-[var(--app-radius-sm)] text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-1 ${isSidebarExpanded ? 'justify-start gap-2.5 px-2.5 py-2' : 'justify-center px-2 py-2.5'} ${
                  isActive
                    ? 'bg-[var(--app-accent-muted)] text-[var(--app-text-strong)] shadow-[inset_0_0_0_1px_rgba(245,78,0,0.12)]'
                    : 'text-[var(--app-text-muted)] hover:bg-[var(--accent)] hover:text-[var(--app-text-primary)]'
                }`
              }
            >
              <AppIcon icon={item.icon} className="w-4 h-4" />
              {isSidebarExpanded && item.label}
            </NavLink>
          ))}
        </nav>

      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-light bg-[var(--app-bg-overlay)] px-6 backdrop-blur">
          <div>
            {showTopProposalsLink && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 rounded-[var(--app-radius-sm)] px-1.5 py-1 text-sm text-[var(--app-text-muted)] transition-colors duration-150 hover:text-[var(--app-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
              >
                <AppIcon icon="ui.sidebar-toggle" className="w-4 h-4" />
                Proposals
              </Link>
            )}
          </div>
          <UserMenu />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto admin-scroll">
          <Outlet />
        </main>
      </div>
      <KeyboardCommandOverlay />
    </div>
  );
}
