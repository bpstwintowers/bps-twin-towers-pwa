import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  ArrowLeft,
  User,
  Info,
} from 'lucide-react';
import { HeaderNavbar } from './components/HeaderNavbar';
import { GaneshBottomNav } from './components/GaneshBottomNav';
import { fetchLiveMasterTeams, type LiveMasterTeamGroup } from '../../services/liveSheetService';
import './GaneshVolunteer.css';

interface GaneshVolunteerPageProps {
  embedded?: boolean;
  onBackToHome?: () => void;
}

const DEFAULT_EVENT_TEAMS: LiveMasterTeamGroup[] = [
  {
    name: 'Pooja Team',
    purpose: 'Vedic rituals, priest coordination, samagri sourcing, and daily aarti execution',
    spocs: [
      { name: 'Rajesh Iyer', flatNo: 'A-402', tower: 'Tower A' },
      { name: 'Suresh Narayanan', flatNo: 'B-204', tower: 'Tower B' },
    ],
  },
  {
    name: 'Food & Prasadam',
    purpose: 'Daily satvik prasadam preparation, Annadanam catering, and distribution hygiene',
    spocs: [
      { name: 'Amit Verma', flatNo: 'E-104', tower: 'Tower E' },
      { name: 'Sunita Agarwal', flatNo: 'C-603', tower: 'Tower C' },
    ],
  },
  {
    name: 'Decor & Pandal',
    purpose: 'Pandal theme design, flower canopy, stage lighting, and eco-visarjan tank setup',
    spocs: [
      { name: 'Arun Kulkarni', flatNo: 'B-1101', tower: 'Tower B' },
      { name: 'Neha Kulkarni', flatNo: 'B-1101', tower: 'Tower B' },
    ],
  },
  {
    name: 'Cultural Team',
    purpose: 'Evening stage performances, auditions, audio-visual management, and artist felicitation',
    spocs: [
      { name: 'Ananya Deshmukh', flatNo: 'D-102', tower: 'Tower D' },
      { name: 'Kavita Nair', flatNo: 'C-305', tower: 'Tower C' },
    ],
  },
  {
    name: 'Communication',
    purpose: 'Society broadcasts, digital portal updates, resident queries, and sponsorship receipts',
    spocs: [
      { name: 'Vikram Malhotra', flatNo: 'C-701', tower: 'Tower C' },
      { name: 'Meera Sen', flatNo: 'A-502', tower: 'Tower A' },
    ],
  },
  {
    name: 'Safety & Parking',
    purpose: 'Crowd control, security marshalling, emergency first-aid, and visarjan route security',
    spocs: [
      { name: 'Deepak Patel', flatNo: 'D-802', tower: 'Tower D' },
      { name: 'Harish Rao', flatNo: 'B-501', tower: 'Tower B' },
    ],
  },
];

function getTeamIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('pooja') || lower.includes('ritual')) return '🪔';
  if (lower.includes('food') || lower.includes('prasad')) return '🍲';
  if (lower.includes('decor') || lower.includes('pandal')) return '🌸';
  if (lower.includes('cultural') || lower.includes('stage')) return '🎭';
  if (lower.includes('communication') || lower.includes('broadcast')) return '📢';
  if (lower.includes('safety') || lower.includes('parking') || lower.includes('security')) return '🛡️';
  return '👥';
}

