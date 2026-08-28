import React, { useState, useEffect } from 'react';
import {
  HandHelping,
  Users,
  PlusCircle,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Edit,
  X,
  UserCheck,
} from 'lucide-react';
import {
  fetchVolunteerSummary,
  fetchVolunteerTeams,
  fetchAdminOpportunities,
  createAdminTeam,
  updateAdminTeam,
  closeAdminOpportunity,
  cancelAdminOpportunity,
  fetchOpportunityAssignments,
  markVolunteerAttendance,
  type VolunteerSummary,
  type VolunteerTeamItem,
  type VolunteerOpportunityItem,
  type VolunteerAssignmentItem,
  type AttendanceStatus,
} from '../../services/supabase/volunteerService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { OpportunityFormModal } from './OpportunityFormModal';
import { supabase } from '../../services/supabase/client';

type VolunteerSubTab = 'opportunities' | 'teams' | 'attendance';

export const AdminVolunteers: React.FC = () => {
  const [subTab, setSubTab] = useState<VolunteerSubTab>('opportunities');
  const [summary, setSummary] = useState<VolunteerSummary | null>(null);
  const [teams, setTeams] = useState<VolunteerTeamItem[]>([]);
  const [opportunities, setOpportunities] = useState<VolunteerOpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Opportunities Modal
  const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<VolunteerOpportunityItem | null>(null);

  // Team Create/Edit Modal
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<VolunteerTeamItem | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamCategory, setTeamCategory] = useState<any>('General');
  const [teamCoordinatorId, setTeamCoordinatorId] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);

  // Roster / Attendance View
  const [selectedOppForRoster, setSelectedOppForRoster] = useState<VolunteerOpportunityItem | null>(null);
  const [rosterAssignments, setRosterAssignments] = useState<VolunteerAssignmentItem[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumData, teamsData, oppsData, profilesRes] = await Promise.all([
        fetchVolunteerSummary(),
        fetchVolunteerTeams(),
        fetchAdminOpportunities(teamFilter, statusFilter, search),
        supabase.from('profiles').select('id, full_name, email').order('full_name'),
      ]);
      setSummary(sumData);
      setTeams(teamsData);
      setOpportunities(oppsData);
      setProfiles(profilesRes.data || []);
    } catch (err: any) {
      console.error('Error loading volunteer admin data:', err);
      setError('Failed to load volunteer records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teamFilter, statusFilter]);

  const handleOpenRoster = async (opp: VolunteerOpportunityItem) => {
    try {
      setSelectedOppForRoster(opp);
      setRosterLoading(true);
      const data = await fetchOpportunityAssignments(opp.id);
      setRosterAssignments(data);
    } catch (err: any) {
      console.error('Error loading roster:', err);
    } finally {
      setRosterLoading(false);
    }
  };

  const handleMarkAttendance = async (assignmentId: string, att: AttendanceStatus) => {
    try {
      setActionLoading(true);
      await markVolunteerAttendance(assignmentId, att);
      if (selectedOppForRoster) {
        const updated = await fetchOpportunityAssignments(selectedOppForRoster.id);
        setRosterAssignments(updated);
      }
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update attendance.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setError('Team name is required.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      if (editingTeam) {
        await updateAdminTeam(editingTeam.id, {
          name: teamName,
          description: teamDesc,
          category: teamCategory,
          coordinator_id: teamCoordinatorId || undefined,
        });
        setSuccess('Volunteer team updated successfully.');
      } else {
        await createAdminTeam({
          name: teamName,
          description: teamDesc,
          category: teamCategory,
          coordinator_id: teamCoordinatorId || undefined,
        });
        setSuccess('New volunteer team created.');
      }
      setIsTeamModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save volunteer team.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseOpportunity = async (oppId: string) => {
    try {
      setActionLoading(true);
      await closeAdminOpportunity(oppId);
      setSuccess('Opportunity closed for new sign-ups.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to close opportunity.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-subpage-layout">
      {/* Fixed Top Section: Volunteer Summary Cards & Sub-tabs (Does Not Scroll) */}
      <div className="admin-subpage-top">
        {/* Volunteer Summary Stat Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: '#c4b5fd' }}>
              {summary?.total_teams ?? 0}
            </span>
            <span className="stat-label">Volunteer Teams</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: 'var(--accent-primary)' }}>
              {summary?.active_opportunities ?? 0}
            </span>
            <span className="stat-label">Active Opportunities</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: '#34d399' }}>
              {summary?.total_confirmed_volunteers ?? 0}
            </span>
            <span className="stat-label">Confirmed Volunteers</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-value" style={{ color: '#fbbf24' }}>
              {summary?.today_shifts ?? 0}
            </span>
            <span className="stat-label">Today's Active Shifts</span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`admin-tab ${subTab === 'opportunities' ? 'active' : ''}`}
              onClick={() => setSubTab('opportunities')}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              <Calendar size={15} />
              Opportunities ({opportunities.length})
            </button>

            <button
              className={`admin-tab ${subTab === 'teams' ? 'active' : ''}`}
              onClick={() => setSubTab('teams')}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              <Users size={15} />
              Teams ({teams.length})
            </button>
          </div>

          {subTab === 'opportunities' && (
            <button
              className="btn-primary"
              onClick={() => {
                setEditingOpportunity(null);
                setIsOpportunityModalOpen(true);
              }}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', gap: '0.35rem', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
            >
              <PlusCircle size={15} />
              New Opportunity
            </button>
          )}

          {subTab === 'teams' && (
            <button
              className="btn-primary"
              onClick={() => {
                setEditingTeam(null);
                setTeamName('');
                setTeamDesc('');
                setTeamCategory('General');
              setTeamCoordinatorId('');
              setIsTeamModalOpen(true);
            }}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', gap: '0.35rem', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
          >
            <PlusCircle size={15} />
            New Team
          </button>
        )}
        </div>
      </div>

      {/* Scrollable Content (Only this scrolls!) */}
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

        {/* SUB-TAB 1: OPPORTUNITIES */}
        {subTab === 'opportunities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {opportunities.map((opp) => {
            const confirmed = opp.confirmed_count || 0;
            const required = opp.required_volunteers;

            return (
              <div key={opp.id} className="admin-request-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#c4b5fd',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        marginRight: '0.5rem',
                      }}
                    >
                      {opp.team?.name || 'Team'}
                    </span>
                    <strong style={{ fontSize: '1.05rem' }}>{opp.title}</strong>
                  </div>
                  <StatusBadge status={opp.status} />
                </div>

                <div className="admin-request-body">
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Role:</span>{' '}
                    <strong>{opp.role_name}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Volunteers:</span>{' '}
                    <strong>{confirmed} / {required} Confirmed</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>{' '}
                    <strong>
                      {new Date(opp.start_date).toLocaleDateString()} ({opp.start_time} - {opp.end_time})
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Venue:</span>{' '}
                    <strong>{opp.venue}</strong>
                  </div>
                </div>

                <div className="admin-request-actions">
                  <button
                    className="btn-outline"
                    onClick={() => handleOpenRoster(opp)}
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem', gap: '0.35rem', color: '#c4b5fd' }}
                  >
                    <UserCheck size={14} />
                    View Roster ({confirmed})
                  </button>

                  <button
                    className="btn-outline"
                    onClick={() => {
                      setEditingOpportunity(opp);
                      setIsOpportunityModalOpen(true);
                    }}
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem', gap: '0.35rem' }}
                  >
                    <Edit size={14} />
                    Edit
                  </button>

                  {opp.status === 'Open' && (
                    <button
                      className="btn-outline"
                      onClick={() => handleCloseOpportunity(opp.id)}
                      disabled={actionLoading}
                      style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                    >
                      Close Sign-ups
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 2: TEAMS MANAGER */}
      {subTab === 'teams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {teams.map((t) => (
            <div key={t.id} className="admin-request-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                  <span
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      background: 'rgba(139, 92, 246, 0.15)',
                      color: '#c4b5fd',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      marginRight: '0.5rem',
                    }}
                  >
                    {t.category}
                  </span>
                  <strong style={{ fontSize: '1.05rem' }}>{t.name}</strong>
                </div>
                <StatusBadge status={t.status} />
              </div>

              {t.description && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                  {t.description}
                </div>
              )}

              <div className="admin-request-body">
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Coordinator:</span>{' '}
                  <strong>{t.coordinator?.full_name || 'None Assigned'}</strong>
                  {t.coordinator?.mobile && (
                    <span style={{ color: 'var(--text-muted)' }}> ({t.coordinator.mobile})</span>
                  )}
                </div>
              </div>

              <div className="admin-request-actions">
                <button
                  className="btn-outline"
                  onClick={() => {
                    setEditingTeam(t);
                    setTeamName(t.name);
                    setTeamDesc(t.description || '');
                    setTeamCategory(t.category);
                    setTeamCoordinatorId(t.coordinator_id || '');
                    setIsTeamModalOpen(true);
                  }}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem', gap: '0.35rem' }}
                >
                  <Edit size={14} />
                  Edit Team & Coordinator
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* OPPORTUNITY MODAL */}
      <OpportunityFormModal
        isOpen={isOpportunityModalOpen}
        onClose={() => setIsOpportunityModalOpen(false)}
        onSuccess={loadData}
        teams={teams}
        opportunityToEdit={editingOpportunity}
      />

      {/* TEAM CREATE/EDIT MODAL */}
      {isTeamModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                {editingTeam ? 'Edit Volunteer Team' : 'Create Volunteer Team'}
              </h3>
              <button onClick={() => setIsTeamModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTeam}>
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Team Name *
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Decoration Team / Food Distribution"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                    Category *
                  </label>
                  <select
                    className="admin-search-input"
                    style={{ width: '100%', padding: '0.55rem' }}
                    value={teamCategory}
                    onChange={(e) => setTeamCategory(e.target.value)}
                  >
                    <option value="Festival">Festival</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Security">Security</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Medical">Medical</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                    Lead Coordinator
                  </label>
                  <select
                    className="admin-search-input"
                    style={{ width: '100%', padding: '0.55rem' }}
                    value={teamCoordinatorId}
                    onChange={(e) => setTeamCoordinatorId(e.target.value)}
                  >
                    <option value="">-- Select Member --</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Description & Scope
                </label>
                <textarea
                  rows={3}
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  placeholder="Briefly describe what this volunteer team coordinates..."
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsTeamModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading} style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                  {actionLoading ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROSTER & ATTENDANCE MODAL */}
      {selectedOppForRoster && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                  Volunteer Roster: {selectedOppForRoster.title}
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {selectedOppForRoster.team?.name} · {selectedOppForRoster.venue} · {selectedOppForRoster.start_time} - {selectedOppForRoster.end_time}
                </p>
              </div>
              <button onClick={() => setSelectedOppForRoster(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {rosterLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading volunteer roster...
                </div>
              ) : rosterAssignments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No volunteers have registered for this shift yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {rosterAssignments.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.75rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{a.volunteer_name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Flat: {a.flat_number ? `Flat ${a.flat_number}` : 'N/A'}{' '}
                          {a.volunteer_mobile && `· Mobile: ${a.volunteer_mobile}`}
                        </div>
                        {a.notes && (
                          <div style={{ fontSize: '0.75rem', color: '#c4b5fd', marginTop: '0.2rem' }}>
                            <em>"{a.notes}"</em>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          className="btn-outline"
                          onClick={() => handleMarkAttendance(a.id, 'Attended')}
                          disabled={actionLoading}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.35rem 0.65rem',
                            background: a.attendance === 'Attended' ? 'rgba(16, 185, 129, 0.2)' : undefined,
                            borderColor: a.attendance === 'Attended' ? '#10b981' : undefined,
                            color: a.attendance === 'Attended' ? '#34d399' : undefined,
                          }}
                        >
                          ✓ Attended
                        </button>
                        <button
                          className="btn-outline"
                          onClick={() => handleMarkAttendance(a.id, 'No Show')}
                          disabled={actionLoading}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.35rem 0.65rem',
                            background: a.attendance === 'No Show' ? 'rgba(239, 68, 68, 0.2)' : undefined,
                            borderColor: a.attendance === 'No Show' ? '#ef4444' : undefined,
                            color: a.attendance === 'No Show' ? '#f87171' : undefined,
                          }}
                        >
                          ✕ No Show
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setSelectedOppForRoster(null)} style={{ width: '100%' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
