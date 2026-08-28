import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import {
  searchFlats,
  getFlatResidents,
  resolveUserAccess,
  getUserRegistrations,
  getCommunitySummary,
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
  Clock,
  CheckCircle2,
  AlertCircle,
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
  const [isVerifyingServer, setIsVerifyingServer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Database Social Proof States
  const [communityResidents, setCommunityResidents] = useState<Array<{ id: string; full_name: string; photo_url?: string | null }>>([]);
  const [totalResidentsCount, setTotalResidentsCount] = useState<number>(8);

  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Fast Parallel Server Validation after Google Authentication Redirect
  useEffect(() => {
    async function checkServerValidation() {
      const searchParams = new URLSearchParams(window.location.search);
      const isVerifyRoute = searchParams.get('verify') === 'true';
      const pendingAuthStr = sessionStorage.getItem('pending_active_resident_auth');

      // Fast check: inspect local session or user
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!isVerifyRoute && !pendingAuthStr && !user) return;
      if (!user && !isVerifyRoute) return;

      try {
        setIsVerifyingServer(true);
        setError(null);

        const activeUser = user || (await supabase.auth.getUser()).data.user;

        if (activeUser) {
          const pendingAuth = pendingAuthStr ? JSON.parse(pendingAuthStr) : null;
          if (pendingAuthStr) sessionStorage.removeItem('pending_active_resident_auth');

          // Parallel query execution: resolve access and check registrations concurrently
          const [accessInfo, registrations] = await Promise.all([
            resolveUserAccess().catch(() => []),
            getUserRegistrations().catch(() => []),
          ]);

          if (accessInfo && accessInfo.length > 0) {
            const hasActiveAccess = accessInfo.some(
              (a) => a.membership_status === 'Active' || (pendingAuth?.flat_id && a.flat_id === pendingAuth.flat_id)
            );

            if (hasActiveAccess) {
              const targetFlatId = pendingAuth?.flat_id || accessInfo[0].flat_id;
              if (targetFlatId) {
                localStorage.setItem('bps_active_flat_id', targetFlatId);
              }
              // Server validation SUCCESS -> Instant navigation to Dashboard
              navigate('/', { replace: true });
              return;
            }
          }

          // Check if user has a pending registration
          if (registrations && registrations.some((r) => r.status === 'Pending')) {
            navigate('/registration-status', { replace: true });
            return;
          }

          // If user is authenticated with Google but not yet registered to a flat -> Direct to registration flow
          if (isVerifyRoute) {
            navigate('/register', { replace: true });
          }
        }
      } catch (err: any) {
        console.error('Server validation error:', err);
        navigate('/', { replace: true });
      } finally {
        setIsVerifyingServer(false);
      }
    }

    checkServerValidation();
  }, [navigate]);

  // Load community residents from Supabase database on mount
  useEffect(() => {
    async function loadCommunityResidents() {
      try {
        // Fetch exact dynamic statistics via secure RPC
        const summary = await getCommunitySummary();
        if (summary?.active_residents_count !== undefined) {
          setTotalResidentsCount(summary.active_residents_count);
        }

        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, photo_url')
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

  // Active Resident Flow: Continue with Masked Email -> Google Auth -> Server Validation -> Dashboard
  const handleActiveResidentLogin = async (resident: FlatResidentInfo) => {
    try {
      setGoogleLoading(true);
      setError(null);

      // Save expected verification metadata into sessionStorage
      if (selectedFlat) {
        sessionStorage.setItem(
          'pending_active_resident_auth',
          JSON.stringify({
            flat_id: selectedFlat.flat_id,
            flat_number: selectedFlat.flat_number,
            resident_id: resident.id,
            resident_name: resident.full_name,
            masked_email: resident.masked_email,
          })
        );
      }

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login?verify=true`,
        },
      });

      if (authError) throw authError;
    } catch (err: any) {
      console.error('Error during Google authentication:', err.message);
      setError('Failed to initiate Google authentication. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // 1-Click Direct Google Login
  const handleDirectGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError(null);

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login?verify=true`,
        },
      });

      if (authError) throw authError;
    } catch (err: any) {
      console.error('Error during direct Google authentication:', err.message);
      setError('Failed to initiate Google authentication. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const [showFlatSearch, setShowFlatSearch] = useState(false);

  return (
    <div className="premium-login-container">
      {/* Full-Screen Fast Authentication Overlay */}
      {googleLoading && (
        <div className="oauth-redirect-loading-overlay animate-fade-in">
          <div className="oauth-redirect-card animate-scale-in">
            <div className="oauth-spinner-ring" />
            <div className="oauth-redirect-icon-wrap">
              <svg width="26" height="26" viewBox="0 0 24 24">
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
            </div>
            <h3 className="oauth-redirect-title">Connecting to Google...</h3>
            <p className="oauth-redirect-desc">
              Redirecting to Google Secure Authentication for <strong>BPS Twin Towers Portal</strong>.
            </p>
            <span className="oauth-redirect-sub">Please hold on for a moment...</span>
          </div>
        </div>
      )}

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

          {/* Bottom Hero Group (Callout + Divider + Social Proof) */}
          <div className="hero-bottom-group">
            {/* Callout */}
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
              <div className="proof-left-group">
                <div className="avatar-overlap-stack">
                  {communityResidents.map((resident, idx) => {
                    const bgColors = ['#00685f', '#545f73', '#755717', '#008378'];
                    const initial = resident.full_name ? resident.full_name.trim().charAt(0).toUpperCase() : 'R';

                    if (resident.photo_url) {
                      return (
                        <img
                          key={resident.id || idx}
                          src={resident.photo_url}
                          alt={resident.full_name}
                          className="stack-avatar"
                          onError={(e) => {
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
                  <span className="proof-highlight">{totalResidentsCount}+ Registered Residents</span>
                  <span className="proof-sub">BPS Twin Towers • 2 Blocks • 504 Flats</span>
                </div>
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
                  href="https://www.instagram.com/bpsnamishreetwintowers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-edge-btn"
                  title="Official Instagram (@bpsnamishreetwintowers)"
                  aria-label="Instagram Community"
                >
                  <InstagramIcon size={17} />
                </a>
              </div>
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
            <span className="auth-pill-label">RESIDENT & OWNER PORTAL</span>
            <h2 className="auth-card-title">Welcome Back</h2>
            <p className="auth-card-subtitle">
              Sign in with your registered Google account to access your home dashboard.
            </p>
          </div>

          {isVerifyingServer && (
            <div className="server-validation-badge animate-fade-in">
              <div className="validation-spinner" />
              <div className="validation-text">
                <strong>Verifying resident access with server...</strong>
                <span>Matching your Google account with registered flats</span>
              </div>
            </div>
          )}

          {error && <div className="auth-error-banner">{error}</div>}

          {/* ================================================================
              PRIMARY ACTION: 1-CLICK UNIVERSAL GOOGLE SIGN-IN
              ================================================================ */}
          <div className="universal-login-section">
            <button
              type="button"
              className="btn-google-direct-login"
              onClick={handleDirectGoogleLogin}
              disabled={googleLoading || isVerifyingServer}
            >
              <div className="google-btn-left">
                <svg width="22" height="22" viewBox="0 0 24 24">
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
                <span className="google-btn-text">
                  {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
                </span>
              </div>
              <ArrowRight size={18} className="google-btn-arrow" />
            </button>
            <span className="login-security-micro">Instant 1-click login for all registered owners & family</span>
          </div>

          {/* ================================================================
              DIVIDER: OR REGISTER NEW FLAT
              ================================================================ */}
          <div className="login-or-divider">
            <div className="or-line" />
            <span className="or-text">OR NEW REGISTRATION</span>
            <div className="or-line" />
          </div>

          {/* ================================================================
              NEW RESIDENT / FLAT REGISTRATION CARD
              ================================================================ */}
          <div className="new-resident-reg-card">
            <div className="new-reg-card-left">
              <div className="new-reg-badge-icon">
                <UserPlus size={20} />
              </div>
              <div className="new-reg-card-text">
                <span className="new-reg-title">New Flat Owner / Resident?</span>
                <span className="new-reg-sub">Register your flat to get portal & gate clearance</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-new-resident-start"
              onClick={() => navigate('/register')}
            >
              <span>Register Flat</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* ================================================================
              OPTIONAL LOOKUP BY FLAT NUMBER (Collapsible / Secondary)
              ================================================================ */}
          <div className="flat-lookup-toggle-area">
            <button
              type="button"
              className="btn-toggle-flat-lookup"
              onClick={() => {
                if (showFlatSearch) {
                  setFlatQuery('');
                  setSelectedFlat(null);
                  setFlatResidents([]);
                  setFlatResults([]);
                  setShowFlatDropdown(false);
                }
                setShowFlatSearch(!showFlatSearch);
              }}
            >
              <Search size={14} />
              <span>{showFlatSearch ? 'Hide Flat Lookup' : 'Lookup specific flat status'}</span>
              <ChevronRight size={14} className={`lookup-toggle-arrow ${showFlatSearch ? 'open' : ''}`} />
            </button>

            {showFlatSearch && (
              <div className="flat-selector-section animate-fade-in" ref={searchContainerRef} style={{ marginTop: '10px' }}>
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
            )}
          </div>

          {/* ================================================================
              STEP 2: BACKEND CHECKS STATUS: ACTIVE | PENDING | NOT REGISTERED
              ================================================================ */}
          {selectedFlat && (
            <div className="recognized-flat-section animate-fade-in">
              <div className="recognized-flat-header">
                <span className="recognized-flat-title">
                  Flat <strong>{selectedFlat.flat_number}</strong>
                </span>
                {selectedFlat.bhk && <span className="recognized-bhk">{selectedFlat.bhk}</span>}
              </div>

              {isLoadingResidents ? (
                <div className="residents-skeleton-loader">Verifying flat status...</div>
              ) : (
                (() => {
                  const activeResidents = flatResidents.filter((r) => r.status !== 'pending');
                  const pendingResidents = flatResidents.filter((r) => r.status === 'pending');

                  // 1. ACTIVE STATUS -> Click "Continue with [Masked Email]" -> Google Auth -> Server Validation -> Dashboard
                  if (activeResidents.length > 0) {
                    return (
                      <div className="resident-pills-list">
                        {activeResidents.map((resident) => (
                          <button
                            key={resident.id}
                            className="resident-login-pill-btn"
                            onClick={() => handleActiveResidentLogin(resident)}
                            disabled={googleLoading || isVerifyingServer}
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
                                  Continue with {resident.masked_email}
                                </span>
                              </div>
                            </div>
                            <ChevronRight size={18} className="pill-arrow-icon" />
                          </button>
                        ))}
                      </div>
                    );
                  }

                  // 2. PENDING STATUS -> Pending message & Track Status
                  if (pendingResidents.length > 0) {
                    return (
                      <div className="flat-pending-callout animate-fade-in">
                        <div className="pending-status-header">
                          <div className="pending-badge-icon">
                            <Clock size={20} className="clock-amber-icon" />
                          </div>
                          <div className="pending-header-text">
                            <h3 className="pending-status-title">Registration Pending</h3>
                            <span className="pending-applicant-email">
                              Applicant: <strong>{pendingResidents[0].masked_email}</strong>
                            </span>
                          </div>
                        </div>
                        <p className="pending-status-desc">
                          Your registration is under review. Our admin team will verify your details and approve your account shortly.
                        </p>
                        <button
                          type="button"
                          className="track-status-action-btn"
                          onClick={() => navigate('/registration-status')}
                        >
                          <Clock size={15} />
                          <span>Track Application Status</span>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    );
                  }

                  // 3. NOT REGISTERED -> Register Button -> Registration Form
                  return (
                    <div className="flat-unregistered-callout animate-fade-in">
                      <div className="unregistered-header">
                        <span className="unregistered-tag">NOT REGISTERED</span>
                        <p className="unregistered-text">
                          No resident registered yet for <strong>{selectedFlat.flat_number}</strong>.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="register-flat-primary-btn"
                        onClick={() =>
                          navigate('/register', {
                            state: {
                              flat_id: selectedFlat.flat_id,
                              flat_number: selectedFlat.flat_number,
                              bhk: selectedFlat.bhk,
                            },
                          })
                        }
                      >
                        <UserPlus size={18} />
                        <span>Register Flat {selectedFlat.flat_number}</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* ================================================================
              TRUST, SECURITY & FOOTER LINKS
              ================================================================ */}
          <div className="auth-card-footer">
            <div className="secured-by-badge">
              <Lock size={13} className="lock-icon" />
              <span>Secure authentication · Supabase RLS</span>
            </div>

            <div className="footer-support-links">
              <a
                href="mailto:bpstwintowers.society@gmail.com"
                className="footer-icon-btn"
                title="Email: bpstwintowers.society@gmail.com"
                aria-label="Email Support"
              >
                <Mail size={15} />
              </a>
              <a
                href="https://www.instagram.com/bpsnamishreetwintowers"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-icon-btn"
                title="Instagram: @bpsnamishreetwintowers"
                aria-label="Official Instagram"
              >
                <InstagramIcon size={15} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
