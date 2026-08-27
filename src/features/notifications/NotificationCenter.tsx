import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ArrowLeft,
  CheckCheck,
  Calendar,
  HeartHandshake,
  HandHelping,
  Award,
  Megaphone,
  ShieldAlert,
  Info,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
  type NotificationCategory,
} from '../../services/supabase/communicationService';
import './NotificationCenter.css';

export const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications(activeCategory, unreadOnly);
      setNotifications(data);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [activeCategory, unreadOnly]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    try {
      if (!notif.is_read) {
        await markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      }
      if (notif.action_url) {
        navigate(notif.action_url);
      }
    } catch (err) {
      console.error('Error clicking notification:', err);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toUpperCase()) {
      case 'EVENT':
      case 'BOOKING':
        return <Calendar size={18} style={{ color: '#60a5fa' }} />;
      case 'FINANCE':
      case 'DONATION':
        return <HeartHandshake size={18} style={{ color: '#34d399' }} />;
      case 'VOLUNTEER':
        return <HandHelping size={18} style={{ color: '#c4b5fd' }} />;
      case 'SPONSOR':
        return <Award size={18} style={{ color: '#fbbf24' }} />;
      case 'ANNOUNCEMENT':
        return <Megaphone size={18} style={{ color: '#f87171' }} />;
      case 'SECURITY':
        return <ShieldAlert size={18} style={{ color: '#ef4444' }} />;
      default:
        return <Info size={18} style={{ color: 'var(--accent-primary)' }} />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="notif-container">
      {/* Header */}
      <header className="notif-header">
        <div className="notif-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn-outline"
              onClick={() => navigate('/')}
              style={{ padding: '0.45rem', borderRadius: 'var(--radius-md)' }}
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Notification Center
              </h1>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {unreadCount > 0 ? `${unreadCount} unread messages` : 'All caught up'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {unreadCount > 0 && (
              <button
                className="btn-outline"
                onClick={handleMarkAllRead}
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem', gap: '0.3rem' }}
                title="Mark all as read"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
            <button
              className="btn-outline"
              onClick={() => navigate('/settings/notifications')}
              style={{ padding: '0.45rem', borderRadius: 'var(--radius-md)' }}
              title="Notification Preferences"
            >
              <Sliders size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="notif-content">
        {/* Category Pills Filter */}
        <div className="notif-category-pills">
          <button
            className={`notif-pill ${activeCategory === 'ALL' && !unreadOnly ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory('ALL');
              setUnreadOnly(false);
            }}
          >
            All
          </button>
          <button
            className={`notif-pill ${unreadOnly ? 'active' : ''}`}
            onClick={() => setUnreadOnly(!unreadOnly)}
            style={{ color: unreadOnly ? '#fff' : '#fbbf24' }}
          >
            Unread Only
          </button>
          <button
            className={`notif-pill ${activeCategory === 'ANNOUNCEMENT' ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory('ANNOUNCEMENT');
              setUnreadOnly(false);
            }}
          >
            📢 Notices
          </button>
          <button
            className={`notif-pill ${activeCategory === 'EVENT' ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory('EVENT');
              setUnreadOnly(false);
            }}
          >
            🎉 Events
          </button>
          <button
            className={`notif-pill ${activeCategory === 'FINANCE' ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory('FINANCE');
              setUnreadOnly(false);
            }}
          >
            💰 Donations
          </button>
          <button
            className={`notif-pill ${activeCategory === 'VOLUNTEER' ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory('VOLUNTEER');
              setUnreadOnly(false);
            }}
          >
            🤝 Volunteers
          </button>
          <button
            className={`notif-pill ${activeCategory === 'SPONSOR' ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory('SPONSOR');
              setUnreadOnly(false);
            }}
          >
            🏆 Sponsors
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Bell size={42} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.4rem' }}>No Notifications</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              {unreadOnly
                ? 'You have read all your notifications!'
                : 'No community updates found for this filter.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map((n) => {
              const priorityClass =
                n.priority === 'URGENT'
                  ? 'priority-urgent'
                  : n.priority === 'HIGH'
                  ? 'priority-high'
                  : '';

              return (
                <div
                  key={n.id}
                  className={`notif-card ${!n.is_read ? 'unread' : ''} ${priorityClass}`}
                  onClick={() => handleItemClick(n)}
                >
                  <div className="notif-icon-circle">{getCategoryIcon(n.category)}</div>

                  <div style={{ flex: 1, paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      {n.priority === 'URGENT' && <span className="badge-urgent">URGENT</span>}
                      {n.priority === 'HIGH' && <span className="badge-high">HIGH</span>}
                      <span style={{ fontSize: '0.92rem', fontWeight: n.is_read ? 600 : 700 }}>
                        {n.title}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {n.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.45rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(n.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        ·{' '}
                        {new Date(n.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {n.action_url && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--accent-primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontWeight: 600,
                          }}
                        >
                          View Details <ExternalLink size={11} />
                        </span>
                      )}
                    </div>
                  </div>

                  {!n.is_read && <div className="notif-unread-dot" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
