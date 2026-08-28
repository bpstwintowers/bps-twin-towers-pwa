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
                onClick={() => navigate('/events')}
              >
                View Event Details
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