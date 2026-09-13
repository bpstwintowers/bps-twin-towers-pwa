import React, { useState, useEffect } from 'react';
import {
  fetchLiveExpenses,
  getCachedExpenses,
} from '../../services/liveSheetService';
import type { GaneshExpenseRecord } from '../../types/ganesh';
import { HeaderNavbar } from './components/HeaderNavbar';
import { GaneshExpenseTracker } from './components/GaneshExpenseTracker';
import { GaneshBottomNav } from './components/GaneshBottomNav';
import './GaneshExpenseTracker.css';

export const GaneshExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<GaneshExpenseRecord[]>(() => getCachedExpenses());
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const list = await fetchLiveExpenses();
      setExpenses(list);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
          totalCollections={334608}
          onRefresh={loadData}
        />
      </main>

      {/* Floating Bottom Nav */}
      <GaneshBottomNav />
    </div>
  );
};
