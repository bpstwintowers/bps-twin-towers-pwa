import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Check,
  ShieldCheck,
  Smartphone,
  Sparkles,
  HeartHandshake,
  HandHelping,
  Award,
  Megaphone,
} from 'lucide-react';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  isPushSupported,
  getPushPermissionState,
  requestPushPermission,
  type NotificationPreferenceItem,
} from '../../services/supabase/communicationService';

export const NotificationPreferences: React.FC = () => {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<NotificationPreferenceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [pushSupported] = useState(isPushSupported());
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(getPushPermissionState());

  useEffect(() => {
    fetchNotificationPreferences()
      .then((data) => setPrefs(data))
      .catch((err) => console.error('Error loading preferences:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (key: keyof NotificationPreferenceItem) => {
    if (!prefs) return;
    const updatedVal = !prefs[key];
    const newPrefs = { ...prefs, [key]: updatedVal };
    setPrefs(newPrefs);

    try {
      setSaving(true);
      await updateNotificationPreferences({ [key]: updatedVal });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Error updating preference:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePush = async () => {
    const perm = await requestPushPermission();
    setPushPermission(perm);
    if (perm === 'granted' && prefs) {
      handleToggle('push_enabled');
    }
  };

  if (loading || !prefs) {
    return (
      <div className="notif-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="notif-container">
      {/* Header */}
      <header className="notif-header">
        <div className="notif-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn-outline"
              onClick={() => navigate(-1)}
              style={{ padding: '0.45rem', borderRadius: 'var(--radius-md)' }}
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Notification Settings
              </h1>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Customize your communication preferences
              </p>
            </div>
          </div>

          {savedSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34d399', fontSize: '0.8rem', fontWeight: 600 }}>
              <Check size={16} /> Saved
            </div>
          )}
        </div>
      </header>

      <div className="notif-content">
        {/* Critical System Notice */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-xl)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <ShieldCheck size={24} style={{ color: '#34d399', flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: '0 0 0.2rem', fontSize: '0.92rem', fontWeight: 700 }}>
              Critical Security & Account Alerts
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Registration approvals, maintenance alerts, and security notices are always active to ensure community safety.
            </p>
          </div>
        </div>

        {/* Section 1: In-App Notifications */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Bell size={18} style={{ color: 'var(--accent-primary)' }} />
            In-App Notification Categories
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div className="announcement-card" style={{ padding: '0.85rem 1.15rem', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Megaphone size={18} style={{ color: '#f87171' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Community Announcements</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Society broadcasts and maintenance alerts</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.in_app_announcements}
                onChange={() => handleToggle('in_app_announcements')}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
              />
            </div>

            <div className="announcement-card" style={{ padding: '0.85rem 1.15rem', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Sparkles size={18} style={{ color: '#60a5fa' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Events & Festivals</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registration updates, pooja reminders, schedule changes</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.in_app_events}
                onChange={() => handleToggle('in_app_events')}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
              />
            </div>

            <div className="announcement-card" style={{ padding: '0.85rem 1.15rem', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <HeartHandshake size={18} style={{ color: '#34d399' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Donations & Finance</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Payment verifications, receipts, campaign reports</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.in_app_finance}
                onChange={() => handleToggle('in_app_finance')}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
              />
            </div>

            <div className="announcement-card" style={{ padding: '0.85rem 1.15rem', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <HandHelping size={18} style={{ color: '#c4b5fd' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Volunteers & Teams</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shift assignments, team alerts, coordinator updates</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.in_app_volunteers}
                onChange={() => handleToggle('in_app_volunteers')}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
              />
            </div>

            <div className="announcement-card" style={{ padding: '0.85rem 1.15rem', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Award size={18} style={{ color: '#fbbf24' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Sponsors & Partners</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sponsorship approvals, brand features, tier announcements</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.in_app_sponsors}
                onChange={() => handleToggle('in_app_sponsors')}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: PWA Browser Web Push */}
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Smartphone size={18} style={{ color: '#60a5fa' }} />
            PWA Push Notifications
          </h3>

          {!pushSupported ? (
            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Web Push notifications are not supported on this browser device.
            </div>
          ) : pushPermission !== 'granted' ? (
            <div style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Enable browser push notifications to receive instant updates when the PWA is running in the background.
              </div>
              <button
                className="btn-primary"
                onClick={handleEnablePush}
                style={{ width: 'fit-content' }}
              >
                Enable Push Notifications
              </button>
            </div>
          ) : (
            <div className="announcement-card" style={{ padding: '0.85rem 1.15rem', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Web Push Enabled</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receiving notifications on this device</div>
              </div>
              <input
                type="checkbox"
                checked={prefs.push_enabled}
                onChange={() => handleToggle('push_enabled')}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
