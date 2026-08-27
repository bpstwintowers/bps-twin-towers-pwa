import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Search,
  MessageSquare,
} from 'lucide-react';
import {
  fetchResidentComplaints,
  type ComplaintItem,
} from '../../services/supabase/complaintService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import './ComplaintList.css';

export const ComplaintList: React.FC = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'open' | 'resolved'>('open');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchResidentComplaints(activeTab);
      setComplaints(data);
    } catch (err) {
      console.error('Error loading complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const filtered = complaints.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.complaint_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="complaints-container">
      <header className="complaints-header">
        <div className="complaints-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/')}
              className="btn-outline"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Wrench size={18} style={{ color: '#f59e0b' }} />
                Helpdesk & Maintenance
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                BPS Twin Towers Support Tickets
              </div>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={() => navigate('/complaints/new')}
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', gap: '0.35rem' }}
          >
            <Plus size={15} />
            Log Complaint
          </button>
        </div>
      </header>

      <main className="complaints-content animate-fade-in">
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`admin-tab ${activeTab === 'open' ? 'active' : ''}`}
              onClick={() => setActiveTab('open')}
            >
              Open & In Progress
            </button>
            <button
              className={`admin-tab ${activeTab === 'resolved' ? 'active' : ''}`}
              onClick={() => setActiveTab('resolved')}
            >
              Resolved & Closed
            </button>
          </div>

          <div style={{ position: 'relative', width: '220px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="admin-search-input"
              style={{ width: '100%', paddingLeft: '2.2rem', fontSize: '0.82rem' }}
              placeholder="Search ticket # or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Complaints List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Loading your support tickets...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={32} style={{ color: '#34d399', margin: '0 auto 0.5rem', display: 'block' }} />
            <p style={{ margin: '0 0 1rem', fontSize: '0.92rem' }}>
              {activeTab === 'open' ? 'No open complaints reported.' : 'No resolved complaints found.'}
            </p>
            {activeTab === 'open' && (
              <button className="btn-primary" onClick={() => navigate('/complaints/new')}>
                Log a Complaint
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filtered.map((c) => {
              const isOverdue = new Date(c.due_at) < new Date() && !['Resolved', 'Closed', 'Cancelled', 'Rejected'].includes(c.status);

              return (
                <div
                  key={c.id}
                  className="admin-request-card"
                  onClick={() => navigate(`/complaints/${c.id}`)}
                  style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span className="complaint-ticket-badge">{c.complaint_number}</span>
                        <strong style={{ fontSize: '1.05rem' }}>{c.title}</strong>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Category: <strong>{c.category}</strong> · Location: <strong>{c.location_type} {c.flat?.flat_number ? `(Flat ${c.flat.flat_number})` : ''}</strong>
                      </div>
                    </div>

                    <StatusBadge status={c.status} />
                  </div>

                  <div style={{ margin: '0.4rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {c.description.length > 120 ? `${c.description.substring(0, 120)}...` : c.description}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>
                      Assigned: <strong>{c.assigned_team || 'Pending'}</strong>
                    </span>

                    <span style={{ color: isOverdue ? '#f87171' : 'var(--text-muted)' }}>
                      Target Due: {new Date(c.due_at).toLocaleDateString()} {new Date(c.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {isOverdue && '⚠️ OVERDUE'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
