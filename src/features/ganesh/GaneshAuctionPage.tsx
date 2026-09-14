import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  MapPin,
  ArrowLeft,
} from 'lucide-react';
import { GaneshBottomNav } from './components/GaneshBottomNav';
import { HeaderNavbar } from './components/HeaderNavbar';
import './GaneshAuction.css';

interface GaneshAuctionPageProps {
  embedded?: boolean;
  onBackToHome?: () => void;
}

export const GaneshAuctionPage: React.FC<GaneshAuctionPageProps> = ({ embedded = false, onBackToHome }) => {
  const navigate = useNavigate();

  // Target Date: Sep 19, 2026, 16:30:00 (4:30 PM)
  const [timeLeft, setTimeLeft] = useState(() => {
    const targetDate = new Date('2026-09-19T16:30:00');
    const now = new Date();
    const diff = Math.max(0, targetDate.getTime() - now.getTime());

    if (diff <= 0) {
      return { days: 5, hours: 18, minutes: 45, seconds: 11 };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="auction-page-root">
      {/* Top Navbar (Standalone only) */}
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

      {/* Main Content */}
      <main className="auction-main-container">
        {/* 1. TOP HERO CARD: The Sacred 21-Kg Pure Ghee Maha Laddu + COUNTDOWN TIMER */}
        <section className="auction-hero-widget">
          {/* Header */}
          <div className="auction-widget-header">
            <div className="auction-medal-icon">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="auction-widget-title">The Sacred 21-Kg Pure Ghee Maha Laddu</h2>
              <p className="auction-widget-sub">BPS Twin Towers Ganesh Utsav 2026</p>
            </div>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: '0.88rem',
              color: '#475569',
              lineHeight: 1.55,
              margin: '0 0 1.25rem 0',
            }}
          >
            Consecrated across all 6 days of the festival with continuous Vedic chantings,
            Atharvashirsha recitations, and daily sacred mangala aartis at the BPS Mandap. Winning this
            divine Prasadam is believed to bestow prosperity and auspicious beginnings upon the entire
            family.
          </p>

          {/* Countdown Timer with DAYS, HRS, MIN, SEC */}
          <div className="auction-timer-subcard">
            <div className="timer-subcard-label">AUCTION STARTS IN</div>
            <div className="timer-boxes-row">
              {/* DAYS */}
              <div className="timer-box-col">
                <div className="timer-number-box">
                  {String(timeLeft.days).padStart(2, '0')}
                </div>
                <span className="timer-unit-label">DAYS</span>
              </div>

              <span className="timer-colon">:</span>

              {/* HRS */}
              <div className="timer-box-col">
                <div className="timer-number-box">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <span className="timer-unit-label">HRS</span>
              </div>

              <span className="timer-colon">:</span>

              {/* MIN */}
              <div className="timer-box-col">
                <div className="timer-number-box">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <span className="timer-unit-label">MIN</span>
              </div>

              <span className="timer-colon">:</span>

              {/* SEC */}
              <div className="timer-box-col">
                <div className="timer-number-box">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <span className="timer-unit-label">SEC</span>
              </div>
            </div>
          </div>

          {/* Offline In-Person Notice Pill */}
          <div className="offline-notice-pill">
            <MapPin size={16} color="#b45309" />
            <span>In-Person Offline Bidding at Central Mandap Stage</span>
          </div>
        </section>

        {/* 2. TOP GRID CARDS */}
        <section className="auction-top-grid">
          {/* Card 1: Date & Time */}
          <div className="auction-grid-box">
            <div className="grid-box-header">AUCTION DATE &amp; TIME</div>
            <div className="grid-box-value time-text">Sep 19 • 4:30 PM</div>
            <div className="grid-box-sub">Before Visarjan Procession</div>
          </div>

          {/* Card 2: Starting Bid */}
          <div className="auction-grid-box">
            <div className="grid-box-header">STARTING BID</div>
            <div className="grid-box-value amount-text">₹5,001</div>
            <div className="grid-box-sub">Min Increment: ₹500</div>
          </div>
        </section>

        {/* 3. AUCTION RULES & GUIDELINES CARD */}
        <section className="auction-rules-card">
          <div className="rules-card-header">
            <ShieldCheck size={22} color="#2563eb" />
            <span>Auction Rules &amp; Guidelines</span>
          </div>

          <ul className="rules-list-clean">
            <li>Open to all residents of BPS Twin Towers (Towers A &amp; B).</li>
            <li>
              All proceeds from the auction are directly credited into the{' '}
              <strong>BPS Ganesh Event Fund</strong>.
            </li>
            <li>
              The highest bidder will receive the blessed 21-kg Laddu
              and a ceremonial shawl felicitation by the head priest.
            </li>
          </ul>
        </section>
      </main>

      {/* Floating Bottom Nav (Standalone only) */}
      {!embedded && <GaneshBottomNav />}
    </div>
  );
};
