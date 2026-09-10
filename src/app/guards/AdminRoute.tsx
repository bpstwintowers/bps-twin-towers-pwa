import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import { fetchUserRoles } from '../../services/supabase/adminService';
import { hasRequiredRole, hasAnyAdminRole } from '../../utils/rbac';

interface AdminRouteProps {
  requiredRoles?: string[];
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ requiredRoles }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setHasSession(false);
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        setHasSession(true);
        const userRoles = await fetchUserRoles();
        
        if (requiredRoles && requiredRoles.length > 0) {
          const authorized = hasRequiredRole(userRoles, requiredRoles, session.user.email);
          setIsAuthorized(authorized);
        } else {
          const authorized = hasAnyAdminRole(userRoles, session.user.email);
          setIsAuthorized(authorized);
        }
      } catch (err) {
        console.error('Admin route verification failed:', err);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAccess();
  }, [requiredRoles]);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh' }}>
        <div className="animate-fade-in" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Verifying permissions...
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
