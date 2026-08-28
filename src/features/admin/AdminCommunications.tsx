import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  PlusCircle,
  Radio,
  Clock,
  AlertTriangle,
  Users,
  Send,
  Edit,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  fetchCommunicationSummary,
  fetchAdminAnnouncements,
  publishAdminAnnouncement,
  cancelAdminAnnouncement,
  type CommunicationSummary,
  type AnnouncementItem,
} from '../../services/supabase/communicationService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { AnnouncementFormModal } from './AnnouncementFormModal';

export const AdminCommunications: React.FC = () => {
  const [summary, setSummary] = useState<CommunicationSummary | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumData, annData] = await Promise.all([
        fetchCommunicationSummary(),
        fetchAdminAnnouncements(statusFilter),
      ]);
      setSummary(sumData);
      setAnnouncements(annData);
    } catch (err: any) {
      console.error('Error loading communication data:', err);
      setError('Failed to load communication records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handlePublish = async (id: string, title: string) => {
    if (!window.confirm(`Broadcast and publish announcement "${title}" to the target audience?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const res = await publishAdminAnnouncement(id);
      setSuccess(`Announcement broadcasted successfully to ${res.recipients_count} residents!`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to publish announcement.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setActionLoading(true);
      setError(null);
      await cancelAdminAnnouncement(id);
      setSuccess('Announcement status set to Cancelled.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel announcement.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-subpage-layout">
      {/* Fixed Top Section: Communication Metric Cards & Sub-tabs (Does Not Scroll) */}
      <div className="admin-subpage-top">
        {/* Communication Metric Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: 'var(--accent-primary)' }}>
              {summary?.active_announcements ?? 0}
            </span>
            <span className="stat-label">Active Announcements</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: '#ef4444' }}>
              {summary?.urgent_announcements ?? 0}
            </span>
            <span className="stat-label">Urgent Alerts</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: '#34d399' }}>
              {summary?.total_notifications ?? 0}
            </span>
            <span className="stat-label">Total Dispatched In-App</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: '#fbbf24' }}>
              {summary?.unread_notifications ?? 0}
            </span>
            <span className="stat-label">Unread Notifications</span>
          </div>
        </div>

        {/* Action Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['ALL', 'Published', 'Draft', 'Cancelled'].map((st) => (
              <button
                key={st}
                className={`admin-tab ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            className="btn-primary"
            onClick={() => {
              setEditingAnnouncement(null);
              setIsModalOpen(true);
            }}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', gap: '0.35rem' }}
          >
            <PlusCircle size={15} />
            New Announcement
          </button>
        </div>
      </div>

      {/* Scrollable Announcements List (Only this scrolls!) */}
      <div className="admin-subpage-scrollable">
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

      {/* Announcements List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          Loading communications console...
        </div>
      ) : announcements.length === 0 ? (
        <div style={{ padding: '2.5rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
          No announcements found for this filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {announcements.map((a) => (
            <div key={a.id} className="admin-request-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '1.05rem' }}>{a.title}</strong>
                    {a.priority === 'Urgent' && (
                      <span className="badge-urgent">URGENT</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Category: <strong>{a.category}</strong> · Target Audience: <strong>{a.target_audience.replace('_', ' ')}</strong>
                  </div>
                </div>

                <StatusBadge status={a.status} />
              </div>

              <div className="admin-request-body" style={{ margin: '0.4rem 0 0.65rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {a.message}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Created: {new Date(a.created_at).toLocaleDateString()} · {a.creator?.full_name || 'Admin'}
                </span>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {a.status === 'Draft' && (
                    <>
                      <button
                        className="btn-outline"
                        onClick={() => {
                          setEditingAnnouncement(a);
                          setIsModalOpen(true);
                        }}
                        disabled={actionLoading}
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', gap: '0.25rem' }}
                      >
                        <Edit size={13} /> Edit
                      </button>

                      <button
                        className="btn-approve"
                        onClick={() => handlePublish(a.id, a.title)}
                        disabled={actionLoading}
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', gap: '0.25rem' }}
                      >
                        <Send size={13} /> Broadcast & Publish
                      </button>
                    </>
                  )}

                  {a.status === 'Published' && (
                    <button
                      className="btn-reject"
                      onClick={() => handleCancel(a.id)}
                      disabled={actionLoading}
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', gap: '0.25rem' }}
                    >
                      <XCircle size={13} /> Cancel Notice
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* FORM MODAL */}
      <AnnouncementFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        announcementToEdit={editingAnnouncement}
      />
    </div>
  );
};
