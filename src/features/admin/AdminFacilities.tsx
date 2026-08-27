import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  PlusCircle,
  Clock,
  Calendar,
  Users,
  Edit,
  CheckCircle2,
  XCircle,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import {
  fetchAdminFacilities,
  fetchAdminFacilityBookings,
  fetchFacilityBlocks,
  adminRespondFacilityBooking,
  type FacilityItem,
  type FacilityBookingItem,
  type FacilityBlockItem,
} from '../../services/supabase/facilityService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FacilityFormModal } from './FacilityFormModal';
import { MaintenanceBlockModal } from './MaintenanceBlockModal';

export const AdminFacilities: React.FC = () => {
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [bookings, setBookings] = useState<FacilityBookingItem[]>([]);
  const [blocks, setBlocks] = useState<FacilityBlockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeSubTab, setActiveSubTab] = useState<'facilities' | 'bookings' | 'blocks'>('facilities');
  const [bookingFilter, setBookingFilter] = useState('ALL');

  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<FacilityItem | null>(null);

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [facData, bookData, blkData] = await Promise.all([
        fetchAdminFacilities(),
        fetchAdminFacilityBookings(bookingFilter),
        fetchFacilityBlocks(),
      ]);

      setFacilities(facData);
      setBookings(bookData);
      setBlocks(blkData);
    } catch (err: any) {
      console.error('Error loading facilities data:', err);
      setError('Failed to load facility records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [bookingFilter]);

  const handleRespond = async (bookingId: string, action: 'Approved' | 'Rejected') => {
    let reason = '';
    if (action === 'Rejected') {
      reason = window.prompt('Please provide a rejection reason:') || '';
    }

    try {
      setActionLoading(true);
      setError(null);
      await adminRespondFacilityBooking(bookingId, action, reason);
      setSuccess(`Booking ${action.toLowerCase()} successfully.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = bookings.filter((b) => b.status === 'Pending').length;

  return (
    <div className="animate-fade-in">
      {/* Metric Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-stat-card">
          <span className="stat-value" style={{ color: 'var(--accent-primary)' }}>
            {facilities.filter((f) => f.status === 'Active').length}
          </span>
          <span className="stat-label">Active Facilities</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-value" style={{ color: '#10b981' }}>
            {bookings.filter((b) => b.status === 'Confirmed').length}
          </span>
          <span className="stat-label">Confirmed Bookings</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-value" style={{ color: '#fbbf24' }}>
            {pendingCount}
          </span>
          <span className="stat-label">Pending Approvals</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-value" style={{ color: '#f87171' }}>
            {blocks.filter((b) => b.status === 'Active').length}
          </span>
          <span className="stat-label">Maintenance Blocks</span>
        </div>
      </div>

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

      {/* Sub Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`admin-tab ${activeSubTab === 'facilities' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('facilities')}
          >
            Facilities Catalog ({facilities.length})
          </button>
          <button
            className={`admin-tab ${activeSubTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('bookings')}
          >
            Bookings Queue {pendingCount > 0 && `(${pendingCount} Pending)`}
          </button>
          <button
            className={`admin-tab ${activeSubTab === 'blocks' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('blocks')}
          >
            Maintenance Blocks ({blocks.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeSubTab === 'facilities' && (
            <button
              className="btn-primary"
              onClick={() => {
                setEditingFacility(null);
                setIsFacilityModalOpen(true);
              }}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', gap: '0.35rem' }}
            >
              <PlusCircle size={15} /> Add Facility
            </button>
          )}

          {activeSubTab === 'blocks' && (
            <button
              className="btn-primary"
              onClick={() => setIsBlockModalOpen(true)}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', gap: '0.35rem', background: '#f59e0b' }}
            >
              <Wrench size={15} /> Schedule Block
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          Loading facility management data...
        </div>
      ) : activeSubTab === 'facilities' ? (
        /* FACILITIES CATALOG */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {facilities.map((f) => (
            <div key={f.id} className="admin-request-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <strong style={{ fontSize: '1.1rem' }}>{f.name}</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {f.category} · {f.location || 'BPS Twin Towers'}
                  </div>
                </div>

                <StatusBadge status={f.status} />
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Hours: {f.opening_time.substring(0, 5)} – {f.closing_time.substring(0, 5)} · Max {f.capacity} persons · {f.slot_duration_minutes}m slots
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.5rem' }}>
                <button
                  className="btn-outline"
                  onClick={() => {
                    setEditingFacility(f);
                    setIsFacilityModalOpen(true);
                  }}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', gap: '0.25rem' }}
                >
                  <Edit size={13} /> Edit Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : activeSubTab === 'bookings' ? (
        /* BOOKINGS QUEUE */
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {['ALL', 'Pending', 'Confirmed', 'Cancelled', 'Rejected'].map((st) => (
              <button
                key={st}
                className={`admin-tab ${bookingFilter === st ? 'active' : ''}`}
                onClick={() => setBookingFilter(st)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                {st}
              </button>
            ))}
          </div>

          {bookings.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              No bookings found for this filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {bookings.map((b) => (
                <div key={b.id} className="admin-request-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '1.05rem' }}>{b.facility?.name}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Flat {b.flat?.flat_number} ({b.booker?.full_name || 'Resident'})
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Date: <strong>{b.booking_date}</strong> ({b.start_time.substring(0, 5)} – {b.end_time.substring(0, 5)}) · {b.participant_count} participants {b.purpose ? `· Purpose: ${b.purpose}` : ''}
                      </div>
                    </div>

                    <StatusBadge status={b.status} />
                  </div>

                  {b.status === 'Pending' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        className="btn-reject"
                        onClick={() => handleRespond(b.id, 'Rejected')}
                        disabled={actionLoading}
                        style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <button
                        className="btn-approve"
                        onClick={() => handleRespond(b.id, 'Approved')}
                        disabled={actionLoading}
                        style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
                      >
                        <CheckCircle2 size={14} /> Approve Booking
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* MAINTENANCE BLOCKS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {blocks.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              No maintenance blocks scheduled.
            </div>
          ) : (
            blocks.map((blk) => (
              <div key={blk.id} className="admin-request-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <strong style={{ fontSize: '1rem' }}>{blk.facility?.name}</strong>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Date: <strong>{blk.block_date}</strong> ({blk.start_time.substring(0, 5)} – {blk.end_time.substring(0, 5)}) · Reason: <em>{blk.reason}</em>
                    </div>
                  </div>

                  <span className="badge-pending">MAINTENANCE BLOCK</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODALS */}
      <FacilityFormModal
        isOpen={isFacilityModalOpen}
        onClose={() => setIsFacilityModalOpen(false)}
        onSuccess={loadData}
        facilityToEdit={editingFacility}
      />

      <MaintenanceBlockModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onSuccess={loadData}
        facilities={facilities}
      />
    </div>
  );
};
