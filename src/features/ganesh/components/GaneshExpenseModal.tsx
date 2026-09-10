import React, { useState } from 'react';
import { X, Receipt, CheckCircle, Plus } from 'lucide-react';
import { addGaneshExpense } from '../../../services/ganeshService';
import type { GaneshExpenseCategory, GaneshExpenseRecord, GaneshPaymentMode } from '../../../types/ganesh';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newExpense: GaneshExpenseRecord) => void;
}

export const GaneshExpenseModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GaneshExpenseCategory>('Pandal & Decoration');
  const [amount, setAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [paymentMode, setPaymentMode] = useState<GaneshPaymentMode>('UPI');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(amount);
    if (!title.trim()) {
      alert('Please enter the expense title/description');
      return;
    }
    if (isNaN(amtNum) || amtNum <= 0) {
      alert('Please enter a valid expense amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const record = addGaneshExpense({
        title: title.trim(),
        category,
        amount: amtNum,
        paidTo: paidTo.trim() || 'Vendor',
        paymentMode,
        expenseDate,
        invoiceNo: invoiceNo.trim() || undefined,
        notes: notes.trim() || undefined,
        approvedBy: 'Event Admin Team',
        status: 'Paid',
      });

      setShowSuccessToast(true);
      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess(record);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error saving expense:', err);
      setIsSubmitting(false);
      alert('Failed to record expense. Please try again.');
    }
  };

  const categories: GaneshExpenseCategory[] = [
    'Pandal & Decoration',
    'Priest & Puja Samagri',
    'Mahaprasadam & Food',
    'Idol & Visarjan',
    'Sound & Lighting',
    'Cultural Events & Gifts',
    'Security & Cleaning',
    'Misc & Contingency',
  ];

  return (
    <div className="ganesh-modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="ganesh-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '92%',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          className="ganesh-modal-header"
          style={{
            padding: '1.25rem 1.4rem',
            background: 'linear-gradient(135deg, #9f1239 0%, #e11d48 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Receipt size={22} color="#fecdd3" />
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem', fontWeight: 800 }}>
                Record Festival Expense
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#ffe4e6', fontWeight: 500 }}>
                Audited payout ledger & vendor receipt entry
              </span>
            </div>
          </div>
          <button
            type="button"
            className="ganesh-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {showSuccessToast && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#15803d',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              <CheckCircle size={18} />
              <span>Expense recorded successfully in ledger!</span>
            </div>
          )}

          <div>
            <label className="ganesh-form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.86rem', color: '#1e293b' }}>
              Expense Title / Description <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pooja Samagri & Flowers, Stage Sound System"
              className="ganesh-form-input"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.92rem',
                boxSizing: 'border-box',
              }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="ganesh-form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.86rem', color: '#1e293b' }}>
                Category <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                className="ganesh-form-select"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                }}
                value={category}
                onChange={(e) => setCategory(e.target.value as GaneshExpenseCategory)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="ganesh-form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.86rem', color: '#1e293b' }}>
                Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="₹ Amount"
                className="ganesh-form-input"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  boxSizing: 'border-box',
                }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="ganesh-form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.86rem', color: '#1e293b' }}>
                Paid To (Vendor / Person)
              </label>
              <input
                type="text"
                placeholder="e.g. Sri Balaji Flowers"
                className="ganesh-form-input"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
              />
            </div>

            <div>
              <label className="ganesh-form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.86rem', color: '#1e293b' }}>
                Bill / Invoice / Voucher No.
              </label>
              <input
                type="text"
                placeholder="e.g. INV-8821"
                className="ganesh-form-input"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="ganesh-form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.86rem', color: '#1e293b' }}>
                Payment Mode
              </label>
              <select
                className="ganesh-form-select"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                }}
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as GaneshPaymentMode)}
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="ganesh-form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.86rem', color: '#1e293b' }}>
                Date
              </label>
              <input
                type="date"
                className="ganesh-form-input"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="ganesh-form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.86rem', color: '#1e293b' }}>
              Notes / Audit Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid in cash to pandal contractor"
              className="ganesh-form-input"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.88rem',
                boxSizing: 'border-box',
              }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="ganesh-modal-cancel-btn"
              onClick={onClose}
              style={{ flex: 1, padding: '0.65rem' }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 1.5,
                background: '#e11d48',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.92rem',
                padding: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                cursor: 'pointer',
              }}
            >
              <Plus size={16} /> Save Expense Voucher
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