export const GaneshVolunteerPage: React.FC<GaneshVolunteerPageProps> = ({ embedded = false, onBackToHome }) => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<LiveMasterTeamGroup[]>(DEFAULT_EVENT_TEAMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const loadLiveTeams = async () => {
    setIsSyncing(true);
    try {
      const liveTeams = await fetchLiveMasterTeams();
      if (liveTeams && liveTeams.length > 0) {
        setTeams(liveTeams);
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Could not load live Event Teams from Master Portal:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadLiveTeams();
  }, []);

  const totalLeads = useMemo(() => {
    return teams.reduce((acc, t) => acc + t.spocs.length, 0);
  }, [teams]);

  const filteredTeams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return teams;

    return teams
      .map((team) => {
        const teamMatch = team.name.toLowerCase().includes(q) || team.purpose.toLowerCase().includes(q);
        const matchingSpocs = team.spocs.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.flatNo.toLowerCase().includes(q) ||
            s.tower.toLowerCase().includes(q) ||
            (s.phone && s.phone.includes(q))
        );

        if (teamMatch) return team;
        if (matchingSpocs.length > 0) {
          return { ...team, spocs: matchingSpocs };
        }
        return null;
      })
      .filter(Boolean) as LiveMasterTeamGroup[];
  }, [teams, searchQuery]);

  return (
    <div className="volunteer-page-root">
      {/* 1. Top Bar Header (Standalone only) */}
      {!embedded && <HeaderNavbar />}

      {/* Embedded Back Button */}
      {embedded && onBackToHome && (
        <div style={{ padding: '0.25rem 0 0.75rem 0' }}>
          <button
            type="button"
            onClick={onBackToHome}
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.45rem 0.95rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#0f172a',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <ArrowLeft size={16} color="#ea580c" />
            <span>← Back to Festival Home</span>
          </button>
        </div>
      )}

      {/* 2. Main Content Body */}
      <main className="volunteer-body-container" style={{ maxWidth: '580px' }}>
        {/* Page Title & Subtitle with Live Sync Controls */}
        <div className="volunteer-heading-box">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div>
              <h2 className="volunteer-main-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>👥</span>
                <span>Event Teams & SPOC Directory</span>
              </h2>
              {lastSyncTime && (
                <span style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                  Master Portal Live Synced {lastSyncTime}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <button
                type="button"
                onClick={loadLiveTeams}
                disabled={isSyncing}
                title="Sync Live with Google Sheets"
                style={{
                  background: '#fff7ed',
                  border: '1.5px solid #fed7aa',
                  borderRadius: '10px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#ea580c',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
              </button>
              <span
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  background: '#e2e8f0',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '8px',
                }}
              >
                {teams.length} TEAMS • {totalLeads} LEADS
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div
            style={{
              position: 'relative',
              marginTop: '0.75rem',
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Search by team, coordinator name, or flat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.4rem',
                borderRadius: '14px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '0.88rem',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              }}
            />
          </div>
        </div>

        {/* 3. Event Team Cards List */}
        <div className="committee-teams-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredTeams.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                color: '#64748b',
              }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>No teams or coordinators matching "{searchQuery}"</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  marginTop: '0.5rem',
                  background: 'none',
                  border: 'none',
                  color: '#ea580c',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredTeams.map((team, idx) => (
              <div
                key={`${team.name}-${idx}`}
                className="committee-team-card"
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  padding: '1.15rem',
                  overflow: 'hidden',
                }}
              >
                {/* Team Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>{getTeamIcon(team.name)}</span>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {team.name}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.15rem 0 0', lineHeight: 1.4 }}>
                        {team.purpose}
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#1e40af',
                      background: '#dbeafe',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '9999px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {team.spocs.length} Leads
                  </span>
                </div>

                {/* SPOCs Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: team.spocs.length > 1 ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr',
                    gap: '0.65rem',
                    marginTop: '0.85rem',
                  }}
                >
                  {team.spocs.map((spoc, sIdx) => (
                    <div
                      key={`${spoc.name}-${sIdx}`}
                      style={{
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        padding: '0.75rem 0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.45rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.4rem' }}>
                        <div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                            {spoc.name}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, marginTop: '0.1rem' }}>
                            Flat {spoc.flatNo} • {spoc.tower}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: '#9a3412',
                            background: '#fff7ed',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '6px',
                            border: '1px solid #fed7aa',
                          }}
                        >
                          Lead
                        </span>
                      </div>

                      {spoc.phone && (
                        <div style={{ paddingTop: '0.4rem', borderTop: '1px solid #edf2f7' }}>
                          <a
                            href={`tel:${spoc.phone.replace(/\s+/g, '')}`}
                            style={{
                              color: '#0284c7',
                              fontWeight: 700,
                              textDecoration: 'none',
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Phone size={13} />
                            <span>{spoc.phone}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* 4. Floating Bottom Navigation Bar (Standalone only) */}
      {!embedded && <GaneshBottomNav />}
    </div>
  );
};

export default GaneshVolunteerPage;

