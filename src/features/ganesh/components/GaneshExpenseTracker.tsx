import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Receipt,
  Search,
  FileSpreadsheet,
  Trash2,
  DollarSign,
  Play,
  Pause,
  X,
} from 'lucide-react';
import type {
  GaneshExpenseRecord,
  GaneshExpenseCategory,
  GaneshPaymentMode,
} from '../../../types/ganesh';
import {
  addGaneshExpense,
  deleteGaneshExpense,
  exportGaneshExpensesCSV,
} from '../../../services/ganeshService';

interface Props {
  expenses: GaneshExpenseRecord[];
  totalCollections: number;
  onRefresh: () => void;
  isAdmin?: boolean;
}

const CATEGORIES: GaneshExpenseCategory[] = [
  'Idol & Visarjan',
  'Priest & Puja Samagri',
  'Mahaprasadam & Food',
  'Pandal & Decoration',
  'Sound & Lighting',
  'Cultural Events & Gifts',
  'Security & Cleaning',
  'Misc & Contingency',
];

export const GaneshExpenseTracker: React.FC<Props> = ({
  expenses,
  totalCollections,
  onRefresh,
  isAdmin = true,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const viewFormat: 'cards' | 'table' = 'cards';

  // Auto-Scroll State for Expenses Cards Feed
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isAutoScrollPaused || isHovered) return;

    const scrollInterval = setInterval(() => {
      if (el) {
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
          el.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          el.scrollTop += 1.2;
        }
      }
    }, 40);

    return () => clearInterval(scrollInterval);
  }, [isAutoScrollPaused, isHovered]);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GaneshExpenseCategory>('Pandal & Decoration');
  const [amount, setAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [paymentMode, setPaymentMode] = useState<GaneshPaymentMode>('UPI');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [approvedBy, setApprovedBy] = useState('Festival Committee');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Paid' | 'Pending Reimbursement' | 'Planned'>('Paid');

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    CATEGORIES.forEach((c) => (totals[c] = 0));
    expenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      totals[e.category] = (totals[e.category] || 0) + amt;
    });
    return totals;
  }, [expenses]);

  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const netRemaining = totalCollections - totalSpent;

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesCat = selectedCategory === 'ALL' || e.category === selectedCategory;
      const q = search.toLowerCase();
      const matchesSearch =
        !search.trim() ||
        e.title.toLowerCase().includes(q) ||
        e.paidTo.toLowerCase().includes(q) ||
        (e.invoiceNo && e.invoiceNo.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [expenses, selectedCategory, search]);

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(amount);
    if (!title.trim() || isNaN(amtNum) || amtNum <= 0) {
      alert('Please provide valid title and amount');
      return;
    }

    addGaneshExpense({
      title: title.trim(),
      category,
      amount: amtNum,
      paidTo: paidTo.trim() || 'Vendor',
      paymentMode,
      expenseDate,
      invoiceNo: invoiceNo.trim() || undefined,
      approvedBy: approvedBy.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
    });

    setIsAddModalOpen(false);
    setTitle('');
    setAmount('');
    setPaidTo('');
    setInvoiceNo('');
    setNotes('');
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      deleteGaneshExpense(id);
      onRefresh();
    }
  };

  const handleExportCSV = () => {
    const csv = exportGaneshExpensesCSV(expenses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ganesh_Utsav_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Top Expense Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="ganesh-metric-card">
          <div className="ganesh-metric-icon-wrap icon-rose">
            <Receipt size={22} />
          </div>
          <div className="ganesh-metric-info">
            <span className="ganesh-metric-label">Total Expenses Incurred</span>
            <span className="ganesh-metric-value" style={{ color: '#be123c' }}>
              ₹{totalSpent.toLocaleString('en-IN')}
            </span>
            <span className="ganesh-metric-subtext">{expenses.length} Verified Invoices</span>
          </div>
        </div>

        <div className="ganesh-metric-card">
          <div className="ganesh-metric-icon-wrap icon-emerald">
            <DollarSign size={22} />
          </div>
          <div className="ganesh-metric-info">
            <span className="ganesh-metric-label">Net Balance Surplus</span>
            <span
              className="ganesh-metric-value"
              style={{ color: netRemaining >= 0 ? '#047857' : '#e11d48' }}
            >
              ₹{netRemaining.toLocaleString('en-IN')}
            </span>
            <span className="ganesh-metric-subtext">Collections - Total Expenses</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Chips Grid */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e293b', fontSize: '0.95rem', fontWeight: 700 }}>
          📊 Category-wise Expenditure Breakdown
        </h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '0.65rem',
          }}
        >
          {CATEGORIES.map((cat) => {
            const spent = categoryTotals[cat] || 0;
            const percentage = totalSpent > 0 ? ((spent / totalSpent) * 100).toFixed(1) : '0';

            return (
              <div
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? 'ALL' : cat)}
                style={{
                  background: selectedCategory === cat ? '#ffedd5' : '#ffffff',
                  border: `1.5px solid ${selectedCategory === cat ? '#ea580c' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '0.75rem 0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{cat}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0.15rem 0' }}>
                  ₹{spent.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: 600 }}>
                  {percentage}% of Total
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="ganesh-toolbar">
        <div className="ganesh-search-wrap">
          <Search className="ganesh-search-icon" size={14} />
          <input
            type="text"
            className="ganesh-search-input"
            placeholder="Search by Expense Item, Vendor, or Bill No..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="ganesh-search-clear-btn"
              onClick={() => setSearch('')}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="ganesh-filter-group">
          <button
            type="button"
            className={`filter-chip-btn ${selectedCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('ALL')}
          >
            All ({expenses.length})
          </button>

          <button
            type="button"
            className="filter-chip-btn"
            onClick={handleExportCSV}
            title="Download Expenses CSV Spreadsheet"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              width: '25px',
              height: '25px',
              borderRadius: '5px',
              background: 'var(--surface-secondary, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              color: '#475569',
            }}
          >
            <FileSpreadsheet size={14} />
          </button>
        </div>
      </div>

      {/* Auto-Scroll Info & Status Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.4rem 0.2rem 0.75rem 0.2rem',
          fontSize: '0.82rem',
          color: '#475569',
          flexWrap: 'wrap',
          gap: '0.4rem',
        }}
      >
        <span>
          Showing <strong>{filteredExpenses.length}</strong> matching expenses
        </span>

        {viewFormat === 'cards' && filteredExpenses.length > 2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span className="ganesh-column-badge badge-live-scroll">
              🔴 {isAutoScrollPaused ? 'Paused' : 'Live Auto-Scroll'}
            </span>
            <button
              type="button"
              className="ganesh-scroll-control-btn"
              onClick={() => setIsAutoScrollPaused((p) => !p)}
              title={isAutoScrollPaused ? 'Resume Auto-Scrolling' : 'Pause Auto-Scrolling'}
            >
              {isAutoScrollPaused ? <Play size={12} /> : <Pause size={12} />}
              <span>{isAutoScrollPaused ? 'Play' : 'Pause'}</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: MOBILE-FIRST CARDS VIEW (WITH AUTO-SCROLLING) */}
      {viewFormat === 'cards' ? (
        <div
          ref={scrollRef}
          className="ganesh-autoscroll-container"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
          title="Hover or touch to pause scroll"
        >
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((exp) => (
              <div key={exp.id} className="ganesh-mobile-card">
                <div className="ganesh-mobile-card-top">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          background: '#f1f5f9',
                          color: '#334155',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        {exp.category}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{exp.expenseDate}</span>
                    </div>
                    <h4 style={{ margin: '0.3rem 0 0 0', fontSize: '0.95rem', color: '#0f172a' }}>
                      {exp.title}
                    </h4>
                  </div>

                  <div className="ganesh-mobile-card-amount is-expense-amt">
                    ₹{exp.amount.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="ganesh-mobile-card-middle">
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    <strong>{exp.paidTo}</strong> {exp.invoiceNo ? `• ${exp.invoiceNo}` : ''}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background:
                          exp.status === 'Paid'
                            ? '#d1fae5'
                            : exp.status === 'Planned'
                              ? '#fef3c7'
                              : '#fee2e2',
                        color:
                          exp.status === 'Paid'
                            ? '#065f46'
                            : exp.status === 'Planned'
                              ? '#92400e'
                              : '#991b1b',
                      }}
                    >
                      {exp.status}
                    </span>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(exp.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.2rem',
                        }}
                        title="Delete expense"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {exp.notes && (
                  <div className="ganesh-mobile-card-notes">
                    {exp.notes}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8', fontSize: '0.88rem' }}>
              No matching expense records found.
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: HORIZONTAL-SCROLL TABLE */
        <div>
          <div className="mobile-table-hint">
            <span>👈 Swipe table horizontally to see all columns 👉</span>
          </div>
          <div className="ganesh-table-container">
            <table className="ganesh-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Expense Item / Title</th>
                  <th>Category</th>
                  <th>Paid To / Vendor</th>
                  <th>Invoice / Ref</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  {isAdmin && <th style={{ width: '50px', textAlign: 'center' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {exp.expenseDate}
                    </td>
                    <td>
                      <strong>{exp.title}</strong>
                      {exp.notes && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                          {exp.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          background: '#f1f5f9',
                          color: '#334155',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      <strong>{exp.paidTo}</strong>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>via {exp.paymentMode}</div>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#475569' }}>{exp.invoiceNo || '—'}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.45rem',
                          borderRadius: '6px',
                          background:
                            exp.status === 'Paid'
                              ? '#d1fae5'
                              : exp.status === 'Planned'
                                ? '#fef3c7'
                                : '#fee2e2',
                          color:
                            exp.status === 'Paid'
                              ? '#065f46'
                              : exp.status === 'Planned'
                                ? '#92400e'
                                : '#991b1b',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="amount-display" style={{ color: '#b91c1c' }}>
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDelete(exp.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '0.25rem',
                          }}
                          title="Delete expense"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="ganesh-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="ganesh-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ganesh-modal-header">
              <h3>
                <Receipt size={20} /> Record Ganesh Festival Expense
              </h3>
              <button
                className="ganesh-modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="ganesh-modal-body">
              <div className="ganesh-form-group">
                <label className="ganesh-form-label">
                  Expense Title / Purpose <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahaprasadam Grocery Provisions, Sound System Rental"
                  className="ganesh-form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                <div className="ganesh-form-group">
                  <label className="ganesh-form-label">Category</label>
                  <select
                    className="ganesh-form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GaneshExpenseCategory)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ganesh-form-group">
                  <label className="ganesh-form-label">
                    Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 15000"
                    className="ganesh-form-input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                <div className="ganesh-form-group">
                  <label className="ganesh-form-label">Vendor / Paid To</label>
                  <input
                    type="text"
                    placeholder="e.g. Sri Balaji Tent House"
                    className="ganesh-form-input"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                  />
                </div>

                <div className="ganesh-form-group">
                  <label className="ganesh-form-label">Payment Mode</label>
                  <select
                    className="ganesh-form-select"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as GaneshPaymentMode)}
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                <div className="ganesh-form-group">
                  <label className="ganesh-form-label">Date of Expense</label>
                  <input
                    type="date"
                    className="ganesh-form-input"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                </div>

                <div className="ganesh-form-group">
                  <label className="ganesh-form-label">Invoice / Receipt No</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-9042"
                    className="ganesh-form-input"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                <div className="ganesh-form-group">
                  <label className="ganesh-form-label">Payment Status</label>
                  <select
                    className="ganesh-form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending Reimbursement">Pending Reimbursement</option>
                    <option value="Planned">Planned / Estimated</option>
                  </select>
                </div>

                <div className="ganesh-form-group">
                  <label className="ganesh-form-label">Approved By</label>
                  <input
                    type="text"
                    placeholder="e.g. Festival Committee Head"
                    className="ganesh-form-input"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                  />
                </div>
              </div>

              <div className="ganesh-form-group">
                <label className="ganesh-form-label">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Additional details regarding this bill or items delivered..."
                  className="ganesh-form-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn-festive-secondary"
                  style={{ color: '#475569', borderColor: '#cbd5e1' }}
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-festive-primary"
                  style={{ background: '#ea580c', color: '#ffffff' }}
                >
                  Save Expense Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
