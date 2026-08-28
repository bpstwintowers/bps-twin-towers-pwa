import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  Car,
  Phone,
  Home,
  Copy,
  Check,
  AlertCircle,
  Radio,
  ArrowLeft,
} from 'lucide-react';
import {
  fetchResidentInvitations,
  fetchResidentVisits,
  cancelVisitorInvite,
  respondToGateRequest,
  type VisitorInvitationItem,
  type VisitItem,
} from '../../services/supabase/visitorService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { VisitorInviteModal } from './VisitorInviteModal';
import './VisitorManagement.css';

export const VisitorManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'expected' | 'waiting' | 'history'>('expected');
  const [invitations, setInvitations] = useState<VisitorInvitationItem[]>([]);
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invData, visData] = await Promise.all([
        fetchResidentInvitations(),
        fetchResidentVisits(),
      ]);
      setInvitations(invData);
      setVisits(visData);
    } catch (err: any) {
      console.error('Error loading visitor records:', err);
      setError('Failed to load your visitors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyPass = (passCode: string, name?: string) => {
    const text = `BPS Twin Towers Gate Pass\nVisitor: ${name || 'Guest'}\nPass Code: ${passCode}\nPlease present this code to security at the gate.`;
    navigator.clipboard.writeText(text);
    setCopiedCode(passCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCancelInvite = async (invitationId: string) => {
    if (!window.confirm('Cancel this visitor pass? Security will not allow entry with this pass.')) {
      return;
    }

    try {
      setActionLoading(true);
      await cancelVisitorInvite(invitationId);
      setSuccess('Visitor pass cancelled successfully.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel invitation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespond = async (invitationId: string, response: 'Approved' | 'Declined') => {
    try {
      setActionLoading(true);
      setError(null);
      await respondToGateRequest(invitationId, response);
      setSuccess(`Visitor entry request ${response.toLowerCase()} successfully!`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to respond to gate request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered lists
  const waitingApprovalList = invitations.filter((i) => i.status === 'Pending');
  const expectedList = invitations.filter(
    (i) => i.status === 'Approved' || i.status === 'Checked In'
  );
  const currentlyInsideList = visits.filter((v) => v.status === 'Inside');

  return (
    <div className="visitors-container">
      <main className="visitors-content">
        {/* Navigation Tabs and Invite Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            <button
              className={`admin-tab ${activeTab === 'expected' ? 'active' : ''}`}
              onClick={() => setActiveTab('expected')}
            >
              Expected & Active ({expectedList.length + currentlyInsideList.length})
            </button>
            <button
              className={`admin-tab ${activeTab === 'waiting' ? 'active' : ''}`}
              onClick={() => setActiveTab('waiting')}
              style={{ position: 'relative' }}
            >
              Waiting Gate Approval ({waitingApprovalList.length})
              {waitingApprovalList.length > 0 && (
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                  }}
                />
              )}
            </button>
            <button
              className={`admin-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Visit History ({visits.length})
            </button>
          </div>

          <button
            className="btn-primary"
            onClick={() => setIsInviteModalOpen(true)}
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', gap: '0.35rem' }}
          >
            <UserPlus size={15} />
            Invite Visitor
          </button>
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Loading your visitor records...
          </div>
        ) : activeTab === 'waiting' ? (
          /* WAITING APPROVAL TAB */
          <div>
            {waitingApprovalList.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={32} style={{ color: '#34d399', margin: '0 auto 0.5rem', display: 'block' }} />
                No visitors waiting at the gate right now.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {waitingApprovalList.map((req) => (
                  <div
                    key={req.id}
                    className="admin-request-card"
                    style={{ borderLeft: '4px solid #f59e0b', background: 'rgba(245, 158, 11, 0.04)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <strong style={{ fontSize: '1.05rem' }}>{req.visitor?.name}</strong>
                          <span className="badge-pending">WAITING AT GATE</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {req.visitor?.visitor_type} {req.visitor?.company ? `· ${req.visitor.company}` : ''} · Phone: {req.visitor?.phone}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                          Flat {req.flat?.flat_number} ({req.flat?.block?.name})
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {req.purpose && (
                      <div style={{ margin: '0.5rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Purpose: <em>{req.purpose}</em>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.65rem' }}>
                      <button
                        className="btn-reject"
                        onClick={() => handleRespond(req.id, 'Declined')}
                        disabled={actionLoading}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        <XCircle size={14} /> Decline Entry
                      </button>
                      <button
                        className="btn-approve"
                        onClick={() => handleRespond(req.id, 'Approved')}
                        disabled={actionLoading}
                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                      >
                        <CheckCircle2 size={14} /> Approve Entry
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'expected' ? (
          /* EXPECTED & ACTIVE TAB */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Inside society section */}
            {currentlyInsideList.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.9rem', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Radio size={14} /> Currently Inside Society ({currentlyInsideList.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {currentlyInsideList.map((v) => (
                    <div
                      key={v.id}
                      className="admin-request-card"
                      style={{ borderLeft: '4px solid #10b981', background: 'rgba(16, 185, 129, 0.04)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <strong>{v.visitor?.name}</strong>
                          <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ({v.visitor?.visitor_type})
                          </span>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            Checked In: {new Date(v.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {v.entry_gate?.name || 'Gate'}
                          </div>
                        </div>

                        <span className="badge-approved">INSIDE</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expected Invitations */}
            <div>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0.5rem 0' }}>
                Pre-Approved Passes
              </h3>

              {expectedList.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  No pre-approved invitations found. Click "Invite Visitor" to create one.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {expectedList.map((inv) => (
                    <div key={inv.id} className="admin-request-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <strong style={{ fontSize: '1.05rem' }}>{inv.visitor?.name}</strong>
                            <span className="visitor-type-pill visitor-type-guest">
                              {inv.visitor?.visitor_type}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Expected: <strong>{inv.expected_date}</strong> {inv.expected_time ? `at ${inv.expected_time}` : ''} · Flat {inv.flat?.flat_number}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="visitor-pass-badge">
                            {inv.pass_code}
                            <button
                              onClick={() => handleCopyPass(inv.pass_code, inv.visitor?.name)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
                              title="Copy Pass"
                            >
                              {copiedCode === inv.pass_code ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                            </button>
                          </div>
                          <StatusBadge status={inv.status} />
                        </div>
                      </div>

                      {inv.purpose && (
                        <div style={{ margin: '0.4rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Purpose: {inv.purpose}
                        </div>
                      )}

                      {inv.status === 'Approved' && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.5rem' }}>
                          <button
                            className="btn-outline"
                            onClick={() => handleCancelInvite(inv.id)}
                            disabled={actionLoading}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: '#f87171' }}
                          >
                            Cancel Pass
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* VISIT HISTORY TAB */
          <div>
            {visits.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                No completed visits recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {visits.map((vis) => (
                  <div key={vis.id} className="admin-request-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <strong style={{ fontSize: '0.98rem' }}>{vis.visitor?.name}</strong>
                        <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ({vis.visitor?.visitor_type})
                        </span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          In: {new Date(vis.entry_time).toLocaleDateString()} {new Date(vis.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({vis.entry_gate?.code}) · Out: {vis.exit_time ? `${new Date(vis.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${vis.exit_gate?.code || 'Gate'})` : 'Still Inside'}
                        </div>
                      </div>

                      <StatusBadge status={vis.status === 'Completed' ? 'Approved' : vis.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* INVITE MODAL */}
      <VisitorInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
