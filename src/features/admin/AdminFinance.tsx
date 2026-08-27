import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  CheckCircle,
  XCircle,
  AlertTriangle,
  PlusCircle,
  Search,
  Filter,
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle2,
  X,
  Edit,
} from 'lucide-react';
import {
  fetchFinanceSummary,
  fetchAdminCampaigns,
  fetchAdminDonations,
  verifyAdminDonation,
  rejectAdminDonation,
  activateAdminCampaign,
  closeAdminCampaign,
  type FinanceSummary,
  type CampaignItem,
  type DonationItem,
} from '../../services/supabase/financeService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CampaignFormModal } from './CampaignFormModal';

type FinanceSubTab = 'verification' | 'campaigns' | 'ledger';

export const AdminFinance: React.FC = () => {
  const [subTab, setSubTab] = useState<FinanceSubTab>('verification');
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null);

  // Reject Modal
  const [rejectingDonation, setRejectingDonation] = useState<DonationItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumData, campData, donData] = await Promise.all([
        fetchFinanceSummary(),
        fetchAdminCampaigns(),
        fetchAdminDonations(campaignFilter, statusFilter, search),
      ]);
      setSummary(sumData);
      setCampaigns(campData);
      setDonations(donData);
    } catch (err: any) {
      console.error('Error loading finance admin data:', err);
      setError('Failed to load financial records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [campaignFilter, statusFilter]);

  const handleVerify = async (donationId: string) => {
    try {
      setActionLoading(true);
      setError(null);
      await verifyAdminDonation(donationId);
      setSuccess('Donation verified! Donor has been sent confirmation.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to verify donation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingDonation) return;
    if (!rejectReason.trim()) {
      setError('Rejection reason is required.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await rejectAdminDonation(rejectingDonation.id, rejectReason);
      setSuccess('Donation marked as rejected.');
      setRejectingDonation(null);
      setRejectReason('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to reject donation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleCampaignStatus = async (c: CampaignItem) => {
    try {
      setActionLoading(true);
      setError(null);
      if (c.status === 'Active') {
        await closeAdminCampaign(c.id);
        setSuccess('Campaign closed for new contributions.');
      } else {
        await activateAdminCampaign(c.id);
        setSuccess('Campaign activated!');
      }
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update campaign status.');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingDonations = donations.filter((d) => d.status === 'Pending');

  return (
    <div className="animate-fade-in">
      {/* Financial Summary Stat Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-stat-card">
          <span className="stat-value" style={{ color: '#34d399' }}>
            ₹{(summary?.total_verified_amount ?? 0).toLocaleString('en-IN')}
          </span>
          <span className="stat-label">Total Verified Collections</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-value" style={{ color: '#fbbf24' }}>
            ₹{(summary?.total_pending_amount ?? 0).toLocaleString('en-IN')}
          </span>
          <span className="stat-label">Pending Verification ({summary?.pending_donations_count ?? 0})</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-value" style={{ color: 'var(--accent-primary)' }}>
            ₹{(summary?.total_target ?? 0).toLocaleString('en-IN')}
          </span>
          <span className="stat-label">Total Target ({summary?.active_campaigns ?? 0} Active)</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-value">
            {summary?.verified_donations_count ?? 0}
          </span>
          <span className="stat-label">Verified Receipts</span>
        </div>
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

      {/* Sub-tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`admin-tab ${subTab === 'verification' ? 'active' : ''}`}
            onClick={() => setSubTab('verification')}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            <Clock size={15} />
            Verification Queue
            {pendingDonations.length > 0 && (
              <span className="admin-tab-count">{pendingDonations.length}</span>
            )}
          </button>

          <button
            className={`admin-tab ${subTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setSubTab('campaigns')}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            <TrendingUp size={15} />
            Campaigns ({campaigns.length})
          </button>

          <button
            className={`admin-tab ${subTab === 'ledger' ? 'active' : ''}`}
            onClick={() => setSubTab('ledger')}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            <Receipt size={15} />
            All Donations Ledger
          </button>
        </div>

        {subTab === 'campaigns' && (
          <button
            className="btn-primary"
            onClick={() => {
              setEditingCampaign(null);
              setIsCampaignModalOpen(true);
            }}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', gap: '0.35rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <PlusCircle size={15} />
            New Campaign
          </button>
        )}
      </div>

      {/* SUB-TAB 1: VERIFICATION QUEUE */}
      {subTab === 'verification' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              Loading verification queue...
            </div>
          ) : pendingDonations.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <CheckCircle2 size={36} style={{ color: '#34d399', marginBottom: '0.5rem', opacity: 0.8 }} />
              <h4 style={{ margin: '0 0 0.25rem' }}>Verification Queue Clear</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                All submitted resident donations have been verified.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {pendingDonations.map((d) => (
                <div key={d.id} className="admin-request-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>
                          ₹{d.amount.toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          via <strong>{d.payment_method}</strong>
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {d.campaign?.title || 'Community Campaign'}
                      </div>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>

                  <div className="admin-request-body">
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Donor:</span>{' '}
                      <strong>{d.donor_name}</strong>
                      {d.donor_mobile && <span style={{ color: 'var(--text-muted)' }}> ({d.donor_mobile})</span>}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Flat:</span>{' '}
                      <strong>{d.flat_number ? `Flat ${d.flat_number}` : 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Receipt Ref:</span>{' '}
                      <strong>{d.receipt_number}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Transaction ID:</span>{' '}
                      <strong>{d.payment_reference || 'Not provided'}</strong>
                    </div>
                  </div>

                  {d.notes && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      <em>"{d.notes}"</em>
                    </div>
                  )}

                  <div className="admin-request-actions">
                    <button
                      className="btn-approve"
                      onClick={() => handleVerify(d.id)}
                      disabled={actionLoading}
                      style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                    >
                      <CheckCircle size={14} />
                      Verify Donation
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => setRejectingDonation(d)}
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
      )}

      {/* SUB-TAB 2: CAMPAIGNS MANAGER */}
      {subTab === 'campaigns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {campaigns.map((c) => {
            const verified = c.verified_total || 0;
            const target = c.target_amount || 0;
            const progress = target > 0 ? Math.min(100, Math.round((verified / target) * 100)) : 0;

            return (
              <div key={c.id} className="admin-request-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        marginRight: '0.5rem',
                      }}
                    >
                      {c.category}
                    </span>
                    <strong style={{ fontSize: '1.05rem' }}>{c.title}</strong>
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                <div className="admin-request-body">
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Target:</span>{' '}
                    <strong>₹{target.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Verified Collection:</span>{' '}
                    <strong style={{ color: '#34d399' }}>₹{verified.toLocaleString('en-IN')}</strong> ({progress}%)
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Start Date:</span>{' '}
                    <strong>{new Date(c.start_date).toLocaleDateString()}</strong>
                  </div>
                </div>

                <div className="admin-request-actions">
                  <button
                    className="btn-outline"
                    onClick={() => {
                      setEditingCampaign(c);
                      setIsCampaignModalOpen(true);
                    }}
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem', gap: '0.35rem' }}
                  >
                    <Edit size={14} />
                    Edit
                  </button>

                  <button
                    className="btn-outline"
                    onClick={() => handleToggleCampaignStatus(c)}
                    disabled={actionLoading}
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                  >
                    {c.status === 'Active' ? 'Close Campaign' : 'Reactivate Campaign'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 3: ALL DONATIONS LEDGER */}
      {subTab === 'ledger' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Donor</th>
                <th>Flat</th>
                <th>Campaign</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Ref ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {donations.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No donations recorded yet.
                  </td>
                </tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.receipt_number}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(d.donated_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.donor_name}</div>
                      {d.donor_mobile && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.donor_mobile}</div>}
                    </td>
                    <td>
                      <strong>{d.flat_number ? `Flat ${d.flat_number}` : 'N/A'}</strong>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{d.campaign?.title || '—'}</td>
                    <td>
                      <strong style={{ color: d.status === 'Verified' ? '#34d399' : undefined }}>
                        ₹{d.amount.toLocaleString('en-IN')}
                      </strong>
                    </td>
                    <td>{d.payment_method}</td>
                    <td style={{ fontSize: '0.78rem' }}>{d.payment_reference || '—'}</td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CAMPAIGN FORM MODAL */}
      <CampaignFormModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        onSuccess={loadData}
        campaignToEdit={editingCampaign}
      />

      {/* REJECT MODAL */}
      {rejectingDonation && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Reject Donation</h3>
              <button onClick={() => setRejectingDonation(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Reject donation of <strong>₹{rejectingDonation.amount}</strong> from <strong>{rejectingDonation.donor_name}</strong> (Receipt: {rejectingDonation.receipt_number})?
              </p>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                className="admin-search-input"
                style={{ width: '100%' }}
                placeholder="e.g. Transaction reference could not be verified on bank statement..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setRejectingDonation(null)} disabled={actionLoading}>
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
