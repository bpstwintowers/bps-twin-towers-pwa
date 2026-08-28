import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle,
  XCircle,
  PlusCircle,
  Search,
  Filter,
  Receipt,
  Globe,
  Building,
  Coins,
  Gift,
  Clock,
  CheckCircle2,
  Edit,
  X,
} from 'lucide-react';
import {
  fetchSponsorSummary,
  fetchSponsorTiers,
  fetchAdminSponsors,
  fetchAdminSponsorships,
  fetchAdminContributions,
  approveAdminSponsorship,
  rejectAdminSponsorship,
  verifyAdminContribution,
  rejectAdminContribution,
  type SponsorSummary,
  type SponsorTierItem,
  type SponsorItem,
  type SponsorshipItem,
  type SponsorContributionItem,
} from '../../services/supabase/sponsorService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SponsorTierModal } from './SponsorTierModal';

type SponsorSubTab = 'approvals' | 'sponsorships' | 'tiers' | 'contributions';

export const AdminSponsors: React.FC = () => {
  const [subTab, setSubTab] = useState<SponsorSubTab>('approvals');
  const [summary, setSummary] = useState<SponsorSummary | null>(null);
  const [tiers, setTiers] = useState<SponsorTierItem[]>([]);
  const [sponsorships, setSponsorships] = useState<SponsorshipItem[]>([]);
  const [contributions, setContributions] = useState<SponsorContributionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Tier Modal
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<SponsorTierItem | null>(null);

  // Reject Modal
  const [rejectType, setRejectType] = useState<'sponsorship' | 'contribution' | null>(null);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectTargetName, setRejectTargetName] = useState<string>('');
  const [rejectReason, setRejectReason] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumData, tiersData, shipsData, contribData] = await Promise.all([
        fetchSponsorSummary(),
        fetchSponsorTiers(),
        fetchAdminSponsorships(),
        fetchAdminContributions(),
      ]);
      setSummary(sumData);
      setTiers(tiersData);
      setSponsorships(shipsData);
      setContributions(contribData);
    } catch (err: any) {
      console.error('Error loading admin sponsor data:', err);
      setError('Failed to load sponsor records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveSponsorship = async (id: string) => {
    try {
      setActionLoading(true);
      setError(null);
      await approveAdminSponsorship(id);
      setSuccess('Sponsorship officially approved!');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve sponsorship.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyContribution = async (id: string) => {
    try {
      setActionLoading(true);
      setError(null);
      await verifyAdminContribution(id);
      setSuccess('Contribution verified and logged in financial accounts.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to verify contribution.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTargetId || !rejectReason.trim()) {
      setError('Rejection reason is required.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      if (rejectType === 'sponsorship') {
        await rejectAdminSponsorship(rejectTargetId, rejectReason);
        setSuccess('Sponsorship marked as rejected.');
      } else {
        await rejectAdminContribution(rejectTargetId, rejectReason);
        setSuccess('Contribution rejected.');
      }
      setRejectType(null);
      setRejectTargetId(null);
      setRejectReason('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to execute rejection.');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingSponsorships = sponsorships.filter((s) => s.status === 'Pending Approval');
  const pendingContributions = contributions.filter((c) => c.status === 'Pending');

  return (
    <div className="admin-subpage-layout">
      {/* Fixed Top Section: Sponsorship KPI Cards & Sub-tabs (Does Not Scroll) */}
      <div className="admin-subpage-top">
        {/* Financial & Sponsorship Stats Grid */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: '#fbbf24' }}>
              ₹{(summary?.verified_cash_amount ?? 0).toLocaleString('en-IN')}
            </span>
            <span className="stat-label">Verified Sponsor Cash</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: '#60a5fa' }}>
              ₹{(summary?.verified_in_kind_estimated_value ?? 0).toLocaleString('en-IN')}
            </span>
            <span className="stat-label">In-Kind Estimated Value</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: '#34d399' }}>
              ₹{(summary?.total_sponsorship_value ?? 0).toLocaleString('en-IN')}
            </span>
            <span className="stat-label">Total Sponsorship Value</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-value">
              {summary?.active_sponsorships ?? 0}
            </span>
            <span className="stat-label">Active Sponsorships</span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className={`admin-tab ${subTab === 'approvals' ? 'active' : ''}`}
              onClick={() => setSubTab('approvals')}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              <Clock size={15} />
              Approvals & Verification
              {(pendingSponsorships.length + pendingContributions.length) > 0 && (
                <span className="admin-tab-count">
                  {pendingSponsorships.length + pendingContributions.length}
                </span>
              )}
            </button>

            <button
              className={`admin-tab ${subTab === 'sponsorships' ? 'active' : ''}`}
              onClick={() => setSubTab('sponsorships')}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              <Award size={15} />
              Sponsorships ({sponsorships.length})
            </button>

            <button
              className={`admin-tab ${subTab === 'tiers' ? 'active' : ''}`}
              onClick={() => setSubTab('tiers')}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              <Coins size={15} />
              Tiers & Packages ({tiers.length})
            </button>

            <button
              className={`admin-tab ${subTab === 'contributions' ? 'active' : ''}`}
              onClick={() => setSubTab('contributions')}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              <Receipt size={15} />
              Contributions Ledger
            </button>
          </div>

          {subTab === 'tiers' && (
            <button
              className="btn-primary"
              onClick={() => {
                setEditingTier(null);
                setIsTierModalOpen(true);
              }}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', gap: '0.35rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              <PlusCircle size={15} />
              New Tier
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content (Only this scrolls!) */}
      <div className="admin-subpage-scrollable">

      {/* SUB-TAB 1: APPROVALS & VERIFICATION QUEUE */}
      {subTab === 'approvals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Pending Sponsorship Applications */}
          <div>
            <h4 style={{ fontSize: '1rem', margin: '0 0 0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Award size={16} style={{ color: '#fbbf24' }} />
              Pending Sponsorship Approvals ({pendingSponsorships.length})
            </h4>

            {pendingSponsorships.length === 0 ? (
              <div style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ✓ No pending sponsorship applications requiring review.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingSponsorships.map((s) => {
                  const contrib = s.contributions?.[0];
                  return (
                    <div key={s.id} className="admin-request-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <div>
                          <strong style={{ fontSize: '1.05rem' }}>{s.sponsor?.name}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                            ({s.sponsor?.sponsor_type})
                          </span>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>

                      <div className="admin-request-body">
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Target:</span>{' '}
                          <strong>{s.event?.title || s.campaign?.title || 'Community Initiative'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Tier:</span>{' '}
                          <strong>{s.tier?.name || 'Standard'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Contact:</span>{' '}
                          <strong>{s.sponsor?.contact_name}</strong> ({s.sponsor?.phone || s.sponsor?.email || 'No phone'})
                        </div>
                        {contrib && (
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Proposed Value:</span>{' '}
                            <strong style={{ color: '#34d399' }}>
                              {contrib.contribution_type === 'Monetary'
                                ? `₹${contrib.amount?.toLocaleString('en-IN')}`
                                : `${contrib.in_kind_description} (Est ₹${contrib.in_kind_estimated_value?.toLocaleString('en-IN')})`}
                            </strong>
                          </div>
                        )}
                      </div>

                      <div className="admin-request-actions">
                        <button
                          className="btn-approve"
                          onClick={() => handleApproveSponsorship(s.id)}
                          disabled={actionLoading}
                          style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                        >
                          <CheckCircle size={14} />
                          Approve Sponsorship
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => {
                            setRejectType('sponsorship');
                            setRejectTargetId(s.id);
                            setRejectTargetName(s.sponsor?.name || 'Sponsorship');
                            setRejectReason('');
                          }}
                          disabled={actionLoading}
                          style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Contribution Verifications */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <h4 style={{ fontSize: '1rem', margin: '0 0 0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Receipt size={16} style={{ color: '#34d399' }} />
              Pending Contribution Verifications ({pendingContributions.length})
            </h4>

            {pendingContributions.length === 0 ? (
              <div style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ✓ All recorded sponsor contributions have been verified.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingContributions.map((c) => (
                  <div key={c.id} className="admin-request-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <div>
                        <strong style={{ fontSize: '1.05rem' }}>
                          {c.contribution_type === 'Monetary'
                            ? `₹${c.amount?.toLocaleString('en-IN')} (via ${c.payment_method})`
                            : `In-Kind: ${c.in_kind_description} (${c.in_kind_quantity} ${c.in_kind_unit})`}
                        </strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Sponsor: <strong>{c.sponsorship?.sponsor?.name}</strong>
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="admin-request-body">
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Receipt Ref:</span>{' '}
                        <strong>{c.receipt_number}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Transaction ID:</span>{' '}
                        <strong>{c.payment_reference || 'N/A'}</strong>
                      </div>
                      {c.in_kind_estimated_value && (
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Est. In-Kind Value:</span>{' '}
                          <strong>₹{c.in_kind_estimated_value.toLocaleString('en-IN')}</strong>
                        </div>
                      )}
                    </div>

                    <div className="admin-request-actions">
                      <button
                        className="btn-approve"
                        onClick={() => handleVerifyContribution(c.id)}
                        disabled={actionLoading}
                        style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                      >
                        <CheckCircle size={14} />
                        Verify Contribution
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => {
                          setRejectType('contribution');
                          setRejectTargetId(c.id);
                          setRejectTargetName(c.receipt_number || 'Contribution');
                          setRejectReason('');
                        }}
                        disabled={actionLoading}
                        style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SPONSORSHIPS MANAGER */}
      {subTab === 'sponsorships' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {sponsorships.map((s) => (
            <div key={s.id} className="admin-request-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <div>
                  <strong style={{ fontSize: '1.05rem' }}>{s.sponsor?.name}</strong>
                  {s.tier && (
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#fbbf24',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        marginLeft: '0.5rem',
                      }}
                    >
                      {s.tier.name}
                    </span>
                  )}
                </div>
                <StatusBadge status={s.status} />
              </div>

              <div className="admin-request-body">
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Target:</span>{' '}
                  <strong>{s.event?.title || s.campaign?.title || 'Community Initiative'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Contact:</span>{' '}
                  <strong>{s.sponsor?.contact_name}</strong> ({s.sponsor?.phone || s.sponsor?.email || 'N/A'})
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Visibility:</span>{' '}
                  <strong>{s.visibility}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 3: TIERS & PACKAGES */}
      {subTab === 'tiers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {tiers.map((t) => (
            <div key={t.id} className="admin-request-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <div>
                  <strong style={{ fontSize: '1.1rem', color: '#fbbf24' }}>{t.name}</strong>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginLeft: '0.75rem', fontWeight: 700 }}>
                    Min: ₹{t.minimum_amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <StatusBadge status={t.status} />
              </div>

              {t.description && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {t.description}
                </div>
              )}

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Benefits ({t.benefits.length}): {t.benefits.join(' · ')}
              </div>

              <div className="admin-request-actions">
                <button
                  className="btn-outline"
                  onClick={() => {
                    setEditingTier(t);
                    setIsTierModalOpen(true);
                  }}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem', gap: '0.35rem' }}
                >
                  <Edit size={14} />
                  Edit Tier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 4: CONTRIBUTIONS LEDGER */}
      {subTab === 'contributions' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Sponsor</th>
                <th>Target Initiative</th>
                <th>Type</th>
                <th>Value / Items</th>
                <th>Mode / Ref</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {contributions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No sponsor contributions logged yet.
                  </td>
                </tr>
              ) : (
                contributions.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.receipt_number}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(c.contributed_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.sponsorship?.sponsor?.name || '—'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.sponsorship?.sponsor?.sponsor_type}</div>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {c.sponsorship?.event?.title || c.sponsorship?.campaign?.title || 'Community Initiative'}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background: c.contribution_type === 'Monetary' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: c.contribution_type === 'Monetary' ? '#fbbf24' : '#60a5fa',
                        }}
                      >
                        {c.contribution_type}
                      </span>
                    </td>
                    <td>
                      {c.contribution_type === 'Monetary' ? (
                        <strong style={{ color: '#34d399' }}>₹{c.amount?.toLocaleString('en-IN')}</strong>
                      ) : (
                        <div>
                          <div>{c.in_kind_description}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {c.in_kind_quantity} {c.in_kind_unit} (Est ₹{c.in_kind_estimated_value?.toLocaleString('en-IN')})
                          </div>
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.78rem' }}>
                      {c.payment_method ? `${c.payment_method} (${c.payment_reference || 'N/A'})` : 'In-Kind Delivery'}
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* TIER MODAL */}
      <SponsorTierModal
        isOpen={isTierModalOpen}
        onClose={() => setIsTierModalOpen(false)}
        onSuccess={loadData}
        tierToEdit={editingTier}
      />

      {/* REJECT MODAL */}
      {rejectTargetId && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                Reject {rejectType === 'sponsorship' ? 'Sponsorship' : 'Contribution'}
              </h3>
              <button onClick={() => setRejectTargetId(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Rejecting proposal for <strong>{rejectTargetName}</strong>. Please provide a clear explanation for the records.
              </p>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                className="admin-search-input"
                style={{ width: '100%' }}
                placeholder="e.g. Terms do not align with society community guidelines..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setRejectTargetId(null)} disabled={actionLoading}>
                Back
              </button>
              <button className="btn-reject" onClick={handleConfirmReject} disabled={actionLoading || !rejectReason.trim()}>
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
