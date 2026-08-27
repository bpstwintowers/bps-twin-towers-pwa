import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Building2,
  Home,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Search,
  Users,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import {
  searchFlats,
  getBlocks,
  submitRegistration,
  type FlatSearchResult,
  type BlockInfo,
  type RegistrationPayload,
} from '../../services/supabase/registrationService';
import './RegistrationFlow.css';

export const RegistrationFlow: React.FC = () => {
  const navigate = useNavigate();

  // Database states
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string>('Block A');
  const [flatQuery, setFlatQuery] = useState('');
  const [flatResults, setFlatResults] = useState<FlatSearchResult[]>([]);
  const [selectedFlat, setSelectedFlat] = useState<FlatSearchResult | null>(null);
  const [isSearchingFlat, setIsSearchingFlat] = useState(false);
  const [showFlatDropdown, setShowFlatDropdown] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [membershipType, setMembershipType] = useState<RegistrationPayload['requested_membership_type']>('Primary Resident');
  const [relationship, setRelationship] = useState('Self');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToRules, setAgreedToRules] = useState(false);

  // User session state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const flatSearchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing session & blocks on mount
  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          if (user.user_metadata?.full_name) setFullName(user.user_metadata.full_name);
          if (user.email) setEmail(user.email);
        }

        const blockList = await getBlocks();
        if (blockList.length > 0) {
          setBlocks(blockList);
          setSelectedBlock(blockList[0].name);
        }
      } catch (err) {
        console.warn('Init error:', err);
      }
    }
    init();
  }, []);

  // Handle flat search with debounce against Supabase search_flats RPC
  const handleFlatSearchChange = (query: string) => {
    setFlatQuery(query);
    setSelectedFlat(null);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query.trim().length === 0) {
      setFlatResults([]);
      setShowFlatDropdown(false);
      return;
    }

    setIsSearchingFlat(true);
    setShowFlatDropdown(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchFlats(query.trim());
        setFlatResults(results);
      } catch (err) {
        console.error('Flat search error:', err);
      } finally {
        setIsSearchingFlat(false);
      }
    }, 250);
  };

  const handleSelectFlat = (flat: FlatSearchResult) => {
    setSelectedFlat(flat);
    setFlatQuery(flat.flat_number);
    setShowFlatDropdown(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (flatSearchRef.current && !flatSearchRef.current.contains(e.target as Node)) {
        setShowFlatDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form Validations
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!mobileNumber.trim()) {
      setError('Please enter your WhatsApp mobile number.');
      return;
    }
    if (!selectedFlat && !flatQuery.trim()) {
      setError('Please select or search your flat / apartment number.');
      return;
    }

    // Password validation if not already signed in
    if (!currentUser) {
      if (!password) {
        setError('Please create a password for your resident account.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
    }

    if (!agreedToRules) {
      setError('You must certify your tenancy/ownership to submit your application.');
      return;
    }

    try {
      setLoading(true);

      let targetFlatId = selectedFlat?.flat_id;

      // If user typed custom flat without clicking dropdown, try matching
      if (!targetFlatId && flatQuery.trim()) {
        const matched = await searchFlats(flatQuery.trim());
        if (matched.length > 0) {
          targetFlatId = matched[0].flat_id;
        }
      }

      // If user not authenticated, sign up with Supabase
      let activeUserId = currentUser?.id;
      if (!currentUser) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: fullName.trim(),
              mobile_number: mobileNumber.trim(),
              block: selectedBlock,
              flat_number: flatQuery.trim(),
            },
          },
        });

        if (authError) throw authError;
        activeUserId = authData.user?.id;
      }

      // If user is already authenticated with Google/OAuth, ensure profile has details
      if (currentUser?.id) {
        try {
          await supabase.from('profiles').upsert({
            id: currentUser.id,
            full_name: fullName.trim(),
            mobile_number: mobileNumber.trim(),
            photo_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null,
            updated_at: new Date().toISOString(),
          });
        } catch (profileErr) {
          console.warn('Could not update profile:', profileErr);
        }
      }

      // Submit registration request into database
      if (targetFlatId) {
        await submitRegistration({
          flat_id: targetFlatId,
          requested_membership_type: membershipType,
          relationship: membershipType === 'Primary Resident' ? 'Self' : relationship,
          mobile: mobileNumber.trim(),
          resident_type: membershipType === 'Tenant' ? 'Tenant' : 'Owner',
          remarks: `Block: ${selectedBlock}, Applicant: ${fullName.trim()}`,
        });
      }

      // Immediately navigate to the Registration Pending status screen
      navigate('/registration-status');
    } catch (err: any) {
      console.error('Registration error:', err.message);
      setError(err.message || 'Failed to submit registration. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="register-root-container">
        <div className="left-hero-panel">
          <div className="left-panel-brand">
            <img src="/logo.png" alt="BPS Twin Towers Logo" className="brand-logo-icon" />
            <span className="brand-title">BPS Twin Towers</span>
          </div>

          <div className="blueprint-display-card">
            <img
              src="/community-blueprint.png"
              alt="Community Layout"
              className="blueprint-img"
            />
          </div>

          <div className="hero-text-block">
            <h1 className="hero-main-title">Your community, connected.</h1>
            <p className="hero-sub-text">
              Manage flat clearances, visitor authorizations, amenity bookings, and real-time neighborhood updates in one secure unified dashboard.
            </p>
          </div>

          <div className="hero-social-row">
            <div className="avatar-group">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces" alt="Resident" className="photo-avatar" />
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces" alt="Resident" className="photo-avatar" />
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces" alt="Resident" className="photo-avatar" />
            </div>
            <span className="social-proof-label">Join over 240+ verified active residents</span>
          </div>
        </div>

        <div className="right-register-panel">
          <div className="register-card-wrapper animate-fade-in" style={{ textAlign: 'center' }}>
            <CheckCircle2 size={64} style={{ color: '#0d9488', margin: '0 auto 16px' }} />
            <h2 className="register-title">Application Submitted!</h2>
            <p className="register-subtitle" style={{ marginBottom: '24px' }}>
              Your registration for <strong>{selectedBlock} - {flatQuery}</strong> has been received and forwarded to society administration.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                className="btn-primary-register"
                onClick={() => navigate('/registration-status')}
              >
                Track Application Status
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '12px', borderRadius: '10px' }}
                onClick={() => navigate('/')}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-root-container">
      {/* ====================================================================
          LEFT HERO BRAND PANEL (Identical to Reference Layout)
          ==================================================================== */}
      <div className="left-hero-panel">
        <div className="left-panel-brand">
          <img src="/logo.png" alt="BPS Twin Towers Logo" className="brand-logo-icon" />
          <span className="brand-title">BPS Twin Towers</span>
        </div>

        <div className="blueprint-display-card">
          <img
            src="/community-blueprint.png"
            alt="Community Layout"
            className="blueprint-img"
          />
        </div>

        <div className="hero-text-block">
          <h1 className="hero-main-title">Your community, connected.</h1>
          <p className="hero-sub-text">
            Manage flat clearances, visitor authorizations, amenity bookings, and real-time neighborhood updates in one secure unified dashboard.
          </p>
        </div>

        <div className="hero-social-row">
          <div className="avatar-group">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces" alt="Resident" className="photo-avatar" />
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces" alt="Resident" className="photo-avatar" />
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces" alt="Resident" className="photo-avatar" />
          </div>
          <span className="social-proof-label">Join over 240+ verified active residents</span>
        </div>
      </div>

      {/* ====================================================================
          RIGHT REGISTRATION WORKSPACE (Database Connected)
          ==================================================================== */}
      <div className="right-register-panel">
        <div className="register-card-wrapper animate-fade-in">
          {/* Header */}
          <div className="register-header">
            <h2 className="register-title">Create Your Account</h2>
            <p className="register-subtitle">Join your community hub to connect with other residents and management.</p>
          </div>

          {error && (
            <div className="register-error-alert">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="register-form" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="form-group-full">
              <label htmlFor="reg-full-name" className="reg-label">Full Name</label>
              <div className="reg-input-wrapper">
                <User size={18} className="reg-input-icon" />
                <input
                  id="reg-full-name"
                  type="text"
                  placeholder="e.g. Manikandan M"
                  className="reg-text-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email Address & Mobile Number (2 columns) */}
            <div className="form-grid-2col">
              <div className="form-group-col">
                <label htmlFor="reg-email" className="reg-label">Email Address</label>
                <div className="reg-input-wrapper">
                  <Mail size={18} className="reg-input-icon" />
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="name@bpstwintowers.com"
                    className="reg-text-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group-col">
                <label htmlFor="reg-mobile" className="reg-label">Mobile Number</label>
                <div className="reg-input-wrapper">
                  <Phone size={18} className="reg-input-icon" />
                  <input
                    id="reg-mobile"
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="reg-text-input"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            {/* Tower / Block & Flat Autocomplete (2 columns) */}
            <div className="form-grid-2col">
              <div className="form-group-col">
                <label htmlFor="reg-tower" className="reg-label">Tower / Block</label>
                <div className="reg-input-wrapper">
                  <Building2 size={18} className="reg-input-icon" />
                  <select
                    id="reg-tower"
                    className="reg-text-input reg-select-input"
                    value={selectedBlock}
                    onChange={(e) => setSelectedBlock(e.target.value)}
                  >
                    {blocks.length > 0 ? (
                      blocks.map((b) => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="Block A">Tower A (Block A)</option>
                        <option value="Block B">Tower B (Block B)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="form-group-col" ref={flatSearchRef}>
                <label htmlFor="reg-flat" className="reg-label">Flat / Apartment No.</label>
                <div className="reg-input-wrapper">
                  <Home size={18} className="reg-input-icon" />
                  <input
                    id="reg-flat"
                    type="text"
                    placeholder="e.g. A-402, B-811"
                    className="reg-text-input"
                    value={flatQuery}
                    onChange={(e) => handleFlatSearchChange(e.target.value)}
                    onFocus={() => {
                      if (flatResults.length > 0) setShowFlatDropdown(true);
                    }}
                    autoComplete="off"
                  />
                  {isSearchingFlat && (
                    <span style={{ position: 'absolute', right: '12px', fontSize: '0.75rem', color: '#94a3b8' }}>
                      searching...
                    </span>
                  )}
                </div>

                {/* Flat Autocomplete Dropdown */}
                {showFlatDropdown && flatResults.length > 0 && (
                  <div className="flat-autocomplete-dropdown">
                    {flatResults.map((f) => (
                      <div
                        key={f.flat_id}
                        className="flat-autocomplete-item"
                        onClick={() => handleSelectFlat(f)}
                      >
                        <div className="flat-item-main">
                          <span className="flat-item-number">{f.flat_number}</span>
                          {f.bhk && <span className="flat-item-bhk">{f.bhk}</span>}
                        </div>
                        {f.owner_registered ? (
                          <span className="flat-item-badge occupied">Occupied</span>
                        ) : (
                          <span className="flat-item-badge available">Available</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Resident Role / Membership Type */}
            <div className="form-group-full">
              <label className="reg-label">Residency Role</label>
              <div className="role-selector-pills">
                <button
                  type="button"
                  className={`role-pill ${membershipType === 'Primary Resident' ? 'active' : ''}`}
                  onClick={() => setMembershipType('Primary Resident')}
                >
                  <Home size={14} />
                  <span>Owner</span>
                </button>
                <button
                  type="button"
                  className={`role-pill ${membershipType === 'Tenant' ? 'active' : ''}`}
                  onClick={() => setMembershipType('Tenant')}
                >
                  <Users size={14} />
                  <span>Tenant</span>
                </button>
                <button
                  type="button"
                  className={`role-pill ${membershipType === 'Family Member' ? 'active' : ''}`}
                  onClick={() => setMembershipType('Family Member')}
                >
                  <Users size={14} />
                  <span>Family Member</span>
                </button>
              </div>
            </div>

            {/* Passwords (only if not signed in) */}
            {!currentUser && (
              <div className="form-grid-2col">
                <div className="form-group-col">
                  <label htmlFor="reg-password" className="reg-label">Password</label>
                  <div className="reg-input-wrapper">
                    <Lock size={18} className="reg-input-icon" />
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="reg-text-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="reg-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group-col">
                  <label htmlFor="reg-confirm-password" className="reg-label">Confirm Password</label>
                  <div className="reg-input-wrapper">
                    <Lock size={18} className="reg-input-icon" />
                    <input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="reg-text-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="reg-eye-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Agreement Checkbox */}
            <label className="reg-checkbox-container">
              <input
                type="checkbox"
                checked={agreedToRules}
                onChange={(e) => setAgreedToRules(e.target.checked)}
              />
              <span className="reg-checkbox-text">
                I certify that I am a registered tenant/owner of this property, and agree to the community rules and guidelines.
              </span>
            </label>

            {/* Primary Submit CTA */}
            <button
              type="submit"
              className="btn-primary-register"
              disabled={loading}
            >
              {loading ? 'Submitting Application...' : 'Create Account'}
            </button>
          </form>

          {/* Footer Link */}
          <div className="register-footer-row">
            <span>Already have an account? </span>
            <Link to="/login" className="login-highlight-link">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
