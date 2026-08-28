import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  fetchFacilityAvailability,
  bookFacility,
  type FacilityItem,
  type SlotAvailability,
  type CreateFacilityBookingPayload,
} from '../../services/supabase/facilityService';
import { resolveUserAccess, type AccessInfo } from '../../services/supabase/registrationService';

interface FacilityBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  facility: FacilityItem;
}

export const FacilityBookingModal: React.FC<FacilityBookingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  facility,
}) => {
  const [access, setAccess] = useState<AccessInfo[]>([]);
  const [selectedFlatId, setSelectedFlatId] = useState('');

  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotAvailability | null>(null);

  const [participantCount, setParticipantCount] = useState(1);
  const [purpose, setPurpose] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessResult(null);
      setSelectedSlot(null);
      setAgreedTerms(false);
      setParticipantCount(1);
      setPurpose('');

      resolveUserAccess()
        .then((acc) => {
          setAccess(acc);
          if (acc.length > 0) setSelectedFlatId(acc[0].flat_id);
        })
        .catch((err) => console.error('Error fetching flats:', err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && facility && bookingDate) {
      setLoadingSlots(true);
      setSelectedSlot(null);
      fetchFacilityAvailability(facility.id, bookingDate)
        .then((s) => setSlots(s))
        .catch((err) => {
          console.error('Error loading slots:', err);
          setSlots([]);
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [isOpen, facility, bookingDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlatId || !selectedSlot) {
      setError('Please select a flat and an available time slot.');
      return;
    }

    if (!agreedTerms) {
      setError('Please accept the facility usage rules and terms.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateFacilityBookingPayload = {
        facility_id: facility.id,
        flat_id: selectedFlatId,
        booking_date: bookingDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        participant_count: Number(participantCount),
        purpose: purpose.trim() || undefined,
      };

      const res = await bookFacility(payload);
      setSuccessResult(res);
      onSuccess();
    } catch (err: any) {
      console.error('Error booking facility:', err);
      setError(err.message || 'Failed to book slot.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Book {facility.name}</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {facility.location || 'BPS Twin Towers'} · Max Capacity: {facility.capacity} persons
            </span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {successResult ? (
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
              Booking {successResult.status}!
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Your slot at <strong>{facility.name}</strong> on <strong>{bookingDate}</strong> ({selectedSlot?.label}) has been {successResult.status.toLowerCase()}.
            </p>

            <button type="button" className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
              View My Bookings
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

            {/* Flat selection */}
            {access.length > 1 && (
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Booking For Flat *
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

            {/* Date Selection */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Select Booking Date *
              </label>
              <input
                type="date"
                className="admin-search-input"
                style={{ width: '100%' }}
                min={new Date().toISOString().split('T')[0]}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                required
              />
            </div>

            {/* Slots Grid */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                Available Time Slots ({facility.slot_duration_minutes} min slots)
              </label>

              {loadingSlots ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Checking slot availability...
                </div>
              ) : slots.length === 0 ? (
                <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No slots available on this date.
                </div>
              ) : (
                <div className="slot-grid">
                  {slots.map((s) => (
                    <button
                      key={s.start_time}
                      type="button"
                      disabled={!s.is_available}
                      className={`slot-btn ${
                        selectedSlot?.start_time === s.start_time
                          ? 'selected'
                          : s.is_available
                          ? 'available'
                          : 'unavailable'
                      }`}
                      onClick={() => setSelectedSlot(s)}
                    >
                      <div>{s.label}</div>
                      {!s.is_available && (
                        <div style={{ fontSize: '0.68rem', marginTop: '0.15rem' }}>
                          {s.reason || 'Booked'}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Participant Count *
                </label>
                <input
                  type="number"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  min={1}
                  max={facility.capacity}
                  value={participantCount}
                  onChange={(e) => setParticipantCount(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Purpose / Event (Optional)
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Practice / Birthday"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>
            </div>

            {/* Rules / Terms */}
            {facility.rules_terms && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1rem',
                  lineHeight: 1.4,
                }}
              >
                <strong>Facility Rules:</strong> {facility.rules_terms}
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem' }}>
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  required
                />
                <span>I agree to follow BPS Twin Towers facility usage rules and timings.</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn-outline" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || !selectedSlot || !agreedTerms}
              >
                {submitting ? 'Confirming...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
