import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import {
  searchFlats,
  getFlatResidents,
  type FlatSearchResult,
  type FlatResidentInfo,
} from '../../services/supabase/registrationService';
import {
  Search,
  Building2,
  Home,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Mail,
} from 'lucide-react';
import './Login.css';

const InstagramIcon: React.FC<{ size?: number }> = ({ size = 17 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Login: React.FC = () => {
  const [flatQuery, setFlatQuery] = useState('');
  const [flatResults, setFlatResults] = useState<FlatSearchResult[]>([]);
  const [selectedFlat, setSelectedFlat] = useState<FlatSearchResult | null>(null);
  const [flatResidents, setFlatResidents] = useState<FlatResidentInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingResidents, setIsLoadingResidents] = useState(false);
  const [showFlatDropdown, setShowFlatDropdown] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Database Social Proof States
  const [communityResidents, setCommunityResidents] = useState<Array<{ id: string; full_name: string; photo_url?: string | null }>>([]);
  const [totalResidentsCount, setTotalResidentsCount] = useState<number>(240);

  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load community residents from Supabase database on mount
  useEffect(() => {
    async function loadCommunityResidents() {
      try {
        const { data, count } = await supabase
          .from('profiles')
          .select('id, full_name, photo_url', { count: 'exact' })
          .limit(4);

        if (data && data.length > 0) {
          setCommunityResidents(data);
        } else {
          setCommunityResidents([
            { id: '1', full_name: 'Manikandan M', photo_url: null },
            { id: '2', full_name: 'Rashmi M', photo_url: null },
            { id: '3', full_name: 'Suresh Kumar', photo_url: null },
          ]);
        }

        if (count && count > 0) {
          setTotalResidentsCount(Math.max(count, 240));
        }
      } catch (err) {
        console.warn('Error loading social proof profiles from DB:', err);
        setCommunityResidents([
          { id: '1', full_name: 'Manikandan M', photo_url: null },
          { id: '2', full_name: 'Rashmi M', photo_url: null },
          { id: '3', full_name: 'Suresh Kumar', photo_url: null },
        ]);
      }
    }

    loadCommunityResidents();
  }, []);

  // Search flats in Supabase
  const handleSearchChange = (query: string) => {
    setFlatQuery(query);
    setSelectedFlat(null);
    setFlatResidents([]);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query.trim().length === 0) {
      setFlatResults([]);
      setShowFlatDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowFlatDropdown(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchFlats(query.trim());
        setFlatResults(results);
      } catch (err) {
        console.error('Flat search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);
  };

  // Handle flat selection & load residents
  const handleSelectFlat = async (flat: FlatSearchResult) => {
    setSelectedFlat(flat);
    setFlatQuery(flat.flat_number);
    setShowFlatDropdown(false);
    setIsLoadingResidents(true);

    try {
      const residents = await getFlatResidents(flat.flat_id);
      setFlatResidents(residents);
    } catch (err) {
      console.error('Error fetching flat residents:', err);
    } finally {
      setIsLoadingResidents(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowFlatDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoogleLogin = async (_hintEmail?: string) => {
    try {
      setGoogleLoading(true);
      setError(null);
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (authError) throw authError;
    } catch (err: any) {
      console.error('Error during Google login:', err.message);
      setError('Failed to initiate Google authentication. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="premium-login-container">
      {/* ====================================================================
          LEFT SIDE: BRANDING & LUXURY HERO SHOWCASE
          ==================================================================== */}
      <div className="luxury-hero-side">
        {/* Full-Height Architectural Background */}
        <div className="hero-background-media" />
        <div className="hero-gradient-overlay auth-brand-overlay" />

        {/* Ambient Floating Particle Lights */}
        <div className="ambient-particles">
          <span className="particle p1" />
          <span className="particle p2" />
          <span className="particle p3" />
          <span className="particle p4" />
        </div>

        {/* Hero Content */}
        <div className="hero-content-wrapper">
          {/* Top Brand Header */}
          <div className="hero-brand-header">
            <div className="brand-logo-badge">
              <img src="/logo.png" alt="BPS Twin Towers Emblem" className="brand-logo-img" />
            </div>
            <div className="brand-text-block">
              <span className="brand-super-title">Saidabad • Hyderabad</span>
              <h2 className="brand-name-title">BPS TWIN TOWERS</h2>
            </div>
          </div>

          {/* Center Luxury Callout */}
          <div className="hero-center-callout">
            <div className="gold-accent-bar" />
            <span className="hero-welcome-badge">
              <Sparkles size={14} className="gold-sparkle-icon" />
              Welcome Home
            </span>
            <h1 className="hero-luxury-headline">Your community. Your home. Connected.</h1>
            <p className="hero-luxury-subtext">
              Experience seamless residential management, instant visitor authorizations, verified gate clearances, and amenity reservations.
            </p>
          </div>

          {/* Bottom Social Proof & Trust Stats (Database Connected) */}
          <div className="hero-bottom-proof">
            <div className="avatar-overlap-stack">
              {communityResidents.map((resident, idx) => {
                const bgColors = ['#1a3055', '#0f766e', '#775a19', '#312e81'];
                const initial = resident.full_name ? resident.full_name.trim().charAt(0).toUpperCase() : 'R';

                if (resident.photo_url) {
                  return (
                    <img
                      key={resident.id || idx}
                      src={resident.photo_url}
                      alt={resident.full_name}
                      className="stack-avatar"
                      onError={(e) => {
                        // On image error, hide img and replace with initial
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  );
                }

                return (
                  <div
                    key={resident.id || idx}
                    className="stack-avatar-initial"
                    style={{ backgroundColor: bgColors[idx % bgColors.length] }}
                    title={resident.full_name}
                  >
                    {initial}
                  </div>
                );
              })}
            </div>
            <div className="proof-text-group">
              <span className="proof-highlight">{totalResidentsCount}+ Verified Residents</span>
              <span className="proof-sub">Exclusively for Tower A & Tower B</span>
            </div>

            {/* Right Edge Mailbox & Instagram Links */}
            <div className="hero-social-edge-links">
              <a
                href="mailto:bpstwintowers.society@gmail.com"
                className="social-edge-btn"
                title="Contact Support (bpstwintowers.society@gmail.com)"
                aria-label="Mail Support"
              >
                <Mail size={17} />
              </a>
              <a
                href="https://instagram.com/bpstwintowers"
                target="_blank"
                rel="noopener noreferrer"
                className="social-edge-btn"
                title="Official Instagram Community"
                aria-label="Instagram Community"
              >
                <InstagramIcon size={17} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          RIGHT SIDE: INTERACTIVE AUTH CARD
          ==================================================================== */}
      <div className="interactive-auth-side">
        <div className="auth-card-panel animate-fade-in">
          {/* Card Header */}
          <div className="auth-card-header">
            <span className="auth-pill-label">RESIDENT PORTAL</span>
            <h2 className="auth-card-title">Welcome Back</h2>
            <p className="auth-card-subtitle">
              Select your flat or continue with Google to access your community dashboard.
            </p>
          </div>

          {error && <div className="auth-error-banner">{error}</div>}

          {/* ================================================================
              STEP 1: SOCIETY FLAT SELECTOR (Dropdown / Live Search Pill)
              ================================================================ */}
          <div className="flat-selector-section" ref={searchContainerRef}>
            <label className="section-field-label">
              <Building2 size={15} />
              <span>Select Your Flat (Optional Fast Login)</span>
            </label>

            <div className="flat-search-pill-wrapper">
              <Search size={18} className="search-pill-icon" />
              <input
                type="text"
                placeholder="Search flat (e.g. A-402, B-811)..."
                className="flat-search-pill-input"
                value={flatQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (flatResults.length > 0) setShowFlatDropdown(true);
                }}
                autoComplete="off"
              />
              {isSearching && <span className="search-spinner-text">Searching...</span>}
            </div>

            {/* Flat Autocomplete Dropdown */}
            {showFlatDropdown && flatResults.length > 0 && (
              <div className="flat-search-dropdown-menu">
                {flatResults.map((flat) => (
                  <div
                    key={flat.flat_id}
                    className="flat-dropdown-row"
                    onClick={() => handleSelectFlat(flat)}
                  >
                    <div className="row-flat-info">
                      <Home size={16} className="flat-icon-muted" />
                      <span className="row-flat-num">{flat.flat_number}</span>
                      {flat.bhk && <span className="row-bhk-tag">{flat.bhk}</span>}
                    </div>
                    <span className={`row-status-pill ${flat.owner_registered ? 'occupied' : 'available'}`}>
                      {flat.owner_registered ? 'Registered' : 'Available'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ================================================================
              STEP 2: RECOGNIZED FLAT RESIDENTS (Clickable Pills)
              ================================================================ */}
          {selectedFlat && (
            <div className="recognized-flat-section animate-fade-in">
              <div className="recognized-flat-header">
                <span className="recognized-flat-title">
                  Residents of <strong>{selectedFlat.flat_number}</strong>
                </span>
                {selectedFlat.bhk && <span className="recognized-bhk">{selectedFlat.bhk}</span>}
              </div>

              {isLoadingResidents ? (
                <div className="residents-skeleton-loader">Loading verified residents...</div>
              ) : flatResidents.length > 0 ? (
                <div className="resident-pills-list">
                  {flatResidents.map((resident) => (
                    <button
                      key={resident.id}
                      className="resident-login-pill-btn"
                      onClick={() => handleGoogleLogin(resident.masked_email)}
                      disabled={googleLoading}
                    >
                      <div className="resident-pill-left">
                        <div className="resident-avatar-circle">
                          {resident.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="resident-info-block">
                          <div className="resident-name-row">
                            <span className="resident-name-text">{resident.full_name}</span>
                            <span className={`role-badge ${resident.resident_type.toLowerCase()}`}>
                              {resident.resident_type}
                            </span>
                          </div>
                          <span className="resident-email-masked">
                            Log in as {resident.masked_email}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="pill-arrow-icon" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flat-no-residents-callout">
                  <p>No resident registered yet for {selectedFlat.flat_number}.</p>
                  <button
                    type="button"
                    className="btn-register-flat-cta"
                    onClick={() => navigate('/register')}
                  >
                    <UserPlus size={16} />
                    <span>Register as new resident of {selectedFlat.flat_number}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              UNIVERSAL ACTION: CONTINUE WITH GOOGLE OAUTH
              ================================================================ */}
          <div className="universal-oauth-container">
            <button
              type="button"
              className="google-oauth-pill-btn"
              onClick={() => handleGoogleLogin()}
              disabled={googleLoading}
            >
              <svg className="google-g-svg" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? 'Connecting Google Account...' : 'Continue with Google'}</span>
            </button>
          </div>

          {/* ================================================================
              STEP 3: UNREGISTERED / NEW RESIDENT SECONDARY ACTION
              ================================================================ */}
          <div className="new-resident-action-wrapper">
            <div className="action-divider-row">
              <span className="divider-line" />
              <span className="divider-tag">NEW TO BPS TWIN TOWERS?</span>
              <span className="divider-line" />
            </div>

            <Link to="/register" className="register-resident-secondary-btn">
              <div className="btn-left-content">
                <UserPlus size={18} className="user-plus-icon" />
                <span>Register as new resident</span>
              </div>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* ================================================================
              TRUST, SECURITY & FOOTER LINKS
              ================================================================ */}
          <div className="auth-card-footer">
            <div className="secured-by-badge">
              <Lock size={13} className="lock-icon" />
              <span>Secured by Google Workspace & Supabase RLS</span>
            </div>

            <div className="footer-support-links">
              <a href="mailto:bpstwintowers.society@gmail.com" className="support-link">
                <Mail size={13} />
                <span>bpstwintowers.society@gmail.com</span>
              </a>
              <span className="link-separator">•</span>
              <Link to="/registration-status" className="support-link">
                Track Application Status
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
