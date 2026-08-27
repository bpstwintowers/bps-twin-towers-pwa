import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HandHelping,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  fetchVolunteerTeams,
  fetchPublishedOpportunities,
  fetchUserVolunteerAssignments,
  cancelVolunteerAssignment,
  type VolunteerTeamItem,
  type VolunteerOpportunityItem,
  type VolunteerAssignmentItem,
} from '../../services/supabase/volunteerService';
import { resolveUserAccess, type AccessInfo } from '../../services/supabase/registrationService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { VolunteerSignupModal } from './VolunteerSignupModal';
import './VolunteerList.css';

export const VolunteerList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'opportunities' | 'my-volunteering'>('opportunities');
  const [teams, setTeams] = useState<VolunteerTeamItem[]>([]);
  const [opportunities, setOpportunities] = useState<VolunteerOpportunityItem[]>([]);
  const [myAssignments, setMyAssignments] = useState<VolunteerAssignmentItem[]>([]);
  const [activeAccess, setActiveAccess] = useState<AccessInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTeamId, setSelectedTeamId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [selectedOpportunity, setSelectedOpportunity] = useState<VolunteerOpportunityItem | null>(null);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsData, oppsData, userAssignments, accessData] = await Promise.all([
        fetchVolunteerTeams(),
        fetchPublishedOpportunities(selectedTeamId, searchQuery),
        fetchUserVolunteerAssignments().catch(() => []),
        resolveUserAccess().catch(() => []),
      ]);
      setTeams(teamsData);
      setOpportunities(oppsData);
      setMyAssignments(userAssignments);
      setActiveAccess(accessData);
    } catch (err) {
      console.error('Error loading volunteer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTeamId, searchQuery]);

  const handleOpenSignup = (opp: VolunteerOpportunityItem) => {
    setSelectedOpportunity(opp);
    setIsSignupModalOpen(true);
  };

  const handleCancelAssignment = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to cancel your volunteer registration for this activity?')) {
      return;
    }

    try {
      setCancellingId(assignmentId);
      await cancelVolunteerAssignment(assignmentId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel volunteer shift.');
    } finally {
      setCancellingId(null);
    }
  };

  const primaryFlat = activeAccess[0];
  const activeConfirmedShifts = myAssignments.filter((a) => a.status === 'Confirmed');

  return (
    <div className="volunteers-container">
      {/* Header */}
      <header className="volunteers-header">
        <div className="volunteers-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn-outline"
              onClick={() => navigate('/')}
              style={{ padding: '0.45rem', borderRadius: 'var(--radius-md)' }}
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Volunteers & Teams
              </h1>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                BPS Twin Towers Community Action
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              fontSize: '0.8rem',
              color: '#c4b5fd',
              fontWeight: 600,
            }}
          >
            My Shifts: {activeConfirmedShifts.length}
          </div>
        </div>
      </header>

      <div className="volunteers-content">
        {/* Tab Switcher */}
        <div className="donations-tabs">
          <button
            className={`donations-tab-btn ${activeTab === 'opportunities' ? 'active' : ''}`}
            onClick={() => setActiveTab('opportunities')}
          >
            <HandHelping size={16} />
            Open Opportunities ({opportunities.length})
          </button>
          <button
            className={`donations-tab-btn ${activeTab === 'my-volunteering' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-volunteering')}
          >
            <Users size={16} />
            My Volunteering ({myAssignments.length})
          </button>
        </div>

        {/* TAB 1: OPPORTUNITIES */}
        {activeTab === 'opportunities' && (
          <div>
            {/* Search & Team Filter Pills */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
                <Search
                  size={16}
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
                  placeholder="Search volunteer opportunities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="admin-search-input"
                  style={{ width: '100%', paddingLeft: '2.2rem' }}
                />
              </div>

              {/* Team Pills */}
              <div className="volunteers-pills">
                <button
                  className={`volunteer-pill ${selectedTeamId === 'ALL' ? 'active' : ''}`}
                  onClick={() => setSelectedTeamId('ALL')}
                >
                  All Teams
                </button>
                {teams.map((t) => (
                  <button
                    key={t.id}
                    className={`volunteer-pill ${selectedTeamId === t.id ? 'active' : ''}`}
                    onClick={() => setSelectedTeamId(t.id)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
                Loading volunteer opportunities...
              </div>
            ) : opportunities.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <HandHelping size={42} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.4rem' }}>No Open Opportunities</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  There are currently no active volunteer requests matching your filter.
                </p>
              </div>
            ) : (
              <div className="opportunities-grid animate-fade-in">
                {opportunities.map((opp) => {
                  const confirmed = opp.confirmed_count || 0;
                  const required = opp.required_volunteers;
                  const spotsLeft = Math.max(0, required - confirmed);
                  const isFull = opp.status === 'Full' || spotsLeft === 0;
                  const fillPct = Math.min(100, Math.round((confirmed / required) * 100));

                  return (
                    <div key={opp.id} className="opportunity-card">
                      <div>
                        <div className="opportunity-team-badge">
                          <HandHelping size={13} />
                          {opp.team?.name || 'Community Team'}
                        </div>
                        <h3 className="opportunity-title">{opp.title}</h3>
                        {opp.event && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                            Event: {opp.event.title}
                          </div>
                        )}
                        <div style={{ fontSize: '0.8rem', color: '#c4b5fd', fontWeight: 600 }}>
                          Role: {opp.role_name}
                        </div>
                      </div>

                      <div className="opportunity-meta">
                        <div className="opportunity-meta-row">
                          <Calendar size={14} style={{ color: 'var(--accent-primary)' }} />
                          <span>
                            {new Date(opp.start_date).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                        <div className="opportunity-meta-row">
                          <Clock size={14} style={{ color: 'var(--accent-primary)' }} />
                          <span>{opp.start_time} - {opp.end_time}</span>
                        </div>
                        <div className="opportunity-meta-row">
                          <MapPin size={14} style={{ color: 'var(--accent-primary)' }} />
                          <span>{opp.venue}</span>
                        </div>
                      </div>

                      {/* Capacity Progress */}
                      <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>
                            {confirmed} of {required} Volunteers
                          </span>
                          <span style={{ color: spotsLeft > 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                            {spotsLeft > 0 ? `${spotsLeft} spots open` : 'Full'}
                          </span>
                        </div>

                        <div className="opportunity-capacity-bar">
                          <div className="opportunity-capacity-fill" style={{ width: `${fillPct}%` }} />
                        </div>

                        <button
                          className="btn-primary"
                          onClick={() => handleOpenSignup(opp)}
                          disabled={isFull || opp.is_user_registered}
                          style={{
                            width: '100%',
                            marginTop: '0.75rem',
                            padding: '0.6rem',
                            fontSize: '0.85rem',
                            background: opp.is_user_registered
                              ? 'rgba(16, 185, 129, 0.2)'
                              : isFull
                              ? 'var(--bg-tertiary)'
                              : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            color: opp.is_user_registered ? '#34d399' : undefined,
                            border: opp.is_user_registered ? '1px solid #10b981' : undefined,
                          }}
                        >
                          {opp.is_user_registered ? '✓ You Are Registered' : isFull ? 'Capacity Full' : 'Volunteer for this Shift →'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY VOLUNTEERING */}
        {activeTab === 'my-volunteering' && (
          <div className="animate-fade-in">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
                Loading your volunteer schedule...
              </div>
            ) : myAssignments.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <Users size={42} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.4rem' }}>No Volunteer Shifts Yet</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  You haven't signed up for any volunteer opportunities. Explore the open opportunities tab to get started!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {myAssignments.map((a) => (
                  <div key={a.id} className="donation-receipt-card">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {a.opportunity?.title || 'Volunteer Activity'}
                        </span>
                        <span
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            background: 'rgba(139, 92, 246, 0.15)',
                            color: '#c4b5fd',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                          }}
                        >
                          {a.opportunity?.team?.name || 'Team'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        Role: <strong>{a.opportunity?.role_name}</strong> · Venue: <strong>{a.opportunity?.venue}</strong>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Date:{' '}
                        <strong>
                          {a.opportunity?.start_date
                            ? new Date(a.opportunity.start_date).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })
                            : '—'}{' '}
                          ({a.opportunity?.start_time} - {a.opportunity?.end_time})
                        </strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <StatusBadge status={a.status} />
                        {a.attendance !== 'Pending' && (
                          <span
                            style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              background:
                                a.attendance === 'Attended'
                                  ? 'rgba(16, 185, 129, 0.2)'
                                  : 'rgba(239, 68, 68, 0.2)',
                              color: a.attendance === 'Attended' ? '#34d399' : '#f87171',
                            }}
                          >
                            {a.attendance}
                          </span>
                        )}
                      </div>

                      {a.status === 'Confirmed' && (
                        <button
                          className="btn-outline"
                          onClick={() => handleCancelAssignment(a.id)}
                          disabled={cancellingId === a.id}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.3rem 0.65rem',
                            color: '#f87171',
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                          }}
                        >
                          {cancellingId === a.id ? 'Cancelling...' : 'Cancel Shift'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SIGNUP MODAL */}
      <VolunteerSignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        opportunity={selectedOpportunity}
        flatId={primaryFlat?.flat_id}
        onSuccess={loadData}
      />
    </div>
  );
};
