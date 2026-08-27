import React, { useState, useEffect } from 'react';
import { X, HeartHandshake, Calendar, Sparkles } from 'lucide-react';
import {
  createAdminCampaign,
  updateAdminCampaign,
  type CampaignItem,
  type CampaignCategory,
  type CreateCampaignPayload,
} from '../../services/supabase/financeService';

const CATEGORIES: CampaignCategory[] = [
  'Festival',
  'Cultural',
  'Charity',
  'Emergency Fund',
  'Infrastructure',
  'Puja',
  'Sports',
  'Other',
];

interface CampaignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  campaignToEdit?: CampaignItem | null;
}

export const CampaignFormModal: React.FC<CampaignFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  campaignToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CampaignCategory>('Festival');
  const [targetAmount, setTargetAmount] = useState<number>(100000);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (campaignToEdit) {
      setTitle(campaignToEdit.title);
      setDescription(campaignToEdit.description || '');
      setCategory(campaignToEdit.category);
      setTargetAmount(campaignToEdit.target_amount);
      setStartDate(campaignToEdit.start_date);
      setEndDate(campaignToEdit.end_date || '');
      setBannerUrl(campaignToEdit.banner_url || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setTitle('');
      setDescription('');
      setCategory('Festival');
      setTargetAmount(150000);
      setStartDate(today);
      setEndDate('');
      setBannerUrl('');
    }
    setError(null);
  }, [campaignToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || targetAmount <= 0) {
      setError('Please fill in all required fields with a valid target amount.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateCampaignPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category,
        target_amount: Number(targetAmount),
        start_date: startDate,
        end_date: endDate || undefined,
        banner_url: bannerUrl.trim() || undefined,
      };

      if (campaignToEdit) {
        await updateAdminCampaign(campaignToEdit.id, payload);
      } else {
        await createAdminCampaign(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving campaign:', err);
      setError(err.message || 'Failed to save campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
            {campaignToEdit ? 'Edit Fundraising Campaign' : 'Create Fundraising Campaign'}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Campaign Title *
            </label>
            <input
              type="text"
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="e.g. Ganesh Utsav 2026 Community Fund"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Category *
              </label>
              <select
                className="admin-search-input"
                style={{ width: '100%', padding: '0.55rem' }}
                value={category}
                onChange={(e) => setCategory(e.target.value as CampaignCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Target Amount (₹) *
              </label>
              <input
                type="number"
                min={1}
                className="admin-search-input"
                style={{ width: '100%' }}
                value={targetAmount}
                onChange={(e) => setTargetAmount(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Start Date *
              </label>
              <input
                type="date"
                className="admin-search-input"
                style={{ width: '100%' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Target End Date (Optional)
              </label>
              <input
                type="date"
                className="admin-search-input"
                style={{ width: '100%' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Description & Purpose
            </label>
            <textarea
              rows={3}
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="Explain how the funds will be utilized for the community..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              {submitting ? 'Saving...' : campaignToEdit ? 'Update Campaign' : 'Create & Activate Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
