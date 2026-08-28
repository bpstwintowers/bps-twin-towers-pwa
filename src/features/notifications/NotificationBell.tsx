import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ExternalLink, BellOff } from 'lucide-react';
import {
  fetchUnreadCount,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from '../../services/supabase/communicationService';
import './NotificationBell.css';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifs = async () => {
    try {
      const [count, notifs] = await Promise.all([
        fetchUnreadCount().catch(() => 0),
        fetchNotifications('ALL', false).catch(() => []),
      ]);
      setUnreadCount(count);
      setRecentNotifs(notifs.slice(0, 5));
    } catch (err) {
      console.error('Error loading notification bell data:', err);
    }
  };

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpenDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadNotifs();
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      if (!notif.is_read) {
        await markNotificationRead(notif.id);
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setIsOpen(false);
      if (notif.action_url) {
        navigate(notif.action_url);
      } else {
        navigate('/notifications');
      }
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleOpenDropdown}
        className="notification-bell-trigger"
        title="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="notification-bell-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-menu animate-fade-in">
          {/* Header */}
          <div className="notif-dropdown-header">
            <div className="notif-header-title">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="notif-count-pill">{unreadCount}</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="btn-mark-all-read"
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="notif-dropdown-list">
            {recentNotifs.length === 0 ? (
              <div className="notif-dropdown-empty">
                <BellOff size={24} style={{ color: '#94a3b8' }} />
                <span>No notifications right now</span>
              </div>
            ) : (
              recentNotifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`notif-dropdown-item ${n.is_read ? 'read' : 'unread'}`}
                >
                  <div className="notif-item-top">
                    <span className="notif-item-title">{n.title}</span>
                    <span className="notif-item-time">
                      {new Date(n.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="notif-item-message">{n.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="notif-dropdown-footer">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="btn-open-notif-center"
            >
              <span>Open Notification Center</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
