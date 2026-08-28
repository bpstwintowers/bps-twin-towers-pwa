import React, { useState, useEffect } from 'react';
import { X, UserPlus, Copy, Check, CheckCircle2, QrCode } from 'lucide-react';
import {
  createVisitorInvite,
  type VisitorType,
  type VehicleType,
  type CreateInvitePayload,
} from '../../services/supabase/visitorService';
import { resolveUserAccess, type AccessInfo } from '../../services/supabase/registrationService';

interface VisitorInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VisitorInviteModal: React.FC<VisitorInviteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [access, setAccess] = useState<AccessInfo[]>([]);
  const [selectedFlatId, setSelectedFlatId] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [visitorType, setVisitorType] = useState<VisitorType>('Guest');
  const [company, setCompany] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('None');
  const [expectedDate, setExpectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedTime, setExpectedTime] = useState('18:00');
  const [purpose, setPurpose] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPass, setGeneratedPass] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setGeneratedPass(null);
      resolveUserAccess()
        .then((acc) => {
          setAccess(acc);
          if (acc.length > 0) setSelectedFlatId(acc[0].flat_id);
        })
        .catch((err) => console.error('Error fetching flats:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !selectedFlatId) {
      setError('Please provide visitor name, phone number, and select a flat.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateInvitePayload = {
        flat_id: selectedFlatId,
        name: name.trim(),
        phone: phone.trim(),
        visitor_type: visitorType,
        company: company.trim() || undefined,
        vehicle_number: vehicleNumber.trim() || undefined,
        vehicle_type: vehicleType,
        expected_date: expectedDate,
        expected_time: expectedTime || undefined,
        purpose: purpose.trim() || undefined,
      };

      const res = await createVisitorInvite(payload);
      setGeneratedPass(res);
      onSuccess();
    } catch (err: any) {
      console.error('Error creating visitor invitation:', err);
      setError(err.message || 'Failed to create visitor invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPass = () => {
    if (generatedPass?.pass_code) {
      const shareText = `BPS Twin Towers Gate Pass\nVisitor: ${name}\nPass Code: ${generatedPass.pass_code}\nDate: ${expectedDate}\nPlease present this code to security at the gate.`;
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Invite Visitor</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {generatedPass ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 1.25rem' }}>
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
              Invitation Created!
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Share this pass code with <strong>{name}</strong> to present at the gate for fast entry.
            </p>

            <div
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.25rem',
                textAlign: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Official Gate Pass Code
              </span>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: 'var(--accent-primary)',
                  letterSpacing: '2px',
                  margin: '0.4rem 0',
                }}
              >
                {generatedPass.pass_code}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Valid for {expectedDate}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={handleCopyPass}
                style={{ flex: 1, gap: '0.35rem' }}
              >
                {copied ? <Check size={15} style={{ color: 'var(--success)' }} /> : <Copy size={15} />}
                {copied ? 'Copied Details!' : 'Copy Invitation Details'}
              </button>
              <button type="button" className="btn-primary" onClick={onClose} style={{ flex: 1 }}>
                Done
              </button>
            </div>
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

            {/* Flat selection */}
            {access.length > 1 && (
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Host Flat *
                </label>
                <select
                  className="admin-search-input"
                  style={{ width: '100%', padding: '0.55rem' }}
                  value={selectedFlatId}
                  onChange={(e) => setSelectedFlatId(e.target.value)}
                >
                  {access.map((a) => (
                    <option key={a.flat_id} value={a.flat_id}>
                      Flat {a.flat_number} ({a.block_name})
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                  <option value="Guest">Guest / Friend / Family</option>
                  <option value="Delivery">Delivery (Food / Courier / Grocery)</option>
                  <option value="Cab">Cab / Taxi / Auto</option>
                  <option value="Service Provider">Service Provider (Plumber, AC, etc.)</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Domestic Help">Domestic Help / Maid</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Company / App (Optional)
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Swiggy / Uber / Urban Co"
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
                  placeholder="e.g. Ramesh Kumar"
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
                  Expected Date *
                </label>
                <input
                  type="date"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Expected Time
                </label>
                <input
                  type="time"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  value={expectedTime}
                  onChange={(e) => setExpectedTime(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Vehicle Type
                </label>
                <select
                  className="admin-search-input"
                  style={{ width: '100%', padding: '0.55rem' }}
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                >
                  <option value="None">No Vehicle (Pedestrian)</option>
                  <option value="2-Wheeler">2-Wheeler / Bike</option>
                  <option value="4-Wheeler">4-Wheeler / Car</option>
                  <option value="Auto/3-Wheeler">Auto / 3-Wheeler</option>
                  <option value="Commercial/Van">Commercial / Van</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Vehicle Number (Optional)
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
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Purpose / Notes (Optional)
              </label>
              <input
                type="text"
                className="admin-search-input"
                style={{ width: '100%' }}
                placeholder="e.g. Dinner visit / Kitchen sink repair"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn-outline" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Creating Pass...' : 'Generate Gate Pass →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
