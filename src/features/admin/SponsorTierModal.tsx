import React, { useState, useEffect } from 'react';
import { X, Award, Plus, Trash2 } from 'lucide-react';
import {
  createAdminTier,
  updateAdminTier,
  type SponsorTierItem,
  type CreateTierPayload,
} from '../../services/supabase/sponsorService';

interface SponsorTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tierToEdit?: SponsorTierItem | null;
}

export const SponsorTierModal: React.FC<SponsorTierModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tierToEdit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minimumAmount, setMinimumAmount] = useState<number>(25000);
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [benefits, setBenefits] = useState<string[]>(['Logo on Stage Backdrop', 'Stage Mention & Memento']);
  const [newBenefit, setNewBenefit] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tierToEdit) {
      setName(tierToEdit.name);
      setDescription(tierToEdit.description || '');
      setMinimumAmount(tierToEdit.minimum_amount);
      setDisplayOrder(tierToEdit.display_order);
      setBenefits(tierToEdit.benefits || []);
    } else {
      setName('');
      setDescription('');
      setMinimumAmount(25000);
      setDisplayOrder(1);
      setBenefits(['Logo on Stage Backdrop', 'Stage Mention & Memento']);
    }
    setNewBenefit('');
    setError(null);
  }, [tierToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      setBenefits([...benefits, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const handleRemoveBenefit = (idx: number) => {
    setBenefits(benefits.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || minimumAmount < 0) {
      setError('Please provide a tier name and valid minimum amount.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateTierPayload = {
        name: name.trim(),
        description: description.trim() || undefined,
        minimum_amount: Number(minimumAmount),
        benefits: benefits,
        display_order: Number(displayOrder),
      };

      if (tierToEdit) {
        await updateAdminTier(tierToEdit.id, payload);
      } else {
        await createAdminTier(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving tier:', err);
      setError(err.message || 'Failed to save tier.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
            {tierToEdit ? 'Edit Sponsorship Tier' : 'Create Sponsorship Tier'}
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
              Tier Name *
            </label>
            <input
              type="text"
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="e.g. Platinum Sponsor / Food & Prasadam Partner"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Minimum Amount (₹) *
              </label>
              <input
                type="number"
                min={0}
                className="admin-search-input"
                style={{ width: '100%' }}
                value={minimumAmount}
                onChange={(e) => setMinimumAmount(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Display Order
              </label>
              <input
                type="number"
                min={1}
                className="admin-search-input"
                style={{ width: '100%' }}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Description
            </label>
            <input
              type="text"
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="Short description of tier scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Benefits list */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.35rem', fontWeight: 600 }}>
              Included Benefits & Privileges
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem' }}>
              <input
                type="text"
                className="admin-search-input"
                style={{ flex: 1 }}
                placeholder="e.g. Promotional Stall in Podium Area"
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBenefit();
                  }
                }}
              />
              <button
                type="button"
                className="btn-outline"
                onClick={handleAddBenefit}
                style={{ padding: '0.45rem 0.75rem' }}
              >
                <Plus size={15} />
                Add
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {benefits.map((b, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '0.4rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.82rem',
                  }}
                >
                  <span>✓ {b}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBenefit(idx)}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.2rem' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              {submitting ? 'Saving...' : tierToEdit ? 'Update Tier' : 'Create Tier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
