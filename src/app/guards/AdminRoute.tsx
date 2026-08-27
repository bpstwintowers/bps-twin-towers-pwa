import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import { checkIsAdmin } from '../../services/supabase/adminService';

export const AdminRoute: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setHasSession(false);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setHasSession(true);
        const adminStatus = await checkIsAdmin();
        setIsAdmin(adminStatus);
      } catch (err) {
        console.error('Admin verification failed:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, []);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div className="animate-fade-in" style={{ color: 'var(--text-muted)' }}>
          Verifying Admin Access...
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
