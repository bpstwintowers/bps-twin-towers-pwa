import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Sparkles,
  Flame,
  HeartHandshake,
  Users,
  Building2,
  Award,
  Phone,
  MessageCircle,
  Search,
  CheckCircle2,
  ChevronRight,
  Share2,
  Printer,
  ExternalLink,
  Shirt,
  Utensils,
  PartyPopper,
  Check,
} from 'lucide-react';
import {
  POOJA_SCHEDULE_DAYS,
  COMMITTEE_TEAMS,
  type PoojaDaySchedule,
  type CommitteeTeam,
} from './poojaScheduleData';
import { getFestivalDayMeta } from '../../services/liveSheetService';
import { GaneshBottomNav } from './components/GaneshBottomNav';
import { HeaderNavbar } from './components/HeaderNavbar';
import './PoojaSchedule.css';

export const PoojaSchedulePage: React.FC = () => {
  const navigate = useNavigate();

  // Active view tabs: 'schedule' (14th - 19th Sep) vs 'teams' (Teams & SPOCs)
  const [activeMainTab, setActiveMainTab] = useState<'schedule' | 'teams'>('schedule');

  // Active Selected Day (1 to 6) - dynamically defaults to Today's date (e.g. Day 2 on 15th Sep)
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(() => getFestivalDayMeta(new Date()).dayNumber);

  // Teams & SPOC Filters
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
  const [spocSearchQuery, setSpocSearchQuery] = useState<string>('');

  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const activeDay: PoojaDaySchedule =
    POOJA_SCHEDULE_DAYS.find((d) => d.dayNumber === selectedDayNumber) || POOJA_SCHEDULE_DAYS[0];

  // Filtered SPOCs / Teams
  const filteredTeams = useMemo(() => {
    return COMMITTEE_TEAMS.map((team) => {
      // Filter by team category if selected
      if (selectedTeamFilter !== 'ALL' && team.id !== selectedTeamFilter) {
        return null;
      }

      // Filter spocs by search query
      const query = spocSearchQuery.toLowerCase().trim();
      const filteredSpocs = team.spocs.filter((spoc) => {
        if (!query) return true;
        return (
          spoc.name.toLowerCase().includes(query) ||
          spoc.flatNo.toLowerCase().includes(query) ||
          spoc.role.toLowerCase().includes(query) ||
          spoc.tower.toLowerCase().includes(query) ||
          spoc.responsibilities.some((r) => r.toLowerCase().includes(query))
        );
      });

      if (filteredSpocs.length === 0) return null;

      return {
        ...team,
        spocs: filteredSpocs,
      };
    }).filter(Boolean) as CommitteeTeam[];
  }, [selectedTeamFilter, spocSearchQuery]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderTeamIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame size={20} color="#ea580c" />;
      case 'HeartHandshake':
        return <HeartHandshake size={20} color="#16a34a" />;
      case 'Sparkles':
        return <Sparkles size={20} color="#0284c7" />;
      case 'Building2':
        return <Building2 size={20} color="#d97706" />;
      case 'Award':
        return <Award size={20} color="#7c3aed" />;
      case 'Users':
        return <Users size={20} color="#dc2626" />;
      default:
        return <Users size={20} color="#b45309" />;
    }
  };

  return (
    <div className="pooja-page-root">
      {/* Top Header Navbar */}
      <HeaderNavbar />

      {/* =========================================================================
          1. FESTIVE ROYAL HERO BANNER
         ========================================================================= */}
      <div className="pooja-hero-banner">
        <div className="pooja-hero-content">
          <div className="pooja-hero-text">
            <span className="pooja-hero-badge">
              <Sparkles size={14} /> 14th Sep – 19th Sep 2026 • Grand Utsav
            </span>
            <h1 className="pooja-hero-title">Pooja Schedule &amp; Team Directory</h1>
            <p className="pooja-hero-desc">
              Complete day-by-day ritual timings, daily morning &amp; evening Maha Aarti schedule,
              special seva details, and dedicated committee Team for Tower A &amp; Tower B.
            </p>
          </div>

          <div className="pooja-hero-action-buttons">
            <button
              type="button"
              className="pooja-hero-cta-btn"
              onClick={() => navigate('/ganesh-utsav')}
            >
              <span>🪔 Family Sankalpam</span>
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              className="pooja-hero-secondary-btn"
              onClick={() => navigate('/donations')}
            >
              <span>💳 Collections</span>
            </button>
            <button
              type="button"
              className="pooja-hero-secondary-btn"
              onClick={handleShare}
              title="Share Pooja Schedule Link"
            >
              {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
            <button
              type="button"
              className="pooja-hero-secondary-btn no-print"
              onClick={handlePrint}
              title="Print Pooja Schedule"
            >
              <Printer size={16} />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. QUICK DAILY RITUAL RULES & TIMINGS OVERVIEW
         ========================================================================= */}
      <div className="daily-ritual-rules-card">
        <div className="rule-metric-box">
          <div className="rule-icon-wrap" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <Flame size={22} />
          </div>
          <div>
            <h4 className="rule-title">Morning Abhishekam</h4>
            <div className="rule-value">07:30 AM – 09:30 AM</div>
            <p className="rule-note">Nitya Pooja, 21 Patra Archana &amp; Panchamrutham</p>
          </div>
        </div>

        <div className="rule-metric-box">
          <div className="rule-icon-wrap" style={{ background: '#fef3c7', color: '#b45309' }}>
            <Clock size={22} />
          </div>
          <div>
            <h4 className="rule-title">Evening Grand Aarti</h4>
            <div className="rule-value">07:00 PM Sharp</div>
            <p className="rule-note">Samuhika Bhajans, 108 Deepa Harathi &amp; Hot Prasad</p>
          </div>
        </div>

        <div className="rule-metric-box">
          <div className="rule-icon-wrap" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <Utensils size={22} />
          </div>
          <div>
            <h4 className="rule-title">Day 5 Grand Maha Prasadam</h4>
            <div className="rule-value">18th Sep • 09:00 PM</div>
            <p className="rule-note">Grand Community Feast for all residents &amp; staff</p>
          </div>
        </div>

        <div className="rule-metric-box">
          <div className="rule-icon-wrap" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <PartyPopper size={22} />
          </div>
          <div>
            <h4 className="rule-title">Day 6 Visarjan Yatra</h4>
            <div className="rule-value">19th Sep • 03:30 PM</div>
            <p className="rule-note">Laddu Auction, Dhol Tasha Procession to Lake</p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. MAIN SECTION TABS (SCHEDULE VS TEAMS & SPOCS)
         ========================================================================= */}
      <div className="pooja-nav-tabs-wrapper">
        <div className="pooja-main-tabs-group">
          <button
            type="button"
            className={`pooja-main-tab-btn ${activeMainTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('schedule')}
          >
            <Calendar size={18} />
            <span>Pooja Schedule (14th to 19th Sep)</span>
            <span className="pooja-sub-counter-badge">6 Days</span>
          </button>
          <button
            type="button"
            className={`pooja-main-tab-btn ${activeMainTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('teams')}
          >
            <Users size={18} />
            <span>Committee Teams</span>
            <span className="pooja-sub-counter-badge">12 Leads</span>
          </button>
        </div>

        {activeMainTab === 'schedule' && (
          <span style={{ fontSize: '0.82rem', color: '#78350f', fontWeight: 700 }}>
            ✨ Select date below to see full ritual timeline
          </span>
        )}
      </div>

      {/* =========================================================================
          4. TAB A: 6-DAY INTERACTIVE POOJA SCHEDULE (SEP 14 - SEP 19)
         ========================================================================= */}
      {activeMainTab === 'schedule' && (
        <>
          {/* Day Date Selector Carousel */}
          <div className="pooja-dates-carousel">
            {POOJA_SCHEDULE_DAYS.map((day) => {
              const isSelected = day.dayNumber === selectedDayNumber;
              return (
                <button
                  key={day.dayNumber}
                  type="button"
                  className={`date-pill-card ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedDayNumber(day.dayNumber)}
                >
                  <span className="date-pill-daynum">
                    Day {day.dayNumber} • {day.dayOfWeek}
                  </span>
                  <span className="date-pill-date">{day.date.replace(' 2026', '')}</span>
                  <span className="date-pill-badge">{day.badge.split('—')[1] || day.badge}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Day Main Card */}
          <div className="day-details-main-card">
            <div className="day-details-header">
              <div>
                <span className="day-details-tag">
                  Day {activeDay.dayNumber} • {activeDay.dayOfWeek}, {activeDay.date}
                </span>
                <h2 className="day-details-title">{activeDay.title}</h2>
                <p className="day-details-subtitle">{activeDay.subtitle}</p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                  }}
                >
                  <Sparkles size={14} /> {activeDay.badge}
                </span>
              </div>
            </div>

            {/* Morning vs Evening Sessions */}
            <div className="day-sessions-grid">
              {/* Morning Session */}
              <div className="session-box morning">
                <div className="session-top-row">
                  <div className="session-title-wrap">
                    <span>🌅</span>
                    <span>Morning Pooja &amp; Abhishekam</span>
                  </div>
                  <span className="session-time-pill">
                    <Clock size={12} /> {activeDay.morningPooja.time}
                  </span>
                </div>

                <ul className="ritual-steps-list">
                  {activeDay.morningPooja.rituals.map((ritual, idx) => (
                    <li key={idx} className="ritual-step-item">
                      <span className="ritual-step-bullet">✦</span>
                      <span>{ritual}</span>
                    </li>
                  ))}
                </ul>

                <div className="session-naivedyam-box">
                  <span>🥥</span>
                  <div>
                    <strong>Naivedyam / Prasad:</strong> {activeDay.morningPooja.naivedyam}
                  </div>
                </div>

                {activeDay.morningPooja.dressCode && (
                  <div className="session-dresscode-box">
                    <Shirt size={14} color="#ea580c" />
                    <span>
                      <strong>Suggested Attire:</strong> {activeDay.morningPooja.dressCode}
                    </span>
                  </div>
                )}
              </div>

              {/* Evening Session */}
              <div className="session-box evening">
                <div className="session-top-row">
                  <div className="session-title-wrap">
                    <span>🪔</span>
                    <span>Evening Maha Aarti &amp; Satsang</span>
                  </div>
                  <span className="session-time-pill" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                    <Clock size={12} /> {activeDay.eveningPooja.time}
                  </span>
                </div>

                <ul className="ritual-steps-list">
                  {activeDay.eveningPooja.rituals.map((ritual, idx) => (
                    <li key={idx} className="ritual-step-item">
                      <span className="ritual-step-bullet" style={{ color: '#0284c7' }}>
                        ✦
                      </span>
                      <span>{ritual}</span>
                    </li>
                  ))}
                </ul>

                <div className="session-naivedyam-box" style={{ borderColor: '#0284c7', background: '#f0f9ff', color: '#0369a1' }}>
                  <span>🍯</span>
                  <div>
                    <strong>Evening Prasad:</strong> {activeDay.eveningPooja.naivedyam}
                  </div>
                </div>

                {activeDay.eveningPooja.culturalHighlight && (
                  <div className="session-dresscode-box" style={{ color: '#0f766e' }}>
                    <Sparkles size={14} color="#0d9488" />
                    <span>
                      <strong>Highlight:</strong> {activeDay.eveningPooja.culturalHighlight}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Special Highlight & Sponsor Note */}
            <div className="day-special-highlight-card">
              <div className="highlight-left">
                <CheckCircle2 size={18} color="#16a34a" />
                <span>{activeDay.specialHighlight}</span>
              </div>
              {activeDay.sponsorInfo && (
                <span style={{ fontSize: '0.78rem', color: '#9a3412', fontWeight: 700 }}>
                  💐 {activeDay.sponsorInfo}
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          5. TAB B: COMMITTEES, TEAMS & SPOC DIRECTORY
         ========================================================================= */}
      {activeMainTab === 'teams' && (
        <div className="spoc-directory-section">
          {/* Toolbar & Filters */}
          <div className="spoc-filter-toolbar">
            <div className="spoc-search-box">
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                className="spoc-search-input"
                placeholder="Search Team by name, flat (e.g. A-704), or role..."
                value={spocSearchQuery}
                onChange={(e) => setSpocSearchQuery(e.target.value)}
              />
            </div>

            <div className="team-pill-filter-bar">
              <button
                type="button"
                className={`team-pill-btn ${selectedTeamFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedTeamFilter('ALL')}
              >
                All Teams (6)
              </button>
              {COMMITTEE_TEAMS.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  className={`team-pill-btn ${selectedTeamFilter === team.id ? 'active' : ''}`}
                  onClick={() => setSelectedTeamFilter(team.id)}
                >
                  {team.name.split('&')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Teams List */}
          <div className="teams-list-wrapper">
            {filteredTeams.map((team) => (
              <div key={team.id} className="team-block-card">
                <div className="team-block-header">
                  <div>
                    <h3 className="team-block-title">
                      {renderTeamIcon(team.icon)}
                      <span>{team.name}</span>
                    </h3>
                    <p className="team-block-desc">{team.description}</p>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: '#f1f5f9',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      color: '#475569',
                    }}
                  >
                    {team.spocs.length} Team Members
                  </span>
                </div>

                {/* SPOCs inside team */}
                <div className="spocs-grid">
                  {team.spocs.map((spoc) => (
                    <div key={spoc.id} className="spoc-card">
                      <div>
                        <div className="spoc-top-row">
                          <div>
                            <h4 className="spoc-name">{spoc.name}</h4>
                            <div className="spoc-role">{spoc.role}</div>
                          </div>
                          <span className="spoc-flat-badge">
                            {spoc.flatNo} ({spoc.tower})
                          </span>
                        </div>

                        <div style={{ marginTop: '0.75rem' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: '#94a3b8',
                              letterSpacing: '0.04em',
                              display: 'block',
                              marginBottom: '0.35rem',
                            }}
                          >
                            Key Responsibilities:
                          </span>
                          <ul className="spoc-responsibilities-list">
                            {spoc.responsibilities.map((resp, rIdx) => (
                              <li key={rIdx} className="spoc-resp-item">
                                <span style={{ color: '#ea580c', fontWeight: 800 }}>•</span>
                                <span>{resp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Contact Actions: Call & WhatsApp */}
                      <div className="spoc-contact-actions">
                        <a
                          href={`tel:${spoc.phone.replace(/\s+/g, '')}`}
                          className="spoc-call-btn"
                          title={`Call ${spoc.name}`}
                        >
                          <Phone size={14} color="#0d9488" />
                          <span>Call</span>
                        </a>
                        <a
                          href={`https://wa.me/${spoc.whatsapp}?text=Namaste%20${encodeURIComponent(
                            spoc.name
                          )},%20reaching%20out%20regarding%20BPS%20Ganesh%20Utsav%20(${encodeURIComponent(
                            spoc.team
                          )}).`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="spoc-whatsapp-btn"
                          title={`WhatsApp ${spoc.name}`}
                        >
                          <MessageCircle size={14} />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filteredTeams.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  background: 'var(--surface, #ffffff)',
                  borderRadius: '16px',
                  border: '1px solid var(--outline-variant)',
                  color: 'var(--on-surface-variant)',
                }}
              >
                <Search size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <h4 style={{ margin: '0 0 0.25rem 0' }}>No matching team members found</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  Try adjusting your search terms or selecting "All Teams".
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          6. BOTTOM FESTIVAL CALL TO ACTION BAR
         ========================================================================= */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #0f766e 100%)',
          borderRadius: '18px',
          padding: '1.5rem',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 8px 24px -4px rgba(30, 58, 138, 0.3)',
        }}
      >
        <div style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fde047', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>
            <span>🪔</span>
            <span>Join Hands for Bappa's Seva</span>
          </div>
          <h3 style={{ margin: '0.2rem 0 0.3rem 0', fontSize: '1.2rem', fontWeight: 800 }}>
            Want to Volunteer or Sponsor a Specific Pooja Day?
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.4 }}>
            Register your family's Gothram for daily archana or join one of our volunteer committee teams.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="pooja-hero-cta-btn"
            onClick={() => navigate('/ganesh-utsav')}
          >
            <span>Book Pooja / Sankalpam</span>
          </button>
          <button
            type="button"
            className="pooja-hero-secondary-btn"
            onClick={() => navigate('/ganesh-volunteers')}
          >
            <span>Volunteer for Teams</span>
          </button>
        </div>
      </div>

      {/* Floating Bottom Nav */}
      <GaneshBottomNav />
    </div>
  );
};
