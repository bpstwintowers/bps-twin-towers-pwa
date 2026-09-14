import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Eye,
  FileText,
  Download,
  X,
  CheckCircle2,
  Receipt,
  Sparkles,
  Flame,
  Volume2,
  Utensils,
  Music,
  Lock,
  ArrowLeft,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import type {
  GaneshExpenseRecord,
  GaneshExpenseCategory,
  GaneshPaymentMode,
} from '../../../types/ganesh';
import {
  addGaneshExpense,
  updateGaneshExpense,
  deleteGaneshExpense,
  exportGaneshExpensesCSV,
} from '../../../services/liveSheetService';
import { supabase } from '../../../services/supabase/client';
import { fetchUserRoles } from '../../../services/supabase/adminService';
import { hasAnyAdminRole } from '../../../utils/rbac';
import '../GaneshExpenseTracker.css';

interface Props {
  expenses: GaneshExpenseRecord[];
  totalCollections: number;
  onRefresh: () => void;
  isAdmin?: boolean;
  embedded?: boolean;
  onBackToHome?: () => void;
}

const CATEGORY_COLORS: Record<string, 'navy' | 'orange' | 'yellow' | 'purple' | 'blue'> = {
  'Idol & Visarjan': 'navy',
  'Sound & Lighting': 'orange',
  'Mahaprasadam & Food': 'yellow',
  'Priest & Puja Samagri': 'purple',
  'Pandal & Decoration': 'orange',
  'Cultural Events & Gifts': 'blue',
  'Security & Cleaning': 'navy',
  'Misc & Contingency': 'yellow',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Idol & Visarjan': '🪔',
  'Sound & Lighting': '🔊',
  'Mahaprasadam & Food': '🍲',
  'Priest & Puja Samagri': '🪔',
  'Pandal & Decoration': '🎪',
  'Cultural Events & Gifts': '🎭',
  'Security & Cleaning': '🛡️',
  'Misc & Contingency': '📦',
};

