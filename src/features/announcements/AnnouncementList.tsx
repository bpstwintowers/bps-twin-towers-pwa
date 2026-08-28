import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone,
  ArrowLeft,
  AlertTriangle,
  Wrench,
  Sparkles,
  Shield,
  Users,
  Info,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import {
  fetchActiveAnnouncements,
  type AnnouncementItem,
  type AnnouncementCategory,
} from '../../services/supabase/communicationService';
import './AnnouncementList.css';

export const AnnouncementList: React.FC = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await fetchActiveAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Error loading announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const getCategoryIcon = (category: AnnouncementCategory) => {
    switch (category) {
      case 'Emergency':
        return <AlertTriangle size={18} style={{ color: '#ef4444' }} />;
      case 'Maintenance':
        return <Wrench size={18} style={{ color: '#fbbf24' }} />;
      case 'Festival':
        return <Sparkles size={18} style={{ color: '#c4b5fd' }} />;
      case 'Security':
        return <Shield size={18} style={{ color: '#60a5fa' }} />;
      case 'Meeting':
        return <Users size={18} style={{ color: '#34d399' }} />;
      default:
        return <Info size={18} style={{ color: 'var(--accent-primary)' }} />;
    }
  };

  const filteredAnnouncements = announcements.filter(
    (a) => categoryFilter === 'ALL' || a.category === categoryFilter
  );

  const urgentNotices = announcements.filter(
    (a) => a.priority === 'Urgent' || a.priority === 'High'
  );

  return (
    <div className="announcements-container">
      <div className="notif-content">
        {/* Category Pills */}
        <div className="notif-category-pills">
          {['ALL', 'Maintenance', 'Festival', 'Emergency', 'Security', 'Meeting', 'Notice'].map(
            (cat) => (
              <button
                key={cat}
                className={`notif-pill ${categoryFilter === cat ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            )
          )}
        </div>

        {/* Urgent Alerts Banner (if any) */}
        {categoryFilter === 'ALL' && urgentNotices.length > 0 && (
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {urgentNotices.map((u) => (
              <div
                key={u.id}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                }}
              >
                <AlertTriangle size={22} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="badge-urgent">{u.priority}</span>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>{u.title}</h4>
                  </div>
                  <p style={{ margin: '0 0 0.4rem', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {u.message}
                  </p>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Target: {u.target_audience === 'ALL' ? 'All Residents' : u.target_audience.replace('_', ' ')} ·{' '}
                    {u.published_at ? new Date(u.published_at).toLocaleDateString() : 'Just now'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Regular Announcements Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
            Loading community bulletin...
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Megaphone size={42} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.4rem' }}>No Active Announcements</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              There are no published notices in this category at this moment.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredAnnouncements.map((a) => (
              <div
                key={a.id}
                className={`announcement-card ${a.priority.toLowerCase()}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getCategoryIcon(a.category)}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{a.title}</h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {a.category} · Audience: {a.target_audience === 'ALL' ? 'All Society' : a.target_audience.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {a.published_at ? new Date(a.published_at).toLocaleDateString() : 'Active'}
                  </span>
                </div>

                <p style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {a.message}
                </p>

                {a.action_url && (
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <button
                      className="btn-outline"
                      onClick={() => navigate(a.action_url!)}
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', gap: '0.3rem' }}
                    >
                      Learn More <ExternalLink size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
