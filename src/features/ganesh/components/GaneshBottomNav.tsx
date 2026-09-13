import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Calendar,
  Users,
  Building2,
  HeartHandshake,
  Megaphone,
  Menu,
  Utensils,
  Sparkles,
  DollarSign,
  Receipt,
  Gavel,
  X,
  ChevronRight,
} from 'lucide-react';
import './GaneshBottomNav.css';

interface Props {
  activeTab?: string;
  onSelectTab?: (tab: 'home' | 'contributions' | 'expenses' | 'pooja' | 'spocs' | 'sankalpam') => void;
  onOpenContributeModal?: () => void;
}

export const GaneshBottomNav: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onOpenContributeModal: _onOpenContributeModal,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const pathname = location.pathname;

  const isHomeActive = activeTab ? activeTab === 'home' : (pathname === '/ganesh-utsav' || pathname === '/ganesh-contributions' || pathname === '/');
  const isEventsActive = activeTab ? activeTab === 'pooja' : (pathname === '/events' || pathname === '/pooja-schedule' || pathname === '/pooja-details' || pathname === '/ganesh-events');
  const isVolunteerActive = activeTab ? activeTab === 'spocs' : (pathname === '/ganesh-volunteers' || pathname === '/ganesh-spocs' || pathname === '/volunteers');
  const isRegisterActive = pathname === '/login' || pathname === '/register' || pathname === '/registration-status';
  const isUpdatesActive = pathname === '/announcements' || pathname === '/ganesh-updates';

  const moreItems = [
    {
      title: 'Prasadam & Feast',
      subtext: 'Daily Maha Prasadam & Day 5 Grand Feast',
      icon: <Utensils size={20} color="#ea580c" />,
      bg: '#ffedd5',
      path: '/ganesh-prasadam',
    },
    {
      title: 'Cultural Programmes',
      subtext: 'Kids talent show, dance & bhajan night',
      icon: <Sparkles size={20} color="#be123c" />,
      bg: '#ffe4e6',
      path: '/ganesh-cultural',
    },
    {
      title: 'Festival Funds & Audit',
      subtext: 'Live collections, target budget & overview',
      icon: <DollarSign size={20} color="#0369a1" />,
      bg: '#e0f2fe',
      path: '/ganesh-funds',
    },
    {
      title: 'Community Expenses',
      subtext: 'Live audited expenses & bill records',
      icon: <Receipt size={20} color="#059669" />,
      bg: '#d1fae5',
      path: '/ganesh-expenses',
    },
    {
      title: 'Maha Laddu Auction',
      subtext: 'Day 6 prestigious auction rules & bidding',
      icon: <Gavel size={20} color="#334155" />,
      bg: '#f1f5f9',
      path: '/ganesh-auction',
    },
  ];

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav className="ganesh-bottom-nav no-print" aria-label="Festival Navigation">
        <div className="ganesh-bottom-nav-inner">
          {/* 1. Home */}
          <button
            type="button"
            className={`ganesh-tab-item ${isHomeActive ? 'is-active' : ''}`}
            onClick={() => {
              if (onSelectTab) {
                onSelectTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate('/ganesh-utsav');
              }
            }}
          >
            <div className="ganesh-tab-icon-wrap">
              <Home size={22} />
            </div>
            <span className="ganesh-tab-label">Home</span>
          </button>

          {/* 2. Events */}
          <button
            type="button"
            className={`ganesh-tab-item ${isEventsActive ? 'is-active' : ''}`}
            onClick={() => {
              if (onSelectTab) {
                onSelectTab('pooja');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate('/events');
              }
            }}
          >
            <div className="ganesh-tab-icon-wrap">
              <Calendar size={22} />
            </div>
            <span className="ganesh-tab-label">Events</span>
          </button>

          {/* 3. SPOCs */}
          <button
            type="button"
            className={`ganesh-tab-item ${isVolunteerActive ? 'is-active' : ''}`}
            onClick={() => {
              navigate('/ganesh-volunteers');
            }}
          >
            <div className="ganesh-tab-icon-wrap">
              <Users size={22} />
            </div>
            <span className="ganesh-tab-label">SPOCs</span>
          </button>

          {/* 4. My Flat */}
          <button
            type="button"
            className={`ganesh-tab-item ${isRegisterActive ? 'is-active' : ''}`}
            onClick={() => navigate('/login')}
          >
            <div className="ganesh-tab-icon-wrap">
              <Building2 size={22} />
            </div>
            <span className="ganesh-tab-label">My Flat</span>
          </button>

          {/* 5. More */}
          <button
            type="button"
            className={`ganesh-tab-item ${isMoreOpen ? 'is-active' : ''}`}
            onClick={() => setIsMoreOpen(true)}
          >
            <div className="ganesh-tab-icon-wrap">
              <Menu size={22} />
            </div>
            <span className="ganesh-tab-label">More</span>
          </button>
        </div>
      </nav>

      {/* More Bottom Sheet Drawer */}
      {isMoreOpen && (
        <div
          className="ganesh-more-overlay no-print"
          onClick={() => setIsMoreOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="ganesh-more-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="ganesh-more-handle" />

            {/* Sheet Header */}
            <div className="ganesh-more-header">
              <div className="ganesh-more-title-box">
                <h3 className="more-sheet-title">Festival Services &amp; Links</h3>
                <span className="more-sheet-subtitle">BPS Twin Towers Ganesh Utsav 2026</span>
              </div>
              <button
                type="button"
                className="ganesh-more-close"
                onClick={() => setIsMoreOpen(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Grid of More Links */}
            <div className="ganesh-more-grid">
              {moreItems.map((item, idx) => (
                <div
                  key={idx}
                  className="ganesh-more-card"
                  onClick={() => {
                    setIsMoreOpen(false);
                    navigate(item.path);
                  }}
                >
                  <div className="ganesh-more-icon" style={{ background: item.bg }}>
                    {item.icon}
                  </div>
                  <div className="ganesh-more-text">
                    <h4>{item.title}</h4>
                    <p>{item.subtext}</p>
                  </div>
                  <ChevronRight size={18} className="ganesh-more-arrow" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
