import React, { useState } from 'react';
import { Shield, ChevronDown, FileSpreadsheet, RefreshCw, Menu, X as CloseIcon } from 'lucide-react';

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
  isAdmin = true,
  onSelectPrintView,
  onSelectAdminConsole: _onSelectAdminConsole,
  onSelectAdminSync,
  onOpenContributionModal: _onOpenContributionModal,
  onOpenSponsorModal: _onOpenSponsorModal,
  onOpenExpenseModal,
  onExportCSV,
  userFlat = '',
  onOpenFlatPrompt,
  onRefreshData,
  isLoading = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const cleanFlat = (userFlat || '').trim().toUpperCase();
  const isAdminFlat = cleanFlat === 'ADMN' || cleanFlat === 'ADMIN' || cleanFlat.includes('ADMN') || cleanFlat.includes('ADMIN');

  const flatButtonText = userFlat && userFlat !== 'GUEST'
    ? (isAdminFlat ? '🛡️ Admin' : `Flat ${userFlat.toUpperCase()}`)
    : 'Select Flat';

  return (
    <header className="ganesh-navbar-root no-print">
      <div className="ganesh-navbar-container">
        <div className="ganesh-navbar-brand">
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
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
            }}
          />
          <div className="ganesh-navbar-title-wrap">
            <h1 className="ganesh-navbar-title">
              BPS Twin Towers
            </h1>
            <span className="ganesh-navbar-subtitle">
              GANESH FESTIVAL PORTAL 2026
            </span>
          </div>
        </div>

        <div className="ganesh-navbar-actions">
          {/* Live Refresh Button */}
          {onRefreshData && (
            <button
              type="button"
              onClick={onRefreshData}
              disabled={isLoading}
              className="ganesh-nav-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '20px',
                color: '#475569',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
              title="Sync latest rows from Google Sheets"
            >
              <RefreshCw
                size={14}
                style={{
                  animation: isLoading ? 'spin 1s linear infinite' : 'none',
                }}
              />
              <span className="ganesh-nav-btn-text">{isLoading ? '...' : 'Sync'}</span>
            </button>
          )}

          {/* Resident Flat Switcher Button */}
          <button
            type="button"
            onClick={onOpenFlatPrompt}
            className="ganesh-nav-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: userFlat ? '#fff7ed' : '#f8fafc',
              border: userFlat ? '1.5px solid #fdba74' : '1px solid #cbd5e1',
              borderRadius: '20px',
              color: userFlat ? '#9a3412' : '#475569',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            title="Click to change your Flat Number"
          >
            <span>🏠</span>
            <span className="ganesh-nav-btn-text">{flatButtonText}</span>
            <span className="ganesh-nav-btn-text-mobile">
              {userFlat && userFlat !== 'GUEST' ? userFlat.replace(/^FLAT\s*/i, '').toUpperCase() : 'Flat'}
            </span>
          </button>

          {isAdmin && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="ganesh-nav-btn ganesh-hamburger-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                title="Admin & Print Menu"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  background: isDropdownOpen ? '#fef3c7' : '#fff7ed',
                  color: '#9a3412',
                  border: '1px solid #fed7aa',
                  fontWeight: 700,
                  borderRadius: '20px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <span className="desktop-only-flex" style={{ alignItems: 'center', gap: '0.25rem' }}>
                  <Shield size={14} color="#ea580c" />
                  <span>Admin Menu</span>
                  <ChevronDown
                    size={13}
                    style={{
                      transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </span>
                <span className="mobile-only-flex" style={{ alignItems: 'center', justifyContent: 'center' }}>
                  {isDropdownOpen ? <CloseIcon size={16} color="#c2410c" /> : <Menu size={16} color="#c2410c" />}
                </span>
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
                      boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.18), 0 4px 10px -2px rgba(0, 0, 0, 0.08)',
                      padding: '0.45rem',
                      minWidth: '280px',
                      zIndex: 999,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.15rem',
                    }}
                  >
                    {/* Entry Forms Section */}
                    <div
                      style={{
                        padding: '0.35rem 0.6rem 0.25rem 0.6rem',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: '#9a3412',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #ffedd5',
                        marginBottom: '0.15rem',
                      }}
                    >
                      Admin Entry Forms (Popup)
                    </div>



                    <button
                      type="button"
                      onClick={() => {
                        onOpenExpenseModal?.();
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
                      <span style={{ fontSize: '1.05rem' }}>🧾</span>
                      <div>
                        <div style={{ fontWeight: 700 }}>Expense Form</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Add expense voucher & receipt</div>
                      </div>
                    </button>


                    {/* Google Sheets Live Sync Action */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectAdminSync?.();
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #a7f3d0',
                        background: '#ecfdf5',
                        color: '#065f46',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        marginTop: '0.15rem',
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>🔗</span>
                      <div>
                        <div style={{ fontWeight: 700 }}>Google Sheets Live Sync</div>
                        <div style={{ fontSize: '0.7rem', color: '#047857' }}>Webhooks & Form Config</div>
                      </div>
                    </button>

                    {/* Reports & Print Section */}
                    <div style={{ height: '1px', background: '#ffedd5', margin: '0.25rem 0' }} />

                    <div
                      style={{
                        padding: '0.35rem 0.6rem 0.25rem 0.6rem',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: '#9a3412',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #ffedd5',
                        marginBottom: '0.15rem',
                      }}
                    >
                      Event Reports & Print
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectPrintView?.('pujari');
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
                      <span style={{ fontSize: '1.05rem' }}>🕉️</span>
                      <div>
                        <div style={{ fontWeight: 700 }}>Pujari Gothram Print</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Vedic Archana & family list</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectPrintView?.('contributions');
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
                      <span style={{ fontSize: '1.05rem' }}>💰</span>
                      <div>
                        <div style={{ fontWeight: 700 }}>Contribution & Sponsor Print</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Collections registry & donors</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectPrintView?.('expenses');
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
                        color: '#9f1239',
                        fontWeight: 600,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <span style={{ fontSize: '1.05rem' }}>🧾</span>
                      <div>
                        <div style={{ fontWeight: 700 }}>Expense Print Sheet</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Audited payout ledger</div>
                      </div>
                    </button>

                    <div style={{ height: '1px', background: '#ffedd5', margin: '0.25rem 0' }} />

                    <button
                      type="button"
                      onClick={() => {
                        onExportCSV?.();
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
                        color: '#334155',
                        fontWeight: 600,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <FileSpreadsheet size={16} color="#059669" />
                      <div>
                        <div style={{ fontWeight: 700 }}>Export CSV Data</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Download Excel / CSV file</div>
                      </div>
                    </button>
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
