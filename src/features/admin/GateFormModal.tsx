import React, { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import {
  createAdminGate,
  updateAdminGate,
  type GateItem,
  type GateType,
  type GateStatus,
  type CreateGatePayload,
} from '../../services/supabase/visitorService';

interface GateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  gateToEdit?: GateItem | null;
}

export const GateFormModal: React.FC<GateFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  gateToEdit,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [gateType, setGateType] = useState<GateType>('Main');
  const [status, setStatus] = useState<GateStatus>('Active');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gateToEdit) {
      setName(gateToEdit.name);
      setCode(gateToEdit.code);
      setLocation(gateToEdit.location || '');
      setGateType(gateToEdit.gate_type);
      setStatus(gateToEdit.status);
    } else {
      setName('');
      setCode('');
      setLocation('');
      setGateType('Main');
      setStatus('Active');
    }
    setError(null);
  }, [gateToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('Please provide gate name and code.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateGatePayload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        location: location.trim() || undefined,
        gate_type: gateType,
      };

      if (gateToEdit) {
        await updateAdminGate(gateToEdit.id, { ...payload, status });
      } else {
        await createAdminGate(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving gate:', err);
      setError(err.message || 'Failed to save gate configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
              {gateToEdit ? 'Edit Security Gate' : 'Add New Gate'}
            </h3>
          </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Gate Code *
              </label>
              <input
                type="text"
                className="admin-search-input"
                style={{ width: '100%' }}
                placeholder="e.g. GATE-1"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Gate Type *
              </label>
              <select
                className="admin-search-input"
                style={{ width: '100%', padding: '0.55rem' }}
                value={gateType}
                onChange={(e) => setGateType(e.target.value as GateType)}
              >
                <option value="Main">Main Entry/Exit</option>
                <option value="Service">Service Gate</option>
                <option value="Pedestrian">Pedestrian Gate</option>
                <option value="Emergency">Emergency Gate</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Gate Name / Label *
            </label>
            <input
              type="text"
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="e.g. Main Gate (South Entry)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Location Details
            </label>
            <input
              type="text"
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="e.g. Tower A Podium Driveway"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {gateToEdit && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Gate Status
              </label>
              <select
                className="admin-search-input"
                style={{ width: '100%', padding: '0.55rem' }}
                value={status}
                onChange={(e) => setStatus(e.target.value as GateStatus)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : gateToEdit ? 'Update Gate' : 'Add Gate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
