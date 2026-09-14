import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import { fetchActiveAnnouncements, type AnnouncementItem } from '../../services/supabase/communicationService';
import { fetchPublishedEvents, type EventItem } from '../../services/supabase/eventService';
import {
  Calendar,
  CreditCard,
  Award,
  Info,
  Clock,
  ArrowRight,
  Droplets,
  Sparkles,
  ThumbsUp,
  Vote,
  Flame,
} from 'lucide-react';
import './Dashboard.css';

export const ResidentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [myDonationSum, setMyDonationSum] = useState<number>(0);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profileData) setProfile(profileData);

        // Fetch events
        try {
          const evData = await fetchPublishedEvents();
          setEvents(evData || []);
        } catch (err) {
          console.error('Error fetching events:', err);
        }

        // Fetch donation campaigns
        try {
          const { data: campData } = await supabase
            .from('donation_campaigns')
            .select('*')
            .eq('status', 'Active');
          setCampaigns(campData || []);
        } catch (err) {
          console.error('Error fetching campaigns:', err);
        }

        // Fetch user donation sum
        try {
          const { data: donData } = await supabase
            .from('donations')
            .select('amount')
            .eq('user_id', user.id);
          const sum = (donData || []).reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);
          setMyDonationSum(sum);
        } catch (err) {
          console.error('Error fetching donations:', err);
        }

        // Fetch announcements
        try {
          const annData = await fetchActiveAnnouncements();
          setAnnouncements(annData);
        } catch (err) {
          console.error('Error fetching announcements:', err);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getFormattedDate = () => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Resident';

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', color: 'var(--text-muted)' }}>
        <div className="animate-fade-in">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-content-container">
      {/* Welcome Greeting Section */}
      <div className="dashboard-greeting-header animate-fade-in">
        <h2 className="greeting-title">{getGreeting()}, {firstName}</h2>
        <p className="greeting-subtitle">
          Today is {getFormattedDate()}. Here's what's happening in BPS Twin Towers today.
        </p>
      </div>

      {/* 4 Top KPI Summary Cards */}
      <div className="dashboard-kpi-grid animate-fade-in">
        {/* Card 1: Upcoming Events */}
        <div className="kpi-metric-card" onClick={() => navigate('/events')}>
          <div className="kpi-card-inner">
            <div className="kpi-icon-container green">
              <Calendar size={20} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Upcoming Events</span>
              <span className="kpi-value">{events.length > 0 ? events.length : 3}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Contributions */}
        <div className="kpi-metric-card" onClick={() => navigate('/donations')}>
          <div className="kpi-card-inner">
            <div className="kpi-icon-container teal">
              <CreditCard size={20} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Active Contributions</span>
              <span className="kpi-value">{campaigns.length > 0 ? campaigns.length : 2}</span>
            </div>
          </div>
        </div>

        {/* Card 3: My Contributions */}
        <div className="kpi-metric-card" onClick={() => navigate('/donations')}>
          <div className="kpi-card-inner">
            <div className="kpi-icon-container emerald">
              <Award size={20} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">My Contributions</span>
              <span className="kpi-value">
                ₹{myDonationSum > 0 ? myDonationSum.toLocaleString('en-IN') : '12,500'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Pending Notices */}
        <div className="kpi-metric-card" onClick={() => navigate('/notifications')}>
          <div className="kpi-card-inner">
            <div className="kpi-icon-container cyan">
              <Info size={20} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Pending Notices</span>
              <span className="kpi-value">{announcements.length > 0 ? announcements.length : 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Municipal Water Connection Initiative Spotlight Banner */}
      <section
        className="dashboard-water-spotlight animate-fade-in"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #0f3742 50%, #0d9488 100%)',
          borderRadius: 'var(--radius-xl, 16px)',
          padding: '1.5rem',
          color: '#ffffff',
          boxShadow: '0 8px 24px -4px rgba(13, 148, 136, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          flexWrap: 'wrap',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/water-initiative')}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', maxWidth: '680px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              flexShrink: 0,
            }}
          >
            <Droplets size={24} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: 'rgba(13, 148, 136, 0.35)',
                  border: '1px solid rgba(94, 234, 212, 0.4)',
                  color: '#5eead4',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Active Society Initiative
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>BPS Water Task Force</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              Municipal Water Connection Strategy Hub
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#cbd5e1', margin: 0, lineHeight: 1.45 }}>
              Post your thoughts, legal advice, and builder negotiation ideas to help secure our municipal
              water line. Upvote community proposals!
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#0d9488',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.15rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.4)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate('/water-initiative');
            }}
          >
            <span>Explore & Post Strategy</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Resident Pulse & Satisfaction Survey Banner */}
      <section
        className="dashboard-water-spotlight animate-fade-in"
        style={{
          background: 'linear-gradient(135deg, #042f2e 0%, #0f766e 60%, #0284c7 100%)',
          borderRadius: 'var(--radius-xl, 16px)',
          padding: '1.4rem 1.5rem',
          color: '#ffffff',
          boxShadow: '0 8px 24px -4px rgba(15, 118, 110, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          flexWrap: 'wrap',
          cursor: 'pointer',
          marginTop: '1.25rem',
        }}
        onClick={() => navigate('/surveys')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '640px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            <Vote size={24} color="#ffffff" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '9999px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                Active Society Pulse Poll
              </span>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Tower A & B</span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              Essential Services & Lift Maintenance Survey (2 Mins)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: 0, lineHeight: 1.4 }}>
              Rate water timing, lift performance, and security diligence to guide the upcoming MC maintenance review.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#ffffff',
              color: '#0f766e',
              border: 'none',
              padding: '0.65rem 1.15rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate('/surveys');
            }}
          >
            <span>Take Quick Survey</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Ganesh Utsav Pooja Schedule & SPOCs Spotlight Banner */}
      <section
        className="dashboard-water-spotlight animate-fade-in"
        style={{
          background: 'linear-gradient(135deg, #78350f 0%, #b45309 45%, #ea580c 100%)',
          borderRadius: 'var(--radius-xl, 16px)',
          padding: '1.4rem 1.5rem',
          color: '#ffffff',
          boxShadow: '0 8px 24px -4px rgba(180, 83, 9, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          flexWrap: 'wrap',
          cursor: 'pointer',
          marginTop: '1.25rem',
          border: '1.5px solid #fde68a',
        }}
        onClick={() => navigate('/pooja-schedule')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '640px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid rgba(255, 255, 255, 0.35)',
            }}
          >
            <Flame size={24} color="#fef08a" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  background: 'rgba(254, 240, 138, 0.25)',
                  color: '#fef08a',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '9999px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  border: '1px solid rgba(254, 240, 138, 0.4)',
                }}
              >
                14th – 19th Sep 2026
              </span>
              <span style={{ fontSize: '0.8rem', color: '#fed7aa' }}>Tower A &amp; B Mandap</span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              Pooja Schedule (14th–19th) &amp; Committee SPOC Directory
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#fef3c7', margin: 0, lineHeight: 1.4 }}>
              Daily morning Abhishekam (7:30 AM), evening Maha Aarti (7:00 PM), Annadanam feast (17th), and dedicated team SPOC contacts.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#ffffff',
              color: '#9a3412',
              border: 'none',
              padding: '0.65rem 1.15rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate('/pooja-schedule');
            }}
          >
            <span>View Schedule &amp; Team</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Upcoming Community Events Section */}
      <section className="dashboard-events-section animate-fade-in">
        <div className="section-header-row">
          <h3 className="section-heading-title">Upcoming Community Events</h3>
          <button
            type="button"
            className="btn-view-all-link"
            onClick={() => navigate('/events')}
          >
            <span>View All Events</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="events-cards-grid">
          {/* Event 1 */}
          <div className="event-community-card">
            <div className="event-card-banner banner-festival">
              <div className="event-banner-overlay">
                <span className="event-badge-tag">Festival</span>
              </div>
            </div>
            <div className="event-card-content">
              <h4 className="event-card-title">Ganesh Chaturthi Festivities</h4>
              <div className="event-card-meta">
                <Clock size={13} />
                <span>Aug 30, 2026 • 6:00 PM onwards</span>
              </div>

              <div className="event-funding-box">
                <div className="funding-labels">
                  <span className="funding-amounts">₹95,000 / ₹1,20,000</span>
                  <span className="funding-percentage">79%</span>
                </div>
                <div className="funding-progress-track">
                  <div className="funding-progress-fill" style={{ width: '79%' }} />
                </div>
              </div>

              <button
                type="button"
                className="btn-event-card-details"
                onClick={() => navigate('/ganesh-utsav')}
              >
                Ganesh Contribution & Sponsors Hub
              </button>
            </div>
          </div>

          {/* Event 2 */}
          <div className="event-community-card">
            <div className="event-card-banner banner-diwali">
              <div className="event-banner-overlay">
                <span className="event-badge-tag">Cultural</span>
              </div>
            </div>
            <div className="event-card-content">
              <h4 className="event-card-title">Diwali Grand Celebration</h4>
              <div className="event-card-meta">
                <Clock size={13} />
                <span>Nov 01, 2026 • 7:00 PM onwards</span>
              </div>

              <div className="event-funding-box">
                <div className="funding-labels">
                  <span className="funding-amounts">₹45,000 / ₹2,00,000</span>
                  <span className="funding-percentage">23%</span>
                </div>
                <div className="funding-progress-track">
                  <div className="funding-progress-fill" style={{ width: '23%' }} />
                </div>
              </div>

              <button
                type="button"
                className="btn-event-card-details"
                onClick={() => navigate('/events')}
              >
                View Event Details
              </button>
            </div>
          </div>

          {/* Event 3 */}
          <div className="event-community-card">
            <div className="event-card-banner banner-sports">
              <div className="event-banner-overlay">
                <span className="event-badge-tag">Sports</span>
              </div>
            </div>
            <div className="event-card-content">
              <h4 className="event-card-title">Community Sports & Badminton Day</h4>
              <div className="event-card-meta">
                <Clock size={13} />
                <span>Sep 03, 2026 • 9:00 AM - 5:00 PM</span>
              </div>

              <div className="event-funding-box">
                <div className="funding-labels">
                  <span className="funding-amounts">₹25,000 / ₹50,000</span>
                  <span className="funding-percentage">50%</span>
                </div>
                <div className="funding-progress-track">
                  <div className="funding-progress-fill" style={{ width: '50%' }} />
                </div>
              </div>

              <button
                type="button"
                className="btn-event-card-details"
                onClick={() => navigate('/events')}
              >
                View Event Details
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Updates & Notices Section */}
      <section className="dashboard-notices-section animate-fade-in">
        <div className="recent-notices-container">
          <h3 className="notices-section-title">Recent Updates & Notices</h3>

          <div className="notices-items-list">
            {/* Notice 1 */}
            <div className="notice-item-row">
              <div className="notice-left-col">
                <span className="notice-dot teal" />
                <div className="notice-content">
                  <div className="notice-title">Ganesh Chaturthi Festivities</div>
                  <div className="notice-description">
                    Catering vendor 'Shree Swad' finalized for the grand community dinner on Sep 19. Menu details sent to registered flats.
                  </div>
                </div>
              </div>
              <div className="notice-time">10 mins ago</div>
            </div>

            {/* Notice 2 */}
            <div className="notice-item-row">
              <div className="notice-left-col">
                <span className="notice-dot amber" />
                <div className="notice-content">
                  <div className="notice-title">Tower B Water Supply Maintenance</div>
                  <div className="notice-description">
                    Water supply maintenance scheduled for Tower B on Wednesday between 2:00 PM and 4:00 PM. Please plan accordingly.
                  </div>
                </div>
              </div>
              <div className="notice-time">2 hours ago</div>
            </div>

            {/* Notice 3 */}
            <div className="notice-item-row">
              <div className="notice-left-col">
                <span className="notice-dot green" />
                <div className="notice-content">
                  <div className="notice-title">Diwali Grand Celebration Contribution</div>
                  <div className="notice-description">
                    Contribution collections have crossed ₹45,000 within 24 hours of release! Thank you residents for the prompt feedback.
                  </div>
                </div>
              </div>
              <div className="notice-time">Yesterday, 4:30 PM</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};