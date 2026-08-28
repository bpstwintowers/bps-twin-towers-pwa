import React, { useState, useEffect } from 'react';
import {
  Shield,
  Radio,
  PlusCircle,
  Clock,
  Car,
  Phone,
  Home,
  CheckCircle2,
  AlertTriangle,
  Edit,
  ExternalLink,
} from 'lucide-react';
import {
  fetchGateSummary,
  fetchAdminGates,
  fetchCurrentlyInsideVisits,
  fetchAdminVisits,
  type GateSummary,
  type GateItem,
  type VisitItem,
} from '../../services/supabase/visitorService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { GateFormModal } from './GateFormModal';

export const AdminVisitors: React.FC = () => {
  const [summary, setSummary] = useState<GateSummary | null>(null);
  const [gates, setGates] = useState<GateItem[]>([]);
  const [insideVisits, setInsideVisits] = useState<VisitItem[]>([]);
  const [visitsLedger, setVisitsLedger] = useState<VisitItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeSubTab, setActiveSubTab] = useState<'inside' | 'ledger' | 'gates'>('inside');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isGateModalOpen, setIsGateModalOpen] = useState(false);
  const [editingGate, setEditingGate] = useState<GateItem | null>(null);

  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumData, gateData, insData, ledgerData] = await Promise.all([
        fetchGateSummary(),
        fetchAdminGates(),
        fetchCurrentlyInsideVisits(),
        fetchAdminVisits(statusFilter),
      ]);

      setSummary(sumData);
      setGates(gateData);
      setInsideVisits(insData);
      setVisitsLedger(ledgerData);
    } catch (err: any) {
      console.error('Error loading admin visitor data:', err);
      setError('Failed to load visitor and gate records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  return (
    <div className="admin-subpage-layout">
      {/* Fixed Top Section: Visitors Metric Cards & Sub-tabs (Does Not Scroll) */}
      <div className="admin-subpage-top">
        {/* Metric Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: '#10b981' }}>
              {summary?.currently_inside ?? insideVisits.length}
            </span>
            <span className="stat-label">Currently Inside Society</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: 'var(--accent-primary)' }}>
              {summary?.expected_today ?? 0}
            </span>
            <span className="stat-label">Expected Passes Today</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: '#fbbf24' }}>
              {summary?.waiting_approval ?? 0}
            </span>
            <span className="stat-label">Pending Gate Approvals</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: '#94a3b8' }}>
              {summary?.today_total_entries ?? 0} In / {summary?.today_total_exits ?? 0} Out
            </span>
            <span className="stat-label">Today's Gate Movement</span>
          </div>
        </div>

        {/* Sub Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`admin-tab ${activeSubTab === 'inside' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('inside')}
            >
              Emergency Occupancy ({insideVisits.length})
            </button>
            <button
              className={`admin-tab ${activeSubTab === 'ledger' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('ledger')}
            >
              Visits Ledger
            </button>
            <button
              className={`admin-tab ${activeSubTab === 'gates' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('gates')}
            >
              Gate Infrastructure ({gates.length})
            </button>
          </div>

          {activeSubTab === 'gates' && (
            <button
              className="btn-primary"
              onClick={() => {
                setEditingGate(null);
                setIsGateModalOpen(true);
              }}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', gap: '0.35rem' }}
            >
              <PlusCircle size={15} />
              Add Gate
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content (Only this scrolls!) */}
      <div className="admin-subpage-scrollable">
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
          Loading visitor and gate records...
        </div>
      ) : activeSubTab === 'inside' ? (
        /* EMERGENCY OCCUPANCY MANIFEST */
        <div>
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#34d399' }}>
            <Radio size={16} />
            <strong>Live Emergency Occupancy Manifest:</strong> Real-time record of all non-resident visitors, delivery agents, and technicians currently on society premises.
          </div>

          {insideVisits.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              No visitors currently inside society.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {insideVisits.map((vis) => (
                <div key={vis.id} className="admin-request-card" style={{ borderLeft: '4px solid #10b981' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <strong style={{ fontSize: '1.05rem' }}>{vis.visitor?.name}</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          ({vis.visitor?.visitor_type} {vis.visitor?.company ? `· ${vis.visitor.company}` : ''})
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Host Flat: <strong style={{ color: 'var(--accent-primary)' }}>Flat {vis.flat?.flat_number} ({vis.flat?.block?.name})</strong> · Phone: {vis.visitor?.phone} {vis.visitor?.vehicle_number ? `· Vehicle: ${vis.visitor.vehicle_number}` : ''}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        Entered: {new Date(vis.entry_time).toLocaleDateString()} at {new Date(vis.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} via {vis.entry_gate?.name} ({vis.entry_gate?.code})
                      </div>
                    </div>

                    <span className="badge-approved">INSIDE SOCIETY</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeSubTab === 'gates' ? (
        /* GATES INFRASTRUCTURE */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {gates.map((g) => (
            <div key={g.id} className="admin-request-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <span className="visitor-pass-badge" style={{ fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    {g.code}
                  </span>
                  <strong style={{ display: 'block', fontSize: '1.05rem' }}>{g.name}</strong>
                </div>

                <StatusBadge status={g.status} />
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Type: <strong>{g.gate_type}</strong>
                {g.location && <div>Location: {g.location}</div>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.5rem' }}>
                <button
                  className="btn-outline"
                  onClick={() => {
                    setEditingGate(g);
                    setIsGateModalOpen(true);
                  }}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', gap: '0.25rem' }}
                >
                  <Edit size={13} /> Edit Gate
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VISITS LEDGER */
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {['ALL', 'Inside', 'Completed'].map((st) => (
              <button
                key={st}
                className={`admin-tab ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                {st}
              </button>
            ))}
          </div>

          {visitsLedger.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              No visit records found for this filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {visitsLedger.map((v) => (
                <div key={v.id} className="admin-request-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <strong style={{ fontSize: '0.98rem' }}>{v.visitor?.name}</strong>
                      <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ({v.visitor?.visitor_type} {v.visitor?.company ? `· ${v.visitor.company}` : ''})
                      </span>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Flat {v.flat?.flat_number} ({v.flat?.block?.name}) · Phone: {v.visitor?.phone}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        In: {new Date(v.entry_time).toLocaleString()} ({v.entry_gate?.code}) · Out: {v.exit_time ? `${new Date(v.exit_time).toLocaleTimeString()} (${v.exit_gate?.code || 'Gate'})` : 'Inside'}
                      </div>
                    </div>

                    <StatusBadge status={v.status === 'Completed' ? 'Approved' : v.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>

      {/* GATE MODAL */}
      <GateFormModal
        isOpen={isGateModalOpen}
        onClose={() => setIsGateModalOpen(false)}
        onSuccess={loadData}
        gateToEdit={editingGate}
      />
    </div>
  );
};
