import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { UserMenu } from '../auth/UserMenu';
import { AppIcon } from '../shared/icons/AppIcon';
import { KeyboardCommandOverlay } from './components/KeyboardCommandOverlay';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/admin', label: 'Proposals', icon: 'ui.home', end: true },
  { to: '/admin/settings', label: 'Settings', icon: 'ui.settings', end: false },
];

export function AdminLayout() {
  const location = useLocation();
  const isProposalEditorView = /^\/admin\/proposals\/[^/]+$/.test(location.pathname);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => !isProposalEditorView);
  const showTopProposalsLink = location.pathname !== '/admin';

  useEffect(() => {
    if (isProposalEditorView) {
      setIsSidebarExpanded(false);
    }
  }, [isProposalEditorView]);

  return (
    <div className="flex h-screen bg-admin overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 border-r border-light bg-white flex flex-col transition-all duration-200 ${
          isSidebarExpanded ? 'w-56' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div className={`py-4 border-b border-light ${isSidebarExpanded ? 'px-5' : 'px-2'}`}>
          <div className={`flex ${isSidebarExpanded ? 'items-center justify-between' : 'flex-col items-center justify-center gap-1'}`}>
            <div
              className={`rounded-lg bg-gray-900 flex items-center justify-center shrink-0 ${
                isSidebarExpanded ? 'w-7 h-7' : 'w-6 h-6'
              }`}
            >
              <AppIcon icon="ui.home" className={`${isSidebarExpanded ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-white`} />
            </div>
            {isSidebarExpanded && <span className="font-semibold text-gray-900 text-sm">Handshake</span>}
            <Button
              type="button"
              onClick={() => setIsSidebarExpanded((prev) => !prev)}
              variant="ghost"
              size="icon"
              className={`text-gray-500 hover:text-gray-900 shrink-0 ${isSidebarExpanded ? 'h-7 w-7' : 'h-6 w-6'}`}
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
          {isSidebarExpanded && <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">Workspace</p>}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={isSidebarExpanded ? undefined : item.label}
              className={({ isActive }) =>
                `flex items-center ${isSidebarExpanded ? 'gap-2.5 px-2.5 py-2 justify-start' : 'justify-center px-2 py-2.5'} rounded-lg text-sm transition-colors duration-150 mb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1 ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
        <header className="h-14 border-b border-light bg-white flex items-center justify-between px-6 flex-shrink-0">
          <div>
            {showTopProposalsLink && (
              <Link
                to="/admin"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-150 flex items-center gap-1.5 rounded-md px-1.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
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
