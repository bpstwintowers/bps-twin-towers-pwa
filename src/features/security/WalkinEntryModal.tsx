import React, { useState, useEffect } from 'react';
import { X, UserCheck, AlertTriangle, Send } from 'lucide-react';
import {
  gateRequestWalkIn,
  type VisitorType,
  type GateItem,
  type WalkinEntryPayload,
} from '../../services/supabase/visitorService';
import { supabase } from '../../services/supabase/client';

interface WalkinEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  gates: GateItem[];
  defaultGateId: string;
}

export const WalkinEntryModal: React.FC<WalkinEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  gates,
  defaultGateId,
}) => {
  const [flats, setFlats] = useState<any[]>([]);
  const [selectedFlatId, setSelectedFlatId] = useState('');
  const [selectedGateId, setSelectedGateId] = useState(defaultGateId);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [visitorType, setVisitorType] = useState<VisitorType>('Delivery');
  const [company, setCompany] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [purpose, setPurpose] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setName('');
      setPhone('');
      setCompany('');
      setVehicleNumber('');
      setPurpose('');
      setSelectedGateId(defaultGateId || (gates[0]?.id ?? ''));

      // Fetch active flats list for quick selector
      supabase
        .from('flats')
        .select('id, flat_number, block:blocks(name, code)')
        .order('flat_number', { ascending: true })
        .then(({ data }) => {
          setFlats(data || []);
          if (data && data.length > 0) setSelectedFlatId(data[0].id);
        });
    }
  }, [isOpen, defaultGateId, gates]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !selectedFlatId || !selectedGateId) {
      setError('Please provide visitor name, phone, destination flat, and entry gate.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: WalkinEntryPayload = {
        flat_id: selectedFlatId,
        gate_id: selectedGateId,
        name: name.trim(),
        phone: phone.trim(),
        visitor_type: visitorType,
        company: company.trim() || undefined,
        vehicle_number: vehicleNumber.trim() || undefined,
        purpose: purpose.trim() || undefined,
      };

      await gateRequestWalkIn(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error initiating walk-in entry request:', err);
      setError(err.message || 'Failed to send entry request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={20} style={{ color: '#3b82f6' }} />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Walk-in / Delivery Gate Entry</h3>
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
                Destination Flat *
              </label>
              <select
                className="admin-search-input"
                style={{ width: '100%', padding: '0.55rem' }}
                value={selectedFlatId}
                onChange={(e) => setSelectedFlatId(e.target.value)}
                required
              >
                {flats.map((f) => (
                  <option key={f.id} value={f.id}>
                    Flat {f.flat_number} ({f.block?.name || 'Tower'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Entry Gate *
              </label>
              <select
                className="admin-search-input"
                style={{ width: '100%', padding: '0.55rem' }}
                value={selectedGateId}
                onChange={(e) => setSelectedGateId(e.target.value)}
                required
              >
                {gates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Visitor Type *
              </label>
              <select
                className="admin-search-input"
                style={{ width: '100%', padding: '0.55rem' }}
                value={visitorType}
                onChange={(e) => setVisitorType(e.target.value as VisitorType)}
              >
                <option value="Delivery">Delivery (Food / Courier)</option>
                <option value="Cab">Cab / Taxi / Auto</option>
                <option value="Guest">Guest / Friend</option>
                <option value="Service Provider">Service Provider</option>
                <option value="Vendor">Vendor</option>
                <option value="Domestic Help">Domestic Help</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Company / Service
              </label>
              <input
                type="text"
                className="admin-search-input"
                style={{ width: '100%' }}
                placeholder="e.g. Swiggy / Uber"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Visitor Name *
              </label>
              <input
                type="text"
                className="admin-search-input"
                style={{ width: '100%' }}
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Visitor Phone *
              </label>
              <input
                type="tel"
                className="admin-search-input"
                style={{ width: '100%' }}
                placeholder="10-digit mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Vehicle Number
              </label>
              <input
                type="text"
                className="admin-search-input"
                style={{ width: '100%' }}
                placeholder="e.g. TN01AB1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Purpose / Item
              </label>
              <input
                type="text"
                className="admin-search-input"
                style={{ width: '100%' }}
                placeholder="e.g. Food packet / AC check"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
          </div>

          <div
            style={{
              padding: '0.65rem 0.85rem',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.78rem',
              color: '#93c5fd',
              marginBottom: '1.25rem',
            }}
          >
            Submitting will notify the resident immediately in the PWA. Entry will be permitted once approved.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ gap: '0.35rem' }}>
              <Send size={15} />
              {submitting ? 'Sending Request...' : 'Send Approval Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
