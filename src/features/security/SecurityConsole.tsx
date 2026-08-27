import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Search,
  UserPlus,
  LogIn,
  LogOut,
  Radio,
  Clock,
  Car,
  Phone,
  Home,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  XCircle,
} from 'lucide-react';
import {
  fetchGateSummary,
  fetchActiveGates,
  fetchExpectedVisitorsToday,
  fetchPendingGateRequests,
  fetchCurrentlyInsideVisits,
  searchSecurityVisitors,
  gateCheckIn,
  gateCheckOut,
  type GateSummary,
  type GateItem,
  type VisitorInvitationItem,
  type VisitItem,
} from '../../services/supabase/visitorService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { WalkinEntryModal } from './WalkinEntryModal';
import './SecurityConsole.css';

export const SecurityConsole: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<GateSummary | null>(null);
  const [gates, setGates] = useState<GateItem[]>([]);
  const [activeGateId, setActiveGateId] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    invitations: VisitorInvitationItem[];
    insideVisits: VisitItem[];
  } | null>(null);

  const [expectedVisitors, setExpectedVisitors] = useState<VisitorInvitationItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<VisitorInvitationItem[]>([]);
  const [insideVisits, setInsideVisits] = useState<VisitItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumData, gateData, expData, pendData, insData] = await Promise.all([
        fetchGateSummary(),
        fetchActiveGates(),
        fetchExpectedVisitorsToday(),
        fetchPendingGateRequests(),
        fetchCurrentlyInsideVisits(),
      ]);

      setSummary(sumData);
      setGates(gateData);
      if (gateData.length > 0 && !activeGateId) {
        setActiveGateId(gateData[0].id);
      }
      setExpectedVisitors(expData);
      setPendingRequests(pendData);
      setInsideVisits(insData);
    } catch (err: any) {
      console.error('Error loading security console:', err);
      setError('Failed to load security gate data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Live search handler
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(() => {
      searchSecurityVisitors(trimmed)
        .then((res) => setSearchResults(res))
        .catch(() => setSearchResults(null));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCheckIn = async (invitationId: string, visitorName?: string) => {
    if (!activeGateId) {
      setError('Please select an active gate.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await gateCheckIn(invitationId, activeGateId);
      setSuccess(`Visitor ${visitorName || ''} checked in successfully!`);
      setSearchQuery('');
      setSearchResults(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async (visitId: string, visitorName?: string) => {
    if (!activeGateId) {
      setError('Please select an active gate.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await gateCheckOut(visitId, activeGateId);
      setSuccess(`Visitor ${visitorName || ''} checked out.`);
      setSearchQuery('');
      setSearchResults(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Check-out failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="security-container">
      {/* Top Header */}
      <header className="security-topbar">
        <div className="security-topbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/')}
              className="btn-outline"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
            >
              <ArrowLeft size={16} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={22} style={{ color: '#3b82f6' }} />
              <div>
                <strong style={{ fontSize: '1.1rem' }}>Gate Security Console</strong>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>BPS Twin Towers</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Gate selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Gate:</span>
              <select
                className="admin-search-input"
                style={{ padding: '0.4rem 0.65rem', background: '#1e293b', color: '#fff', fontSize: '0.82rem' }}
                value={activeGateId}
                onChange={(e) => setActiveGateId(e.target.value)}
              >
                {gates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.code} ({g.name})
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn-outline"
              onClick={loadData}
              title="Refresh"
              style={{ padding: '0.4rem 0.6rem' }}
            >
              <RefreshCw size={15} />
            </button>

            <button
              className="btn-primary"
              onClick={() => setIsWalkinModalOpen(true)}
              style={{ background: '#3b82f6', fontSize: '0.85rem', padding: '0.45rem 0.85rem', gap: '0.35rem' }}
            >
              <UserPlus size={16} />
              Walk-in Entry
            </button>
          </div>
        </div>
      </header>

      <main className="security-main">
        {/* Metric Banner */}
        <div className="security-stat-banner">
          <div className="security-stat-box">
            <span className="security-stat-num" style={{ color: '#10b981' }}>
              {summary?.currently_inside ?? insideVisits.length}
            </span>
            <span className="security-stat-lbl">Currently Inside</span>
          </div>

          <div className="security-stat-box">
            <span className="security-stat-num" style={{ color: '#3b82f6' }}>
              {summary?.expected_today ?? expectedVisitors.length}
            </span>
            <span className="security-stat-lbl">Expected Today</span>
          </div>

          <div className="security-stat-box">
            <span className="security-stat-num" style={{ color: '#f59e0b' }}>
              {summary?.waiting_approval ?? pendingRequests.length}
            </span>
            <span className="security-stat-lbl">Waiting Approval</span>
          </div>

          <div className="security-stat-box">
            <span className="security-stat-num" style={{ color: '#94a3b8' }}>
              {summary?.today_total_entries ?? 0}
            </span>
            <span className="security-stat-lbl">Today's In</span>
          </div>

          <div className="security-stat-box">
            <span className="security-stat-num" style={{ color: '#94a3b8' }}>
              {summary?.today_total_exits ?? 0}
            </span>
            <span className="security-stat-lbl">Today's Out</span>
          </div>
        </div>

        {/* Global Fast Search Bar */}
        <div className="security-search-container">
          <Search size={22} style={{ color: '#3b82f6', flexShrink: 0 }} />
          <input
            type="text"
            className="security-search-input"
            placeholder="Search Pass Code (e.g. BPS-8921), Name, Phone, Vehicle, Flat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <XCircle size={18} />
            </button>
          )}
        </div>

        {success && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: 'var(--radius-lg)',
              color: '#34d399',
              marginBottom: '1.25rem',
              fontWeight: 600,
            }}
          >
            {success}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: 'var(--radius-lg)',
              color: '#f87171',
              marginBottom: '1.25rem',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {/* Search Results Display */}
        {searchResults && (
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#60a5fa', marginBottom: '0.75rem' }}>
              Search Results ({searchResults.invitations.length + searchResults.insideVisits.length} matches)
            </h3>

            {searchResults.invitations.length === 0 && searchResults.insideVisits.length === 0 ? (
              <div style={{ padding: '1.5rem', background: '#1e293b', borderRadius: 'var(--radius-xl)', textAlign: 'center', color: '#94a3b8' }}>
                No active passes or inside visitors match "{searchQuery}".
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Search In-Progress / Pre-approved */}
                {searchResults.invitations.map((inv) => (
                  <div key={inv.id} className="security-card" style={{ borderLeft: '5px solid #3b82f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '1.15rem' }}>{inv.visitor?.name}</strong>
                          <span className="visitor-pass-badge" style={{ fontSize: '0.85rem' }}>
                            {inv.pass_code}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            ({inv.visitor?.visitor_type})
                          </span>
                        </div>

                        <div style={{ fontSize: '0.88rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                          Destination: <strong style={{ color: '#60a5fa' }}>Flat {inv.flat?.flat_number} ({inv.flat?.block?.name})</strong> · Phone: {inv.visitor?.phone} {inv.visitor?.vehicle_number ? `· Vehicle: ${inv.visitor.vehicle_number}` : ''}
                        </div>
                      </div>

                      {inv.status === 'Approved' ? (
                        <button
                          className="btn-checkin"
                          onClick={() => handleCheckIn(inv.id, inv.visitor?.name)}
                          disabled={actionLoading}
                        >
                          <LogIn size={18} /> CHECK IN
                        </button>
                      ) : (
                        <span className="badge-pending">WAITING APPROVAL</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Search Inside */}
                {searchResults.insideVisits.map((vis) => (
                  <div key={vis.id} className="security-card" style={{ borderLeft: '5px solid #10b981' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <strong style={{ fontSize: '1.15rem' }}>{vis.visitor?.name}</strong>
                        <span style={{ marginLeft: '0.4rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                          ({vis.visitor?.visitor_type})
                        </span>
                        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                          Flat {vis.flat?.flat_number} · In: {new Date(vis.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({vis.entry_gate?.code})
                        </div>
                      </div>

                      <button
                        className="btn-checkout"
                        onClick={() => handleCheckOut(vis.id, vis.visitor?.name)}
                        disabled={actionLoading}
                      >
                        <LogOut size={16} /> CHECK OUT
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DEFAULT GATE VIEWS (When not actively searching) */}
        {!searchResults && (
          <div>
            {/* WAITING APPROVAL BANNER */}
            {pendingRequests.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={16} /> Waiting Resident Approval ({pendingRequests.length})
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {pendingRequests.map((p) => (
                    <div key={p.id} className="security-card" style={{ borderLeft: '5px solid #f59e0b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <strong>{p.visitor?.name}</strong>
                          <span style={{ marginLeft: '0.4rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                            ({p.visitor?.visitor_type} {p.visitor?.company ? `· ${p.visitor.company}` : ''})
                          </span>
                          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                            Flat {p.flat?.flat_number} · Phone: {p.visitor?.phone} · Requested {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        <span className="badge-pending">WAITING</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CURRENTLY INSIDE */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <h3 style={{ fontSize: '0.95rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Radio size={16} /> Currently Inside Society ({insideVisits.length})
                </h3>
              </div>

              {insideVisits.length === 0 ? (
                <div style={{ padding: '1.75rem', background: '#1e293b', borderRadius: 'var(--radius-xl)', textAlign: 'center', color: '#94a3b8' }}>
                  No visitors currently inside society.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {insideVisits.map((vis) => (
                    <div key={vis.id} className="security-card" style={{ borderLeft: '5px solid #10b981' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <strong style={{ fontSize: '1.05rem' }}>{vis.visitor?.name}</strong>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                              ({vis.visitor?.visitor_type} {vis.visitor?.company ? `· ${vis.visitor.company}` : ''})
                            </span>
                          </div>

                          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                            Flat {vis.flat?.flat_number} · In: {new Date(vis.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({vis.entry_gate?.code}) {vis.visitor?.vehicle_number ? `· Veh: ${vis.visitor.vehicle_number}` : ''}
                          </div>
                        </div>

                        <button
                          className="btn-checkout"
                          onClick={() => handleCheckOut(vis.id, vis.visitor?.name)}
                          disabled={actionLoading}
                        >
                          <LogOut size={16} /> CHECK OUT
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* EXPECTED TODAY */}
            <div>
              <h3 style={{ fontSize: '0.95rem', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
                Pre-Approved Passes for Today ({expectedVisitors.length})
              </h3>

              {expectedVisitors.length === 0 ? (
                <div style={{ padding: '1.75rem', background: '#1e293b', borderRadius: 'var(--radius-xl)', textAlign: 'center', color: '#94a3b8' }}>
                  No pre-approved passes scheduled for today.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {expectedVisitors.map((exp) => (
                    <div key={exp.id} className="security-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <strong style={{ fontSize: '1.05rem' }}>{exp.visitor?.name}</strong>
                            <span className="visitor-pass-badge" style={{ fontSize: '0.82rem' }}>
                              {exp.pass_code}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                            Destination: Flat {exp.flat?.flat_number} · {exp.visitor?.visitor_type} · Phone: {exp.visitor?.phone}
                          </div>
                        </div>

                        <button
                          className="btn-checkin"
                          onClick={() => handleCheckIn(exp.id, exp.visitor?.name)}
                          disabled={actionLoading}
                        >
                          <LogIn size={16} /> CHECK IN
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* WALKIN MODAL */}
      <WalkinEntryModal
        isOpen={isWalkinModalOpen}
        onClose={() => setIsWalkinModalOpen(false)}
        onSuccess={loadData}
        gates={gates}
        defaultGateId={activeGateId}
      />
    </div>
  );
};
