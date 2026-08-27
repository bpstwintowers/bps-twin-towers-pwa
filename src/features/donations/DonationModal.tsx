import React, { useState, useEffect } from 'react';
import { X, HeartHandshake, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import {
  submitDonation,
  type CampaignItem,
  type PaymentMethod,
} from '../../services/supabase/financeService';

const QUICK_AMOUNTS = [500, 1000, 2100, 5001, 11000];

const PAYMENT_METHODS: PaymentMethod[] = [
  'UPI',
  'Bank Transfer',
  'Cash',
  'Cheque',
  'Other',
];

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignItem | null;
  flatId?: string;
  onSuccess: () => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  onClose,
  campaign,
  flatId,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('1000');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentReference, setPaymentReference] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorMobile, setDonorMobile] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedReceipt, setConfirmedReceipt] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setConfirmedReceipt(null);
      setPaymentReference('');
      setNotes('');

      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
            .then(({ data: p }) => {
              if (p) {
                setDonorName(p.full_name || '');
                setDonorEmail(p.email || '');
                setDonorMobile(p.mobile || '');
              }
            });
        }
      });
    }
  }, [isOpen, campaign]);

  if (!isOpen || !campaign) return null;

  const handleQuickAmount = (val: number) => {
    setAmount(val);
    setCustomAmount(val.toString());
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError('Please enter a valid donation amount.');
      return;
    }
    if (!donorName.trim()) {
      setError('Donor name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await submitDonation({
        campaign_id: campaign.id,
        flat_id: flatId,
        amount: amount,
        payment_method: paymentMethod,
        payment_reference: paymentReference.trim() || undefined,
        donor_name: donorName.trim(),
        donor_mobile: donorMobile.trim() || undefined,
        donor_email: donorEmail.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setConfirmedReceipt(res);
      onSuccess();
    } catch (err: any) {
      console.error('Error submitting donation:', err);
      setError(err.message || 'Failed to submit donation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyReceipt = () => {
    if (confirmedReceipt?.receipt_number) {
      navigator.clipboard.writeText(confirmedReceipt.receipt_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HeartHandshake size={22} style={{ color: '#10b981' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Contribute to Campaign</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {campaign.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {confirmedReceipt ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.4rem' }}>
              Contribution Recorded!
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Your donation of <strong>₹{confirmedReceipt.amount}</strong> has been received and logged in the community treasury ledger.
            </p>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'left',
                fontSize: '0.88rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Receipt Number:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <strong>{confirmedReceipt.receipt_number}</strong>
                  <button
                    onClick={handleCopyReceipt}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '0.2rem' }}
                    title="Copy receipt number"
                  >
                    {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>Campaign:</span>{' '}
                <strong>{confirmedReceipt.campaign_title}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>{' '}
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>Pending Verification</span>
              </div>
            </div>

            <button className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#f87171',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            {/* Quick Amount Selector */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                Select Contribution Amount (₹) *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                {QUICK_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    className="btn-outline"
                    onClick={() => handleQuickAmount(val)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.85rem',
                      background: amount === val ? 'rgba(16, 185, 129, 0.2)' : undefined,
                      borderColor: amount === val ? '#10b981' : undefined,
                      color: amount === val ? '#34d399' : undefined,
                    }}
                  >
                    ₹{val.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              <input
                type="number"
                min={1}
                step="any"
                className="admin-search-input"
                style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700 }}
                placeholder="Or enter custom amount in ₹"
                value={customAmount}
                onChange={handleCustomAmountChange}
                required
              />
            </div>

            {/* Payment Method & Reference */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Payment Method *
                </label>
                <select
                  className="admin-search-input"
                  style={{ width: '100%', padding: '0.55rem' }}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Transaction / Ref ID
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. UPI Ref / UTR / Cheque #"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>
            </div>

            {/* Donor Information */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Donor Name *
              </label>
              <input
                type="text"
                className="admin-search-input"
                style={{ width: '100%' }}
                placeholder="Name as it should appear on receipt"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Mobile Number
                </label>
                <input
                  type="tel"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  placeholder="10-digit mobile"
                  value={donorMobile}
                  onChange={(e) => setDonorMobile(e.target.value)}
                  maxLength={10}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  placeholder="For e-receipt"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Personal Message / Dedication (Optional)
              </label>
              <input
                type="text"
                className="admin-search-input"
                style={{ width: '100%' }}
                placeholder="e.g. In loving memory of... / Happy Ganesh Utsav"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                {submitting ? 'Recording...' : `Contribute ₹${amount.toLocaleString('en-IN')}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
