
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If allowedRoles are specified, check if the user's role is included.
  // This provides fine-grained access control for specific pages like the admin panel.
  const isAuthorized = !allowedRoles || (user && allowedRoles.includes(user.role));

  if (!isAuthorized) {
    // Redirect unauthorized users to the dashboard.
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
