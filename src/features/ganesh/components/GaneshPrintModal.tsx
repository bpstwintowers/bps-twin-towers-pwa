import React from 'react';
import { Printer, X } from 'lucide-react';
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
        }}
      >
        {/* Modal Top Bar (Hidden during Print) */}
        <div
          className="ganesh-modal-header no-print"
          style={{
            padding: '1rem 1.5rem',
            background: '#fff7ed',
            borderBottom: '1px solid #fed7aa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Printer size={20} color="#ea580c" />
            <h3 style={{ margin: 0, color: '#9a3412', fontSize: '1.2rem', fontWeight: 800 }}>
              {getTitle()}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-festive-primary"
              onClick={() => window.print()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1.2rem',
                fontSize: '0.9rem',
                background: '#ea580c',
                color: '#ffffff',
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
            padding: '2rem',
            overflowY: 'auto',
            background: '#ffffff',
            flex: 1,
          }}
        >
          {/* ========================================================
              1. PUJARI GOTHRAM PRINT SHEET
             ======================================================== */}
          {printType === 'pujari' && (
            <div className="sankalpam-printable-sheet">
              <div style={{ textAlign: 'center', borderBottom: '2px solid #b45309', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: '#7c2d12', fontSize: '1.8rem', fontWeight: 800 }}>
                  🕉️ BPS TWIN TOWERS - GANESH UTSAV 2026
                </h2>
                <h3 style={{ margin: '0.3rem 0', color: '#b45309', fontSize: '1.25rem', fontWeight: 700 }}>
                  Pujari Archana & Gothram Registry
                </h3>
                <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
                  Official resident names and Gothrams for Vedic Mantrocharana and Archana
                </p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#047857', fontWeight: 700 }}>
                  Total Registered Families: {sankalpams.length}
                </div>
              </div>

              <div className="ganesh-table-container">
                <table className="ganesh-table" style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ background: '#fef3c7' }}>
                      <th style={{ width: '55px', textAlign: 'center' }}>Sl No</th>
                      <th style={{ width: '85px', textAlign: 'center' }}>Flat</th>
                      <th style={{ width: '180px' }}>Gothram</th>
                      <th style={{ width: '200px' }}>Primary Resident / Yajamana</th>
                      <th>Family Members</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sankalpams.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 700, textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ textAlign: 'center' }}>
                          <strong>{item.flatNo}</strong>
                        </td>
                        <td style={{ fontWeight: 800, color: '#9a3412' }}>{item.gothram}</td>
                        <td>
                          <strong>{item.primaryResidentName}</strong>
                        </td>
                        <td>
                          <ol style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.4' }}>
                            {item.familyMembers.map((m) => (
                              <li key={m.id}>
                                <strong>{m.name}</strong> {m.relationship ? `(${m.relationship})` : ''}{' '}
                                {m.nakshatram ? ` [${m.nakshatram}]` : ''}
                              </li>
                            ))}
                          </ol>
                        </td>
                      </tr>
                    ))}
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
