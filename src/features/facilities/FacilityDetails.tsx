import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Wrench,
} from 'lucide-react';
import {
  fetchFacilityById,
  type FacilityItem,
} from '../../services/supabase/facilityService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FacilityBookingModal } from './FacilityBookingModal';
import './FacilityList.css';

export const FacilityDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [facility, setFacility] = useState<FacilityItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchFacilityById(id);
      setFacility(data);
    } catch (err) {
      console.error('Error loading facility details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading facility details...</div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <p>Facility not found.</p>
        <button onClick={() => navigate('/facilities')} className="btn-primary">
          Back to Facilities
        </button>
      </div>
    );
  }

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
  };

  return (
    <div className="facilities-container">
      <header className="facilities-header">
        <div className="facilities-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/facilities')}
              className="btn-outline"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{facility.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {facility.category} · {facility.location || 'BPS Twin Towers'}
              </div>
            </div>
          </div>

          <StatusBadge status={facility.status} />
        </div>
      </header>

      <main className="facilities-content animate-fade-in">
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem' }}>{facility.name}</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, maxWidth: '600px' }}>
                {facility.description || 'Community facility available for all verified residents of BPS Twin Towers.'}
              </p>
            </div>

            <button
              className="btn-primary"
              onClick={() => setIsBookingModalOpen(true)}
              disabled={facility.status !== 'Active'}
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.95rem' }}
            >
              <Calendar size={18} /> Book a Slot Now
            </button>
          </div>

          {/* Quick Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: '1.25rem',
              marginTop: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary)' }}>
                <Clock size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hours</span>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  {formatTime(facility.opening_time)} – {formatTime(facility.closing_time)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <Users size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Capacity</span>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  Max {facility.capacity} Persons
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                <Calendar size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Advance Window</span>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  Up to {facility.advance_booking_days} Days
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rules & Guidelines */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.65rem' }}>Facility Rules & Guidelines</h3>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {facility.rules_terms || '1. Clean up after use. 2. Non-marking shoes compulsory in sports courts. 3. Outside food/alcohol strictly restricted in sports areas. 4. Maintain decorum and adhere to the allotted time slot.'}
          </p>
        </div>

        {/* Report Issue CTA */}
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <strong style={{ fontSize: '0.92rem', color: '#f87171' }}>Notice any maintenance issue or broken equipment?</strong>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Report directly to our maintenance team for prompt resolution.
            </p>
          </div>

          <button
            className="btn-outline"
            onClick={() => navigate(`/complaints/new?facilityId=${facility.id}&facilityName=${encodeURIComponent(facility.name)}`)}
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', gap: '0.35rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
          >
            <Wrench size={14} /> Report Facility Issue
          </button>
        </div>
      </main>

      {/* BOOKING MODAL */}
      <FacilityBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={loadData}
        facility={facility}
      />
    </div>
  );
};
