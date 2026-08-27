import React, { useState } from 'react';
import { X, Calendar, Clock, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { createPoojaBooking } from '../../services/supabase/eventService';

const POOJA_RITUALS = [
  { name: 'Ganesh Chaturthi Special Archana', duration: '30 mins', defaultAmount: 251 },
  { name: 'Maha Ganapathi Homam', duration: '1 hour', defaultAmount: 1100 },
  { name: 'Modak & Ladoo Prasadam Seva', duration: 'Full Day', defaultAmount: 501 },
  { name: 'Sahasranama Parayanam', duration: '45 mins', defaultAmount: 351 },
  { name: 'Visarjan Deepa Aradhana', duration: '45 mins', defaultAmount: 501 },
];

const TIME_SLOTS = [
  '07:00 AM - 07:30 AM',
  '08:00 AM - 08:30 AM',
  '09:00 AM - 09:30 AM',
  '10:30 AM - 11:00 AM',
  '05:30 PM - 06:00 PM',
  '06:30 PM - 07:00 PM',
  '07:30 PM - 08:00 PM',
];

interface PoojaBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  flatId?: string;
  flatNumber?: string;
  onSuccess?: () => void;
}

export const PoojaBookingModal: React.FC<PoojaBookingModalProps> = ({
  isOpen,
  onClose,
  flatId,
  flatNumber,
  onSuccess,
}) => {
  const [selectedRitual, setSelectedRitual] = useState(POOJA_RITUALS[0].name);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[1]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  if (!isOpen) return null;

  const ritualObj = POOJA_RITUALS.find((r) => r.name === selectedRitual) || POOJA_RITUALS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatId) {
      setError('Active flat association is required for booking a puja.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await createPoojaBooking({
        flat_id: flatId,
        ritual_name: selectedRitual,
        booking_date: bookingDate,
        time_slot: timeSlot,
        amount: ritualObj.defaultAmount,
      });
      setConfirmedBooking(res);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error booking puja:', err);
      setError(err.message || 'Failed to complete puja booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: '#f59e0b' }} />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Festival Puja Booking</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {confirmedBooking ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
              Puja Booking Confirmed!
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Reference Number: <strong>{confirmedBooking.booking_ref}</strong>
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
                gap: '0.4rem',
                marginBottom: '1.5rem',
              }}
            >
              <div><strong>Ritual:</strong> {confirmedBooking.ritual_name}</div>
              <div><strong>Date:</strong> {confirmedBooking.booking_date}</div>
              <div><strong>Slot:</strong> {confirmedBooking.time_slot}</div>
              <div><strong>Flat:</strong> {flatNumber || 'Assigned Flat'}</div>
              <div><strong>Seva Amount:</strong> ₹{confirmedBooking.amount}</div>
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

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                Select Puja / Seva Ritual *
              </label>
              <select
                className="admin-search-input"
                style={{ width: '100%', padding: '0.6rem' }}
                value={selectedRitual}
                onChange={(e) => setSelectedRitual(e.target.value)}
              >
                {POOJA_RITUALS.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name} ({r.duration} · ₹{r.defaultAmount})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Date *
                </label>
                <input
                  type="date"
                  className="admin-search-input"
                  style={{ width: '100%', padding: '0.6rem' }}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Time Slot *
                </label>
                <select
                  className="admin-search-input"
                  style={{ width: '100%', padding: '0.6rem' }}
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                >
                  {TIME_SLOTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.88rem', color: '#fbbf24' }}>
                Seva Contribution
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24' }}>
                ₹{ritualObj.defaultAmount}
              </span>
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
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                {submitting ? 'Confirming...' : 'Book Puja Slot'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
