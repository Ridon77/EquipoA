import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { isAdminAuthenticated } from '../services/adminAuthService';

export function ProtectedAdminRoute({ children }: PropsWithChildren) {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
