import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  ChevronDown,
  FileSpreadsheet,
  RefreshCw,
  Menu,
  X as CloseIcon,
  User,
} from 'lucide-react';
import { supabase } from '../../../services/supabase/client';
import { fetchUserRoles } from '../../../services/supabase/adminService';
import { hasAnyAdminRole } from '../../../utils/rbac';
import './HeaderNavbar.css';

interface Props {
  isAdmin?: boolean;
  onSelectPrintView?: (view: 'pujari' | 'contributions' | 'expenses') => void;
  onSelectAdminConsole?: () => void;
  onSelectAdminSync?: () => void;
  onOpenContributionModal?: () => void;
  onOpenSponsorModal?: () => void;
  onOpenExpenseModal?: () => void;
  onExportCSV?: () => void;
  userFlat?: string;
  onOpenFlatPrompt?: () => void;
  onRefreshData?: () => void;
  isLoading?: boolean;
}

export const HeaderNavbar: React.FC<Props> = ({
  isAdmin,
  onSelectPrintView,
  onSelectAdminConsole: _onSelectAdminConsole,
  onSelectAdminSync,
  onOpenContributionModal: _onOpenContributionModal,
  onOpenSponsorModal: _onOpenSponsorModal,
  onOpenExpenseModal,
  onExportCSV,
  userFlat: propUserFlat,
  onOpenFlatPrompt,
  onRefreshData,
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [storedFlat, setStoredFlat] = useState<string>('');
  const [hasAuthAdminRole, setHasAuthAdminRole] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const checkRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const roles = await fetchUserRoles();
          if (isMounted) {
            setHasAuthAdminRole(hasAnyAdminRole(roles, session.user.email));
          }
        }
      } catch {
        // silent
      }
    };
    checkRole();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const flat = propUserFlat || localStorage.getItem('bps_ganesh_user_flat') || '';
    setStoredFlat(flat);
  }, [propUserFlat]);

  const effectiveFlat = propUserFlat || storedFlat;
  const cleanFlat = effectiveFlat.trim().toUpperCase();
  const isAdminFlat =
    cleanFlat === 'ADMN' ||
    cleanFlat === 'ADMIN' ||
    cleanFlat.includes('ADMN') ||
    cleanFlat.includes('ADMIN');

  const effectiveAdmin =
    isAdmin !== undefined
      ? isAdmin
      : (isAdminFlat || hasAuthAdminRole);

  const flatButtonText =
    effectiveFlat && effectiveFlat !== 'GUEST'
      ? effectiveAdmin
        ? '🛡️ Admin'
        : `Flat ${effectiveFlat.replace(/^FLAT\s*/i, '').toUpperCase()}`
      : 'Select Flat';

  const handleFlatClick = () => {
    if (onOpenFlatPrompt) {
      onOpenFlatPrompt();
    } else {
      navigate('/ganesh-utsav');
    }
  };

  const handleSyncClick = () => {
    if (onRefreshData) {
      onRefreshData();
    } else {
      window.location.reload();
    }
  };

  return (
    <header className="ganesh-navbar-root no-print">
      <div className="ganesh-navbar-container">
        {/* Brand: Shows ONLY "BPS TWIN TOWERS" with Logo and Dates */}
        <div
          className="ganesh-navbar-brand"
          onClick={() => navigate('/ganesh-utsav')}
          style={{ cursor: 'pointer' }}
        >
          <img
            src="/bps-logo.png"
            alt="BPS Twin Towers"
            style={{
              height: '38px',
              width: '38px',
              objectFit: 'contain',
              background: '#ffffff',
              padding: '2px',
              borderRadius: '8px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
              border: '1px solid #e2e8f0',
            }}
          />
          <div className="ganesh-navbar-title-wrap">
            <h1 className="ganesh-navbar-title" style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.98rem' }}>
              BPS TWIN TOWERS
            </h1>
            <div
              className="ganesh-navbar-dates"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.74rem',
                color: '#64748b',
                fontWeight: 600,
                marginTop: '1px',
              }}
            >
              <span>🪔</span>
              <span>14th Sep – 19th Sep 2026</span>
            </div>
          </div>
        </div>

        {/* Right Navigation Actions */}
        <div className="ganesh-navbar-actions">
          {/* Live Sync Button */}
          <button
            type="button"
            onClick={handleSyncClick}
            disabled={isLoading}
            className="ganesh-nav-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '20px',
              color: '#334155',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              padding: '0.38rem 0.8rem',
              fontSize: '0.8rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            title="Sync latest rows from Google Sheets"
          >
            <RefreshCw
              size={13}
              style={{
                animation: isLoading ? 'spin 1s linear infinite' : 'none',
              }}
            />
            <span>{isLoading ? '...' : 'Sync'}</span>
          </button>

          {/* Resident Flat Switcher Button */}
          <button
            type="button"
            onClick={handleFlatClick}
            className="ganesh-nav-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              background: '#fff7ed',
              border: '1.5px solid #fdba74',
              borderRadius: '20px',
              color: '#9a3412',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '0.38rem 0.85rem',
              fontSize: '0.8rem',
              boxShadow: '0 1px 3px rgba(234,88,12,0.08)',
            }}
            title="Click to change your Flat Number"
          >
            <span>🏠</span>
            <span>{flatButtonText}</span>
          </button>

          {/* Admin Menu Dropdown (if admin actions exist) */}
          {effectiveAdmin && (onOpenExpenseModal || onSelectAdminSync || onSelectPrintView) && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="ganesh-nav-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                title="Admin Menu"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  background: isDropdownOpen ? '#fef3c7' : '#fff7ed',
                  color: '#9a3412',
                  border: '1px solid #fed7aa',
                  fontWeight: 700,
                  borderRadius: '20px',
                  cursor: 'pointer',
                  padding: '0.38rem 0.65rem',
                }}
              >
                <Shield size={14} color="#ea580c" />
                <ChevronDown
                  size={12}
                  style={{
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      background: '#ffffff',
                      borderRadius: '14px',
                      border: '1px solid #fed7aa',
                      boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.18)',
                      padding: '0.45rem',
                      minWidth: '260px',
                      zIndex: 999,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.15rem',
                    }}
                  >
                    {onOpenExpenseModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenExpenseModal();
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'transparent',
                          color: '#c2410c',
                          fontWeight: 600,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <span>🧾</span>
                        <div>
                          <div style={{ fontWeight: 700 }}>Add Expense Form</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Upload voucher & receipt</div>
                        </div>
                      </button>
                    )}

                    {onSelectAdminSync && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAdminSync();
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'transparent',
                          color: '#065f46',
                          fontWeight: 600,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <FileSpreadsheet size={16} />
                        <div>
                          <div style={{ fontWeight: 700 }}>Google Sheets Sync</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Configure sheet IDs</div>
                        </div>
                      </button>
                    )}

                    {onExportCSV && (
                      <button
                        type="button"
                        onClick={() => {
                          onExportCSV();
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'transparent',
                          color: '#0369a1',
                          fontWeight: 600,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <span>📊</span>
                        <div>
                          <div style={{ fontWeight: 700 }}>Export Collections CSV</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Download Excel file</div>
                        </div>
                      </button>
                    )}

                    {onSelectPrintView && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPrintView('pujari');
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'transparent',
                          color: '#7c2d12',
                          fontWeight: 600,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <span>🖨️</span>
                        <div>
                          <div style={{ fontWeight: 700 }}>Print Archana Sheet</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>For morning sankalpam</div>
                        </div>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
