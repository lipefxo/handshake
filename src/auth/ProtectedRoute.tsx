import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, initialized } = useAuthStore();

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-admin">
        <div className="w-8 h-8 border-2 border-[#e5e3de] border-t-[#d4785c] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
