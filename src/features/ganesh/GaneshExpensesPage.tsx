import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchLiveExpenses,
  fetchLiveContributions,
  getCachedExpenses,
  getCachedContributions,
} from '../../services/liveSheetService';
import type { GaneshExpenseRecord } from '../../types/ganesh';
import { supabase } from '../../services/supabase/client';
import { fetchUserRoles } from '../../services/supabase/adminService';
import { hasAnyAdminRole } from '../../utils/rbac';
import { HeaderNavbar } from './components/HeaderNavbar';
import { GaneshExpenseTracker } from './components/GaneshExpenseTracker';
import { GaneshBottomNav } from './components/GaneshBottomNav';
import './GaneshExpenseTracker.css';

export const GaneshExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<GaneshExpenseRecord[]>(() => getCachedExpenses());
  const [totalCollections, setTotalCollections] = useState<number>(() => {
    const cached = getCachedContributions();
    return cached.reduce((sum, c) => sum + (c.amount || 0), 0) || 334608;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasAuthAdminRole, setHasAuthAdminRole] = useState(false);
  const [userFlat, setUserFlat] = useState(() => localStorage.getItem('bps_ganesh_user_flat') || '');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [expList, contList] = await Promise.all([
        fetchLiveExpenses(),
        fetchLiveContributions(),
      ]);
      setExpenses(expList);
      if (contList && contList.length > 0) {
        const sum = contList.reduce((acc, c) => acc + (c.amount || 0), 0);
        setTotalCollections(sum);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const roles = await fetchUserRoles();
          const isAdm = hasAnyAdminRole(roles, session.user.email);
          setHasAuthAdminRole(isAdm);
        } else {
          setHasAuthAdminRole(false);
        }
      } catch {
        setHasAuthAdminRole(false);
      }
    };
    checkAdmin();
  }, []);

  const isAdminUser = useMemo(() => {
    if (hasAuthAdminRole) return true;
    const clean = (userFlat || '').trim().toUpperCase();
    return clean === 'ADMN' || clean === 'ADMIN' || clean.includes('ADMN') || clean.includes('ADMIN');
  }, [hasAuthAdminRole, userFlat]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#1e293b',
        paddingBottom: '90px',
      }}
    >
      {/* Home Page Style Header Navbar */}
      <HeaderNavbar
        isAdmin={isAdminUser}
        userFlat={userFlat}
        onRefreshData={loadData}
        isLoading={isLoading}
      />

      {/* Main Content */}
      <main
        style={{
          maxWidth: '540px',
          margin: '0 auto',
          padding: '1.25rem 1rem 2.5rem',
        }}
      >
        <GaneshExpenseTracker
          expenses={expenses}
          totalCollections={totalCollections}
          onRefresh={loadData}
          isAdmin={isAdminUser}
        />
      </main>

      {/* Floating Bottom Nav */}
      <GaneshBottomNav />
    </div>
  );
};
