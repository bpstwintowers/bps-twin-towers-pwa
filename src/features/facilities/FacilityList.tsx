import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Clock,
  Users,
  MapPin,
  Calendar,
  Search,
  ArrowLeft,
  CalendarCheck,
} from 'lucide-react';
import {
  fetchActiveFacilities,
  type FacilityItem,
} from '../../services/supabase/facilityService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import './FacilityList.css';

export const FacilityList: React.FC = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchActiveFacilities(categoryFilter);
      setFacilities(data);
    } catch (err) {
      console.error('Error loading facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  const filtered = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.location && f.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const categories = ['ALL', 'Sports', 'Community', 'Fitness', 'Recreation', 'Kids'];

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
              onClick={() => navigate('/')}
              className="btn-outline"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
                Community Facilities & Amenities
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                BPS Twin Towers Resident Booking
              </div>
            </div>
          </div>

          <button
            className="btn-outline"
            onClick={() => navigate('/my-bookings')}
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', gap: '0.35rem' }}
          >
            <CalendarCheck size={16} />
            My Bookings
          </button>
        </div>
      </header>

      <main className="facilities-content animate-fade-in">
        {/* Search and Category Filters */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="admin-search-input"
              style={{ width: '100%', paddingLeft: '2.5rem' }}
              placeholder="Search facility by name or location (e.g. Badminton, Clubhouse)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`admin-tab ${categoryFilter === cat ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Facilities Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Loading facilities catalogue...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
            No facilities found matching your search.
          </div>
        ) : (
          <div className="facility-card-grid">
            {filtered.map((f) => (
              <div key={f.id} className="facility-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span className="badge-approved" style={{ fontSize: '0.72rem' }}>
                      {f.category.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Capacity: {f.capacity}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem' }}>{f.name}</h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                    <MapPin size={14} style={{ color: 'var(--accent-primary)' }} />
                    <span>{f.location || 'BPS Twin Towers'}</span>
                  </div>

                  <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {f.description || 'Available for resident recreation, sports, and community gatherings.'}
                  </p>
                </div>

                <div>
                  <div
                    style={{
                      padding: '0.65rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <span>
                      <Clock size={13} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                      {formatTime(f.opening_time)} – {formatTime(f.closing_time)}
                    </span>
                    <span>{f.slot_duration_minutes} min slots</span>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={() => navigate(`/facilities/${f.id}`)}
                    style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem' }}
                  >
                    View & Book Slot →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
