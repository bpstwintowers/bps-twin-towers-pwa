import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  XCircle,
  CheckCircle2,
  CalendarCheck,
  Plus,
} from 'lucide-react';
import {
  fetchResidentFacilityBookings,
  cancelFacilityBooking,
  type FacilityBookingItem,
} from '../../services/supabase/facilityService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import './FacilityList.css';

export const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<FacilityBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchResidentFacilityBookings();
      setBookings(data);
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      setError('Failed to load your facility bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancel = async (bookingId: string, facilityName?: string) => {
    if (!window.confirm(`Cancel your booking for ${facilityName || 'this facility'}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await cancelFacilityBooking(bookingId);
      setSuccess('Booking cancelled successfully.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
  };

  return (
    <div className="facilities-container">
      <main className="facilities-content animate-fade-in">
        {success && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#34d399',
              marginBottom: '1rem',
              fontSize: '0.85rem',
            }}
          >
            {success}
          </div>
        )}

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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Loading your bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
            <Calendar size={32} style={{ color: 'var(--accent-primary)', margin: '0 auto 0.5rem', display: 'block' }} />
            <p style={{ margin: '0 0 1rem', fontSize: '0.92rem' }}>You have no facility bookings yet.</p>
            <button className="btn-primary" onClick={() => navigate('/facilities')}>
              Browse & Book Facilities
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {bookings.map((b) => (
              <div key={b.id} className="admin-request-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '1.05rem' }}>{b.facility?.name}</strong>
                      <span className="badge-approved" style={{ fontSize: '0.72rem' }}>
                        {b.facility?.category}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Date: <strong>{b.booking_date}</strong> · Time: <strong>{formatTime(b.start_time)} – {formatTime(b.end_time)}</strong> · Flat {b.flat?.flat_number}
                    </div>
                  </div>

                  <StatusBadge status={b.status} />
                </div>

                {b.purpose && (
                  <div style={{ margin: '0.4rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Purpose: {b.purpose} · {b.participant_count} participants
                  </div>
                )}

                {b.rejection_reason && (
                  <div style={{ margin: '0.4rem 0', fontSize: '0.8rem', color: '#f87171' }}>
                    Rejection Reason: {b.rejection_reason}
                  </div>
                )}

                {(b.status === 'Confirmed' || b.status === 'Pending') && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      className="btn-outline"
                      onClick={() => handleCancel(b.id, b.facility?.name)}
                      disabled={actionLoading}
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', color: '#f87171' }}
                    >
                      <XCircle size={14} /> Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
