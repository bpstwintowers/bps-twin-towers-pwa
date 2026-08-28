import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Users,
  Edit,
  ExternalLink,
} from 'lucide-react';
import {
  fetchAdminComplaints,
  fetchFacilityAndComplaintSummary,
  type ComplaintItem,
  type FacilityAndComplaintSummary,
} from '../../services/supabase/complaintService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ComplaintAssignModal } from './ComplaintAssignModal';

export const AdminComplaints: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [summary, setSummary] = useState<FacilityAndComplaintSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('OPEN_GROUP');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumData, compData] = await Promise.all([
        fetchFacilityAndComplaintSummary(),
        fetchAdminComplaints(statusFilter, priorityFilter, categoryFilter),
      ]);

      setSummary(sumData);
      setComplaints(compData);
    } catch (err: any) {
      console.error('Error loading admin complaints:', err);
      setError('Failed to load complaints console.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter, categoryFilter]);

  const filtered = complaints.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.complaint_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.flat?.flat_number && c.flat.flat_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="admin-subpage-layout">
      {/* Fixed Top Section: Complaints Metric Cards & Filters (Does Not Scroll) */}
      <div className="admin-subpage-top">
        {/* Metric Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: 'var(--accent-primary)' }}>
              {summary?.open_complaints ?? 0}
            </span>
            <span className="stat-label">Total Open Tickets</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: '#ef4444' }}>
              {summary?.urgent_complaints ?? 0}
            </span>
            <span className="stat-label">Urgent / Emergency</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: '#f59e0b' }}>
              {summary?.overdue_complaints ?? 0}
            </span>
            <span className="stat-label">Overdue SLA</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: '#10b981' }}>
              {summary?.resolved_today ?? 0}
            </span>
            <span className="stat-label">Resolved Today</span>
          </div>
        </div>

        {/* Filters Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Open & Active', value: 'OPEN_GROUP' },
              { label: 'All Tickets', value: 'ALL' },
              { label: 'Resolved', value: 'Resolved' },
              { label: 'Closed', value: 'Closed' },
            ].map((st) => (
              <button
                key={st.value}
                className={`admin-tab ${statusFilter === st.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(st.value)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              className="admin-search-input"
              style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <div style={{ position: 'relative', width: '200px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                className="admin-search-input"
                style={{ width: '100%', paddingLeft: '2rem', fontSize: '0.8rem' }}
                placeholder="Search #, title, flat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
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

      {/* Complaints List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          Loading complaints queue...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '2.5rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
          No complaints found matching this filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((c) => {
            const isOverdue = new Date(c.due_at) < new Date() && !['Resolved', 'Closed', 'Cancelled', 'Rejected'].includes(c.status);

            return (
              <div
                key={c.id}
                className="admin-request-card"
                style={{
                  borderLeft: c.priority === 'Urgent'
                    ? '4px solid #ef4444'
                    : isOverdue
                    ? '4px solid #f59e0b'
                    : '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span className="complaint-ticket-badge">{c.complaint_number}</span>
                      <strong style={{ fontSize: '1.05rem' }}>{c.title}</strong>
                      {c.priority === 'Urgent' && (
                        <span className="badge-urgent">URGENT</span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Category: <strong>{c.category}</strong> · Location: <strong>{c.location_type} {c.flat?.flat_number ? `(Flat ${c.flat.flat_number})` : ''}</strong> · Reporter: {c.creator?.full_name || 'Resident'}
                    </div>
                  </div>

                  <StatusBadge status={c.status} />
                </div>

                <div style={{ margin: '0.4rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {c.description}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    Assigned: <strong style={{ color: 'var(--text-primary)' }}>{c.assigned_team || 'Unassigned'}</strong> · Due: <span style={{ color: isOverdue ? '#f87171' : 'inherit' }}>{new Date(c.due_at).toLocaleDateString()} {new Date(c.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {isOverdue && '⚠️ OVERDUE'}</span>
                  </div>

                  <button
                    className="btn-outline"
                    onClick={() => {
                      setSelectedComplaint(c);
                      setIsModalOpen(true);
                    }}
                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', gap: '0.3rem' }}
                  >
                    <Edit size={13} /> Manage Ticket
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* MANAGE / ASSIGN MODAL */}
      <ComplaintAssignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        complaint={selectedComplaint}
      />
    </div>
  );
};
