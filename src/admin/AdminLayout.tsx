import { NavLink, Outlet } from 'react-router-dom';
import { UserMenu } from '../auth/UserMenu';

const navItems = [
  { to: '/admin', label: 'Proposals', icon: '◎', end: true },
  { to: '/admin/settings', label: 'Settings', icon: '⚙', end: false },
];

export function AdminLayout() {
  return (
    <div className="flex h-screen bg-admin overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-light bg-white flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-light">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Handshake</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">Workspace</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span className="text-xs">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-light">
          <a
            href="https://partners.securebags.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-2.5 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Public site
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-light bg-white flex items-center justify-end px-6 flex-shrink-0">
          <UserMenu />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto admin-scroll">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
