import React, { useState, useMemo } from 'react';
import { Printer, X, Calendar } from 'lucide-react';
import type {
  GaneshSankalpamRecord,
  GaneshContributionRecord,
  GaneshExpenseRecord,
} from '../../../types/ganesh';

export type GaneshPrintType = 'pujari' | 'contributions' | 'expenses';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  printType: GaneshPrintType | null;
  sankalpams: GaneshSankalpamRecord[];
  contributions: GaneshContributionRecord[];
  expenses: GaneshExpenseRecord[];
}

export const GaneshPrintModal: React.FC<Props> = ({
  isOpen,
  onClose,
  printType,
  sankalpams,
  contributions,
  expenses,
}) => {
  const [selectedPoojaDate, setSelectedPoojaDate] = useState<string>('ALL');

  const availablePoojaDates = useMemo(() => {
    const set = new Set<string>();
    sankalpams.forEach((s) => {
      if (s.preferredPujaDate && s.preferredPujaDate.trim()) {
        set.add(s.preferredPujaDate.trim());
      }
    });
    return Array.from(set).sort();
  }, [sankalpams]);

  const filteredSankalpams = useMemo(() => {
    if (selectedPoojaDate === 'ALL') return sankalpams;
    return sankalpams.filter((s) => {
      if (!s.preferredPujaDate) return false;
      return s.preferredPujaDate.trim() === selectedPoojaDate.trim();
    });
  }, [sankalpams, selectedPoojaDate]);

  if (!isOpen || !printType) return null;

  const totalContributions = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const towerAContributions = contributions.filter((c) => c.tower === 'A');
  const towerBContributions = contributions.filter((c) => c.tower === 'B');
  const towerATotal = towerAContributions.reduce((s, c) => s + (c.amount || 0), 0);
  const towerBTotal = towerBContributions.reduce((s, c) => s + (c.amount || 0), 0);

  const getTitle = () => {
    switch (printType) {
      case 'pujari':
        return '🕉️ Pujari Gothram Print Sheet';
      case 'contributions':
        return '💰 Contributions & Sponsors Print Sheet';
      case 'expenses':
        return '🧾 Expenses Ledger Print Sheet';
      default:
        return 'Print Document';
    }
  };

  return (
    <div className="ganesh-modal-overlay ganesh-print-modal-overlay" onClick={onClose}>
      <div
        className="ganesh-modal-content ganesh-print-sheet-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '960px',
          width: '96vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          color: '#0f172a',
        }}
      >
        {/* Modal Top Bar (Hidden during Print) */}
        <div
          className="ganesh-modal-header no-print ganesh-print-modal-header"
          style={{
            padding: '0.85rem 1.35rem',
            background: '#fff7ed',
            borderBottom: '1.5px solid #fed7aa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Printer size={20} color="#ea580c" />
            <h3
              style={{
                margin: 0,
                color: '#7c2d12',
                fontSize: '1.2rem',
                fontWeight: 900,
                letterSpacing: '-0.01em',
              }}
            >
              {getTitle()}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Medium size Pooja Date Filter Dropdown in Header */}
            {printType === 'pujari' && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <select
                  id="pooja-date-select"
                  value={selectedPoojaDate}
                  onChange={(e) => setSelectedPoojaDate(e.target.value)}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #ea580c',
                    color: '#7c2d12',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '220px',
                    boxShadow: '0 1px 3px rgba(234, 88, 12, 0.1)',
                  }}
                  title="Filter by Pooja Date"
                >
                  <option value="ALL">🗓️ All Dates ({sankalpams.length} Families)</option>
                  {availablePoojaDates.map((date) => {
                    const count = sankalpams.filter((s) => s.preferredPujaDate === date).length;
                    return (
                      <option key={date} value={date}>
                        🗓️ {date} ({count} Families)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <button
              type="button"
              className="btn-festive-primary"
              onClick={() => window.print()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 1.1rem',
                fontSize: '0.88rem',
                background: '#ea580c',
                color: '#ffffff',
                fontWeight: 700,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(234, 88, 12, 0.25)',
              }}
            >
              <Printer size={16} /> Print Document
            </button>

            <button
              type="button"
              className="ganesh-modal-close-btn"
              onClick={onClose}
              aria-label="Close Print Preview"
              style={{
                background: '#ffedd5',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9a3412',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body - Pure Printable Sheet Content */}
        <div
          style={{
            padding: '1.75rem',
            overflowY: 'auto',
            background: '#ffffff',
            color: '#0f172a',
            flex: 1,
          }}
        >
          {/* ========================================================
              1. PUJARI GOTHRAM PRINT SHEET
             ======================================================== */}
          {printType === 'pujari' && (
            <div className="sankalpam-printable-sheet" style={{ color: '#0f172a' }}>
              {/* Printable Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #b45309', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: '#7c2d12', fontSize: '1.8rem', fontWeight: 800 }}>
                  🕉️ BPS TWIN TOWERS - GANESH UTSAV 2026
                </h2>
                <h3 style={{ margin: '0.3rem 0', color: '#b45309', fontSize: '1.25rem', fontWeight: 700 }}>
                  Pujari Archana &amp; Gothram Registry
                </h3>
                <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
                  Official resident names and Gothrams for Vedic Mantrocharana and Archana
                </p>
                <div
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.88rem',
                    color: '#047857',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <span>
                    Total Registered Families: <strong>{filteredSankalpams.length}</strong>
                  </span>
                  {selectedPoojaDate !== 'ALL' && (
                    <span style={{ color: '#b45309' }}>
                      • Date: <strong>{selectedPoojaDate}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="ganesh-table-container">
                <table className="ganesh-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#0f172a' }}>
                  <thead>
                    <tr style={{ background: '#fef3c7', borderBottom: '2px solid #fde68a' }}>
                      <th style={{ width: '50px', textAlign: 'center', color: '#78350f', padding: '0.75rem 0.5rem', fontWeight: 800 }}>Sl No</th>
                      <th style={{ width: '85px', textAlign: 'center', color: '#78350f', padding: '0.75rem 0.5rem', fontWeight: 800 }}>Flat</th>
                      <th style={{ width: '180px', color: '#78350f', padding: '0.75rem 0.5rem', fontWeight: 800 }}>Gothram</th>
                      <th style={{ width: '200px', color: '#78350f', padding: '0.75rem 0.5rem', fontWeight: 800 }}>Primary Resident / Yajamana</th>
                      <th style={{ color: '#78350f', padding: '0.75rem 0.5rem', fontWeight: 800 }}>Family Members</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSankalpams.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                          No registered families found for this date.
                        </td>
                      </tr>
                    ) : (
                      filteredSankalpams.map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ fontWeight: 700, textAlign: 'center', color: '#334155', padding: '0.75rem 0.5rem' }}>{idx + 1}</td>
                          <td style={{ textAlign: 'center', color: '#0f172a', padding: '0.75rem 0.5rem' }}>
                            <strong style={{ fontSize: '0.95rem' }}>{item.flatNo}</strong>
                          </td>
                          <td style={{ fontWeight: 800, color: '#9a3412', padding: '0.75rem 0.5rem' }}>{item.gothram}</td>
                          <td style={{ color: '#0f172a', padding: '0.75rem 0.5rem' }}>
                            <strong style={{ fontSize: '0.92rem' }}>{item.primaryResidentName}</strong>
                          </td>
                          <td style={{ color: '#1e293b', padding: '0.75rem 0.5rem' }}>
                            <ol style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.4', color: '#1e293b' }}>
                              {item.familyMembers.map((m) => (
                                <li key={m.id} style={{ color: '#1e293b', marginBottom: '2px' }}>
                                  <strong style={{ color: '#0f172a' }}>{m.name}</strong> {m.relationship ? `(${m.relationship})` : ''}{' '}
                                  {m.nakshatram ? ` [${m.nakshatram}]` : ''}
                                </li>
                              ))}
                            </ol>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              2. CONTRIBUTIONS & SPONSORS PRINT SHEET
             ======================================================== */}
          {printType === 'contributions' && (
            <div className="sankalpam-printable-sheet">
              <div style={{ textAlign: 'center', borderBottom: '2px solid #047857', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: '#065f46', fontSize: '1.8rem', fontWeight: 800 }}>
                  🕉️ BPS TWIN TOWERS - GANESH UTSAV 2026
                </h2>
                <h3 style={{ margin: '0.3rem 0', color: '#047857', fontSize: '1.25rem', fontWeight: 700 }}>
                  Official Contributions & Sponsors Collection Registry
                </h3>
                <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
                  Voluntary contributions & special pooja sponsorships by community residents
                </p>
              </div>

              {/* Metric Badges for Print / Screen */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '10px', flex: 1, minWidth: '160px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Total Collections</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#065f46' }}>₹{totalContributions.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.75rem 1rem', borderRadius: '10px', flex: 1, minWidth: '160px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase' }}>Tower A Collection</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e40af' }}>₹{towerATotal.toLocaleString('en-IN')} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>({towerAContributions.length} entries)</span></div>
                </div>
                <div style={{ background: '#fdf4ff', border: '1px solid #f5d0fe', padding: '0.75rem 1rem', borderRadius: '10px', flex: 1, minWidth: '160px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#a21caf', fontWeight: 700, textTransform: 'uppercase' }}>Tower B Collection</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#86198f' }}>₹{towerBTotal.toLocaleString('en-IN')} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>({towerBContributions.length} entries)</span></div>
                </div>
              </div>

              <div className="ganesh-table-container">
                <table className="ganesh-table" style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ background: '#ecfdf5' }}>
                      <th style={{ width: '50px', textAlign: 'center' }}>Sl</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>Flat</th>
                      <th>Contributor / Sponsor Name</th>
                      <th>Type / Category</th>
                      <th style={{ width: '90px' }}>Mode</th>
                      <th style={{ width: '130px' }}>Ref / UTR</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Amount (₹)</th>
                      <th style={{ width: '105px' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.map((c, idx) => (
                      <tr key={c.id}>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ textAlign: 'center' }}><strong>{c.flatNo}</strong></td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.donorName}</div>
                          {c.isSponsor && c.sponsorCategory && (
                            <div style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 600 }}>
                              ⭐ {c.sponsorCategory}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`chip-badge ${c.isSponsor ? 'badge-sponsor' : 'badge-general'}`}>
                            {c.isSponsor ? 'Sponsorship' : c.contributionType}
                          </span>
                        </td>
                        <td>{c.paymentMode}</td>
                        <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{c.transactionRef || '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#047857' }}>
                          ₹{c.amount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{c.createdAt ? c.createdAt.split('T')[0] : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#ecfdf5', fontWeight: 800 }}>
                      <td colSpan={6} style={{ textAlign: 'right' }}>Total Collections:</td>
                      <td style={{ textAlign: 'right', color: '#047857', fontSize: '1.05rem' }}>
                        ₹{totalContributions.toLocaleString('en-IN')}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              3. EXPENSES LEDGER PRINT SHEET
             ======================================================== */}
          {printType === 'expenses' && (
            <div className="sankalpam-printable-sheet">
              <div style={{ textAlign: 'center', borderBottom: '2px solid #be123c', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: '#881337', fontSize: '1.8rem', fontWeight: 800 }}>
                  🕉️ BPS TWIN TOWERS - GANESH UTSAV 2026
                </h2>
                <h3 style={{ margin: '0.3rem 0', color: '#be123c', fontSize: '1.25rem', fontWeight: 700 }}>
                  Official Festival Expenses & Vendor Payouts Ledger
                </h3>
                <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
                  Audited statement of puja samagri, decoration, food prasadam, and event payouts
                </p>
              </div>

              {/* Metric Badges for Expense Sheet */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '0.75rem 1rem', borderRadius: '10px', flex: 1, minWidth: '160px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#be123c', fontWeight: 700, textTransform: 'uppercase' }}>Total Expenses Spent</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#9f1239' }}>₹{totalExpenses.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '10px', flex: 1, minWidth: '160px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Total Collections</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#065f46' }}>₹{totalContributions.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem 1rem', borderRadius: '10px', flex: 1, minWidth: '160px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Net Balance</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: (totalContributions - totalExpenses) >= 0 ? '#047857' : '#be123c' }}>
                    ₹{(totalContributions - totalExpenses).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="ganesh-table-container">
                <table className="ganesh-table" style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ background: '#fff1f2' }}>
                      <th style={{ width: '50px', textAlign: 'center' }}>Sl</th>
                      <th style={{ width: '95px' }}>Date</th>
                      <th>Expense Description</th>
                      <th style={{ width: '160px' }}>Category</th>
                      <th>Paid To / Vendor</th>
                      <th style={{ width: '85px' }}>Mode</th>
                      <th style={{ width: '110px' }}>Invoice / Bill</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e, idx) => (
                      <tr key={e.id}>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{e.expenseDate}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{e.title}</div>
                          {e.notes && <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{e.notes}</div>}
                        </td>
                        <td>
                          <span className="category-tag">{e.category}</span>
                        </td>
                        <td><strong>{e.paidTo}</strong></td>
                        <td>{e.paymentMode}</td>
                        <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{e.invoiceNo || '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#be123c' }}>
                          ₹{e.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#fff1f2', fontWeight: 800 }}>
                      <td colSpan={7} style={{ textAlign: 'right' }}>Total Expenses:</td>
                      <td style={{ textAlign: 'right', color: '#be123c', fontSize: '1.05rem' }}>
                        ₹{totalExpenses.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