export const GaneshExpenseTracker: React.FC<Props> = ({
  expenses,
  totalCollections,
  onRefresh,
  isAdmin,
  embedded = false,
  onBackToHome,
}) => {
  // Determine Admin privileges
  const storedFlat = localStorage.getItem('bps_ganesh_user_flat') || '';
  const cleanFlat = storedFlat.trim().toUpperCase();
  const isAdminFlat =
    cleanFlat === 'ADMN' ||
    cleanFlat === 'ADMIN' ||
    cleanFlat.includes('ADMN') ||
    cleanFlat.includes('ADMIN');

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

  const effectiveAdmin =
    isAdmin !== undefined
      ? isAdmin
      : (isAdminFlat || hasAuthAdminRole);

  // Budget & Calculations based on Google Sheets live data
  const targetBudget = 200000;
  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const utilizationPercent = Math.min(100, Math.round((totalSpent / (targetBudget || 1)) * 100));
  const availableAmount = Math.max(0, targetBudget - totalSpent);

  // Category-wise Breakdown from Google Sheets expenses
  const activeCategoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      totals[e.category] = (totals[e.category] || 0) + amt;
    });

    return Object.entries(totals)
      .filter(([_, amt]) => amt > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  // Selected Voucher Modal State
  const [selectedVoucher, setSelectedVoucher] = useState<GaneshExpenseRecord | null>(null);

  // Add Expense Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GaneshExpenseCategory>('Pandal & Decoration');
  const [amount, setAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [paymentMode, setPaymentMode] = useState<GaneshPaymentMode>('UPI');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Paid' | 'Pending Reimbursement' | 'Planned'>('Paid');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [approvedBy, setApprovedBy] = useState('President & Treasurer');
  const [notes, setNotes] = useState('');

  // Edit Expense Modal State
  const [editingExpense, setEditingExpense] = useState<GaneshExpenseRecord | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<GaneshExpenseCategory>('Pandal & Decoration');
  const [editAmount, setEditAmount] = useState('');
  const [editPaidTo, setEditPaidTo] = useState('');
  const [editPaymentMode, setEditPaymentMode] = useState<GaneshPaymentMode>('UPI');
  const [editExpenseDate, setEditExpenseDate] = useState('');
  const [editStatus, setEditStatus] = useState<'Paid' | 'Pending Reimbursement' | 'Planned'>('Paid');
  const [editInvoiceNo, setEditInvoiceNo] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Delete Expense Confirmation State
  const [deletingExpense, setDeletingExpense] = useState<GaneshExpenseRecord | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<1 | 2>(1);

  // Sync edit form fields when editingExpense changes
  useEffect(() => {
    if (editingExpense) {
      setEditTitle(editingExpense.title || '');
      setEditCategory(editingExpense.category || 'Pandal & Decoration');
      setEditAmount(editingExpense.amount?.toString() || '');
      setEditPaidTo(editingExpense.paidTo || '');
      setEditPaymentMode(editingExpense.paymentMode || 'UPI');
      setEditExpenseDate(editingExpense.expenseDate || new Date().toISOString().split('T')[0]);
      setEditStatus(editingExpense.status || 'Paid');
      setEditInvoiceNo(editingExpense.invoiceNo || '');
      setEditNotes(editingExpense.notes || '');
    }
  }, [editingExpense]);

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
      invoiceNo: invoiceNo.trim() || `VCH-2026-${(expenses.length + 1).toString().padStart(3, '0')}`,
      approvedBy: approvedBy.trim() || 'Committee Stamped',
      notes: notes.trim() || undefined,
      status,
    });

    setIsAddModalOpen(false);
    setTitle('');
    setAmount('');
    setPaidTo('');
    setInvoiceNo('');
    setStatus('Paid');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    onRefresh();
  };

  const handleEditExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    const amtNum = parseFloat(editAmount);
    if (!editTitle.trim() || isNaN(amtNum) || amtNum <= 0) {
      alert('Please provide valid title and amount');
      return;
    }

    updateGaneshExpense(editingExpense.id, {
      title: editTitle.trim(),
      category: editCategory,
      amount: amtNum,
      paidTo: editPaidTo.trim() || 'Vendor',
      paymentMode: editPaymentMode,
      expenseDate: editExpenseDate,
      invoiceNo: editInvoiceNo.trim() || undefined,
      notes: editNotes.trim() || undefined,
      status: editStatus,
    });

    setEditingExpense(null);
    onRefresh();
  };

  const handleConfirmDelete = () => {
    if (!deletingExpense) return;
    deleteGaneshExpense(deletingExpense.id);
    setDeletingExpense(null);
    setDeleteConfirmStep(1);
    onRefresh();
  };

  const handleExportCSV = () => {
    const csv = exportGaneshExpensesCSV(expenses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BPS_Ganesh_Utsav_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="expenses-tracker-root">
      {/* Embedded Back Button */}
      {embedded && onBackToHome && (
        <div style={{ padding: '0.25rem 0 0.75rem 0' }}>
          <button
            type="button"
            onClick={onBackToHome}
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.45rem 0.95rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#0f172a',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <ArrowLeft size={16} color="#ea580c" />
            <span>← Back to Festival Home</span>
          </button>
        </div>
      )}

      {/* 1. Header Info Block */}
      <div className="expenses-header-block">
        <div className="expenses-live-tag">
          <span>•</span>
          <span>LIVE COMMUNITY LEDGER</span>
        </div>
        <h2 className="expenses-main-title">Community Expenses</h2>
        <p className="expenses-main-sub">Live audit of our Utsav expenditure &amp; payouts</p>
      </div>

      {/* 2. Hero Metric Card */}
      <div className="expenses-hero-card">
        <div className="expenses-hero-top-row">
          <span className="expenses-hero-label">TOTAL EXPENSE INCURRED</span>
          <span className="expenses-fy-pill">FY 2026</span>
        </div>

        <div className="expenses-amount-row">
          <span className="expenses-big-val">₹{totalSpent.toLocaleString('en-IN')}</span>
          <span className="expenses-budget-val">/ ₹{targetBudget.toLocaleString('en-IN')} Budget</span>
        </div>

        {/* Progress Track */}
        <div className="expenses-progress-track">
          <div
            className="expenses-progress-fill"
            style={{ width: `${Math.max(5, utilizationPercent)}%` }}
          />
        </div>

        <div className="expenses-util-stats">
          <span className="util-used-text">{utilizationPercent}% Utilized</span>
          <span className="util-avail-text">₹{availableAmount.toLocaleString('en-IN')} Available</span>
        </div>

        <div className="expenses-hero-bottom-row">
          <div className="committee-signatures-badge">
            <Receipt size={16} color="#ea580c" />
            <span>{expenses.length} Expenses Recorded</span>
          </div>

          {effectiveAdmin && (
            <button
              type="button"
              className="btn-add-expense-orange"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={15} />
              <span>Add Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Category-wise Expenditure */}
      <div className="category-expenditure-card">
        <div className="category-expenditure-header">
          <h3 className="category-expenditure-title">Category-wise Expenditure</h3>
          <span className="category-headings-count">{activeCategoryTotals.length} Headings</span>
        </div>

        <div className="category-items-list">
          {activeCategoryTotals.map(([catName, spentAmt]) => {
            const pct = totalSpent > 0 ? Math.round((spentAmt / totalSpent) * 100) : 0;
            const colorClass = CATEGORY_COLORS[catName] || 'orange';
            const iconChar = CATEGORY_ICONS[catName] || '📋';

            return (
              <div key={catName} className="category-row-item">
                <div className="category-row-top">
                  <div className="category-name-wrap">
                    <span className="category-icon-box">{iconChar}</span>
                    <span>{catName}</span>
                  </div>
                  <div className="category-amount-badge">
                    ₹{spentAmt.toLocaleString('en-IN')}
                    <span>({pct}%)</span>
                  </div>
                </div>

                <div className="category-progress-line">
                  <div
                    className={`category-progress-bar ${colorClass}`}
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Expense Items List (Clean & Compact) */}
      <div className="vouchers-section-wrap">
        <div className="vouchers-header-box">
          <h3 className="vouchers-main-title">Expense Items &amp; Bills</h3>
          <p className="vouchers-main-sub">Verified expenditures paid by committee</p>
        </div>

        <div className="voucher-cards-list">
          {expenses.map((expense, idx) => {
            const statusType = expense.status || 'Paid';
            const statusClass = statusType === 'Paid' ? 'paid' : 'pending';

            return (
              <div
                key={expense.id || idx}
                className="clean-expense-card"
                onClick={() => setSelectedVoucher(expense)}
                style={{ cursor: 'pointer' }}
              >
                {/* Top Row: Category Badge + Date & Amount */}
                <div className="clean-expense-top">
                  <div className="clean-expense-cat-date">
                    <span className="clean-cat-pill">{expense.category}</span>
                    <span className="clean-date-text">{expense.expenseDate || 'Sep 2026'}</span>
                  </div>
                  <div className="clean-expense-amount">
                    ₹{Number(expense.amount).toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Title */}
                <h4 className="clean-expense-title">{expense.title}</h4>

                {/* Bottom Row: Vendor & Status */}
                <div className="clean-expense-bottom">
                  <span className="clean-vendor-name">{expense.paidTo}</span>
                  <span className={`clean-status-pill ${statusClass}`}>
                    {statusType}
                  </span>
                </div>

                {/* Optional Note */}
                {expense.notes && (
                  <div className="clean-expense-notes">{expense.notes}</div>
                )}

                {/* Admin Controls: Edit and Remove (with safety confirmation) */}
                {effectiveAdmin && (
                  <div className="clean-expense-admin-bar">
                    <button
                      type="button"
                      className="btn-card-action edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingExpense(expense);
                      }}
                      title="Edit this expense item"
                    >
                      <Pencil size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="btn-card-action remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingExpense(expense);
                        setDeleteConfirmStep(1);
                      }}
                      title="Remove this expense item"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Download Complete Audit CTA Bar */}
      <div className="download-audit-banner" onClick={handleExportCSV}>
        <div className="download-banner-left">
          <div className="download-shield-badge">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="download-banner-title">Download Complete Audit</div>
            <div className="download-banner-sub">Signed statement with itemized receipts</div>
          </div>
        </div>

        <div className="download-action-circle">
          <Download size={18} />
        </div>
      </div>

      {/* Modal: View Voucher Details */}
      {selectedVoucher && (
        <div className="voucher-modal-overlay" onClick={() => setSelectedVoucher(null)}>
          <div className="voucher-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Receipt size={20} color="#ea580c" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                  Audited Payment Voucher
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#fff7ed', border: '1.5px dashed #f97316', borderRadius: '14px', padding: '1rem', marginBottom: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9a3412', textTransform: 'uppercase' }}>
                VOUCHER NUMBER
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#c2410c', fontFamily: 'monospace', margin: '0.2rem 0' }}>
                #{selectedVoucher.invoiceNo || 'VCH-2026-001'}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', fontFamily: 'Cinzel, Georgia, serif' }}>
                ₹{Number(selectedVoucher.amount).toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Expense Item:</span>
                <span style={{ fontWeight: 800, color: '#1e293b' }}>{selectedVoucher.title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Category:</span>
                <span style={{ fontWeight: 700, color: '#ea580c' }}>{selectedVoucher.category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Vendor / Paid To:</span>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{selectedVoucher.paidTo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Payment Mode:</span>
                <span style={{ fontWeight: 800, color: '#059669' }}>{selectedVoucher.paymentMode} (Verified)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Settlement Date:</span>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{selectedVoucher.expenseDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Authorization:</span>
                <span style={{ fontWeight: 700, color: '#047857' }}>
                  ✓ {selectedVoucher.approvedBy || 'President & Treasurer Stamped'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#166534', fontSize: '0.78rem', fontWeight: 600 }}>
              <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
              <span>Audited and verified by BPS Festival Committee Accounts.</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Expense */}
      {isAddModalOpen && (
        <div className="voucher-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="voucher-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                Add New Expense Record
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Expense Title / Item
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clay Idol Advance"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GaneshExpenseCategory)}
                    style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="Idol & Visarjan">Idol &amp; Visarjan</option>
                    <option value="Pandal & Decoration">Pandal &amp; Decoration</option>
                    <option value="Priest & Puja Samagri">Priest &amp; Puja Samagri</option>
                    <option value="Mahaprasadam & Food">Mahaprasadam &amp; Food</option>
                    <option value="Sound & Lighting">Sound &amp; Lighting</option>
                    <option value="Cultural Events & Gifts">Cultural Events &amp; Gifts</option>
                    <option value="Security & Cleaning">Security &amp; Cleaning</option>
                    <option value="Misc & Contingency">Misc &amp; Contingency</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Vendor / Paid To
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sri Balaji Arts"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as GaneshPaymentMode)}
                    style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="UPI">UPI (GooglePay / PhonePe)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Cash">Cash (Physical Receipt)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Expense Date
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Payment Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending Reimbursement">Pending Reimbursement</option>
                    <option value="Planned">Planned</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Bill / Voucher / UTR No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. VCH-2026-004 or UTR 428910293812"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Notes / Audit Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50% advance paid, stage backdrop setup"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '0.5rem',
                  padding: '0.85rem',
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                }}
              >
                <span>Save Audited Expense</span>
                <ShieldCheck size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Expense (Admin Only) */}
      {editingExpense && (
        <div className="voucher-modal-overlay" onClick={() => setEditingExpense(null)}>
          <div className="voucher-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Pencil size={20} color="#1d4ed8" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                  Edit Expense Record
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Expense Title / Item
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as GaneshExpenseCategory)}
                    style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="Idol & Visarjan">Idol &amp; Visarjan</option>
                    <option value="Pandal & Decoration">Pandal &amp; Decoration</option>
                    <option value="Priest & Puja Samagri">Priest &amp; Puja Samagri</option>
                    <option value="Mahaprasadam & Food">Mahaprasadam &amp; Food</option>
                    <option value="Sound & Lighting">Sound &amp; Lighting</option>
                    <option value="Cultural Events & Gifts">Cultural Events &amp; Gifts</option>
                    <option value="Security & Cleaning">Security &amp; Cleaning</option>
                    <option value="Misc & Contingency">Misc &amp; Contingency</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Vendor / Paid To
                  </label>
                  <input
                    type="text"
                    value={editPaidTo}
                    onChange={(e) => setEditPaidTo(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Payment Mode
                  </label>
                  <select
                    value={editPaymentMode}
                    onChange={(e) => setEditPaymentMode(e.target.value as GaneshPaymentMode)}
                    style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="UPI">UPI (GooglePay / PhonePe)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Cash">Cash (Physical Receipt)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Expense Date
                  </label>
                  <input
                    type="date"
                    value={editExpenseDate}
                    onChange={(e) => setEditExpenseDate(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Payment Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending Reimbursement">Pending Reimbursement</option>
                    <option value="Planned">Planned</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Bill / Voucher / UTR No. (Optional)
                </label>
                <input
                  type="text"
                  value={editInvoiceNo}
                  onChange={(e) => setEditInvoiceNo(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Notes / Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  style={{
                    flex: '1',
                    padding: '0.75rem',
                    background: '#f1f5f9',
                    color: '#475569',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: '2',
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  Update Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation with Re-confirmation Step */}
      {deletingExpense && (
        <div className="voucher-modal-overlay" onClick={() => setDeletingExpense(null)}>
          <div
            className="voucher-modal-card"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <AlertTriangle size={20} color="#dc2626" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#991b1b' }}>
                  {deleteConfirmStep === 1 ? 'Remove Expense Record' : 'Confirm Permanent Deletion'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingExpense(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {deleteConfirmStep === 1 ? (
              <div>
                <div className="delete-confirm-box">
                  <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    EXPENSE RECORD TO DELETE
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                    {deletingExpense.title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569' }}>
                    <span>Category: <strong>{deletingExpense.category}</strong></span>
                    <span style={{ fontWeight: 900, color: '#dc2626', fontSize: '1.1rem' }}>
                      ₹{Number(deletingExpense.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                  Are you sure you want to remove this verified expenditure? This will delete the entry from the festival ledger.
                </p>

                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => setDeletingExpense(null)}
                    style={{
                      flex: '1',
                      padding: '0.75rem',
                      background: '#f1f5f9',
                      color: '#475569',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmStep(2)}
                    style={{
                      flex: '1.4',
                      padding: '0.75rem',
                      background: '#dc2626',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                    }}
                  >
                    <Trash2 size={15} />
                    <span>Proceed to Delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="delete-confirm-step2">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#b91c1c', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                    <AlertTriangle size={18} />
                    <span>Final Re-Confirmation Required</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#7f1d1d', lineHeight: 1.45 }}>
                    Please confirm again that you wish to permanently delete <strong>&quot;{deletingExpense.title}&quot;</strong> (₹{Number(deletingExpense.amount).toLocaleString('en-IN')}).
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmStep(1)}
                    style={{
                      flex: '1',
                      padding: '0.75rem',
                      background: '#f1f5f9',
                      color: '#475569',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    style={{
                      flex: '1.6',
                      padding: '0.75rem',
                      background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 4px 14px rgba(185, 28, 28, 0.4)',
                    }}
                  >
                    <Trash2 size={15} />
                    <span>Yes, Permanently Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
