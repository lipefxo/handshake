import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './auth/LoginPage';
import { AuthCallback } from './auth/AuthCallback';
import { AdminLayout } from './admin/AdminLayout';
import { ProposalList } from './admin/pages/ProposalList';
import { ProposalEditor } from './admin/pages/ProposalEditor';
import { ProposalSettings } from './admin/pages/ProposalSettings';
import { ProposalSettingsPage } from './admin/pages/ProposalSettingsPage';
import { ProposalAnalytics } from './admin/pages/ProposalAnalytics';
import { ProposalViewer } from './presentation/ProposalViewer';
import { ShortCodeRedirect } from './presentation/ShortCodeRedirect';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { ToastViewport } from './shared/components/ToastViewport';
import { LandingPage } from './landing/LandingPage';
import { TermsPage } from './landing/TermsPage';
import { PrivacyPage } from './landing/PrivacyPage';
import { ShakegroundPage } from './shakeground/ShakegroundPage';
import { useAuthStore } from './store/authStore';
import { Agentation } from 'agentation';

const AGENTATION_ALLOWED_EMAIL = (
  import.meta.env.VITE_AGENTATION_ALLOWED_EMAIL ?? 'lipefxo@gmail.com'
).trim().toLowerCase();

function AgentationGate() {
  const location = useLocation();
  const userEmail = useAuthStore((state) => state.user?.email?.toLowerCase() ?? '');
  const isAllowedUser = AGENTATION_ALLOWED_EMAIL.length > 0 && userEmail === AGENTATION_ALLOWED_EMAIL;
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isEmbeddedPresentationPreview =
    location.pathname.startsWith('/p/') &&
    location.hash.includes('preview') &&
    window.self !== window.top;

  if (!isAllowedUser || !isAdminRoute || isEmbeddedPresentationPreview) {
    return null;
  }

  return <Agentation />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

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
              <Route path="proposals/:id/settings" element={<ProposalSettingsPage />} />
              <Route path="proposals/:id/analytics" element={<ProposalAnalytics />} />
              <Route path="settings" element={<ProposalSettings />} />
            </Route>

            {/* Design system */}
            <Route
              path="/shakeground"
              element={
                <ProtectedRoute>
                  <ShakegroundPage />
                </ProtectedRoute>
              }
            />

            {/* Public proposal viewer */}
            <Route path="/p/:slug" element={<ProposalViewer />} />
            <Route path="/s/:code" element={<ShortCodeRedirect />} />

            {/* Catch-all → admin */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
          <AgentationGate />
          <ToastViewport />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
