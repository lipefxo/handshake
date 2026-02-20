import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './auth/LoginPage';
import { AuthCallback } from './auth/AuthCallback';
import { AdminLayout } from './admin/AdminLayout';
import { ProposalList } from './admin/pages/ProposalList';
import { ProposalEditor } from './admin/pages/ProposalEditor';
import { ProposalSettings } from './admin/pages/ProposalSettings';
import { ProposalViewer } from './presentation/ProposalViewer';
import { ErrorBoundary } from './shared/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Admin routes — protected */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ProposalList />} />
              <Route path="proposals/new" element={<ProposalEditor />} />
              <Route path="proposals/:id" element={<ProposalEditor />} />
              <Route path="settings" element={<ProposalSettings />} />
            </Route>

            {/* Public proposal viewer */}
            <Route path="/p/:slug" element={<ProposalViewer />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
