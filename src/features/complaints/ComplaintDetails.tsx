import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wrench,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import {
  fetchComplaintDetails,
  addComplaintComment,
  respondToComplaintResolution,
  getAttachmentSignedUrl,
  type ComplaintItem,
} from '../../services/supabase/complaintService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import './ComplaintList.css';

export const ComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<ComplaintItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [reopenReason, setReopenReason] = useState('');
  const [isReopenOpen, setIsReopenOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchComplaintDetails(id);
      setComplaint(data);
    } catch (err: any) {
      console.error('Error loading complaint:', err);
      setError('Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentText.trim()) return;

    try {
      setSubmittingComment(true);
      setError(null);
      await addComplaintComment(id, commentText, false);
      setCommentText('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleRespond = async (action: 'Close' | 'Reopen') => {
    if (!id) return;
    if (action === 'Reopen' && !reopenReason.trim()) {
      setError('Please provide a reason for reopening.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await respondToComplaintResolution(id, action, reopenReason);
      setSuccess(action === 'Close' ? 'Complaint confirmed resolved and closed.' : 'Complaint reopened successfully.');
      setIsReopenOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAttachment = async (filePath: string) => {
    try {
      const url = await getAttachmentSignedUrl(filePath);
      window.open(url, '_blank');
    } catch (err) {
      alert('Could not generate attachment link.');
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading ticket details...</div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <p>Complaint ticket not found.</p>
        <button onClick={() => navigate('/complaints')} className="btn-primary">
          Back to Helpdesk
        </button>
      </div>
    );
  }

  const isOverdue = new Date(complaint.due_at) < new Date() && !['Resolved', 'Closed', 'Cancelled', 'Rejected'].includes(complaint.status);

  return (
    <div className="complaints-container">
      <header className="complaints-header">
        <div className="complaints-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/complaints')}
              className="btn-outline"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="complaint-ticket-badge">{complaint.complaint_number}</span>
                <StatusBadge status={complaint.status} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                {complaint.category} · {complaint.location_type} {complaint.flat?.flat_number ? `(Flat ${complaint.flat.flat_number})` : ''}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="complaints-content animate-fade-in">
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

        {/* Complaint Summary Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{complaint.title}</h2>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                background: complaint.priority === 'Urgent' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                color: complaint.priority === 'Urgent' ? '#f87171' : 'var(--accent-primary)',
              }}
            >
              {complaint.priority.toUpperCase()} PRIORITY
            </span>
          </div>

          <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {complaint.description}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: '0.85rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <div>
              Assigned Team: <strong style={{ color: 'var(--text-primary)' }}>{complaint.assigned_team || 'Pending Assignment'}</strong>
            </div>
            <div>
              Target Due: <strong style={{ color: isOverdue ? '#f87171' : 'var(--text-primary)' }}>{new Date(complaint.due_at).toLocaleString()}</strong> {isOverdue && '(OVERDUE)'}
            </div>
            <div>
              Created: <strong style={{ color: 'var(--text-primary)' }}>{new Date(complaint.created_at).toLocaleDateString()}</strong>
            </div>
          </div>

          {/* Attachments */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                Attachments ({complaint.attachments.length})
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {complaint.attachments.map((att) => (
                  <button
                    key={att.id}
                    className="btn-outline"
                    onClick={() => handleOpenAttachment(att.file_path)}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', gap: '0.3rem' }}
                  >
                    <FileText size={13} />
                    {att.file_name}
                    <ExternalLink size={11} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RESOLUTION BANNER / CONFIRMATION */}
        {complaint.status === 'Resolved' && (
          <div
            style={{
              padding: '1.25rem',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-xl)',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CheckCircle2 size={20} style={{ color: '#34d399' }} />
              <strong style={{ fontSize: '1rem', color: '#34d399' }}>Technician Marked Issue as Resolved</strong>
            </div>

            {complaint.resolution_summary && (
              <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Resolution Summary: {complaint.resolution_summary}
              </p>
            )}

            {!isReopenOpen ? (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="btn-approve"
                  onClick={() => handleRespond('Close')}
                  disabled={actionLoading}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                >
                  <CheckCircle2 size={15} /> Yes, Confirm Resolved & Close
                </button>
                <button
                  className="btn-outline"
                  onClick={() => setIsReopenOpen(true)}
                  disabled={actionLoading}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', color: '#f87171' }}
                >
                  <RotateCcw size={15} /> No, Issue Persists (Reopen)
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '0.75rem' }}>
                <textarea
                  rows={2}
                  className="admin-search-input"
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                  placeholder="Explain why the issue is not yet resolved..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-outline" onClick={() => setIsReopenOpen(false)}>
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => handleRespond('Reopen')}
                    disabled={actionLoading}
                    style={{ background: '#ef4444' }}
                  >
                    Confirm Reopen
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conversation & Updates Timeline */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <h3 style={{ fontSize: '1rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MessageSquare size={16} style={{ color: 'var(--accent-primary)' }} />
            Ticket Activity & Conversation ({complaint.comments?.length || 0})
          </h3>

          {/* Comments List */}
          {(!complaint.comments || complaint.comments.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No comments or updates yet. You can post a message below.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
              {complaint.comments.map((c) => (
                <div
                  key={c.id}
                  className={`comment-bubble ${c.is_internal ? 'internal' : ''}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '0.82rem' }}>
                      {c.author?.full_name || 'Staff'} {c.is_internal && <span style={{ color: '#f59e0b', fontSize: '0.72rem' }}>(Internal Staff Note)</span>}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {c.comment}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Post Comment Input */}
          {complaint.status !== 'Closed' && (
            <form onSubmit={handleAddComment}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="admin-search-input"
                  style={{ flex: 1 }}
                  placeholder="Type an update or reply for the maintenance team..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={submittingComment}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submittingComment || !commentText.trim()}
                  style={{ padding: '0.45rem 0.85rem' }}
                >
                  <Send size={15} />
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
