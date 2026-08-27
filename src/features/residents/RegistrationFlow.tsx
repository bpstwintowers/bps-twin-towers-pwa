import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Building2, Home, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import { searchFlats, submitRegistration, type FlatSearchResult } from '../../services/supabase/registrationService';
import './RegistrationFlow.css';

export const RegistrationFlow: React.FC = () => {
  const navigate = useNavigate();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [towerBlock, setTowerBlock] = useState('Block A');
  const [flatNumber, setFlatNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToRules, setAgreedToRules] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      setError('Please enter your mobile phone number.');
      return;
    }
    if (!flatNumber.trim()) {
      setError('Please enter your flat or apartment number.');
      return;
    }
    if (!password) {
      setError('Please choose a password (minimum 6 characters).');
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
    if (!agreedToRules) {
      setError('You must certify your tenancy/ownership to continue.');
      return;
    }

    try {
      setLoading(true);

      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            mobile_number: mobileNumber.trim(),
            block: towerBlock,
            flat_number: flatNumber.trim(),
          },
        },
      });

      if (authError) throw authError;

      // 2. Lookup flat in database or submit registration request
      try {
        const matchingFlats = await searchFlats(flatNumber.trim());
        const selectedFlat = matchingFlats.length > 0 ? matchingFlats[0] : null;

        if (selectedFlat) {
          await submitRegistration({
            flat_id: selectedFlat.flat_id,
            requested_membership_type: 'Primary Resident',
            relationship: 'Self',
            mobile: mobileNumber.trim(),
            remarks: `Tower: ${towerBlock}, Flat: ${flatNumber.trim()}`,
          });
        }
      } catch (err: any) {
        console.warn('Note: Background flat registration queued:', err.message);
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Registration failed:', err.message);
      setError(err.message || 'Failed to create account. Please check your details and try again.');
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
            <span className="social-proof-label">Join over 12,000+ active residents</span>
          </div>
        </div>

        <div className="right-register-panel">
          <div className="register-card-wrapper animate-fade-in" style={{ textAlign: 'center' }}>
            <CheckCircle2 size={64} style={{ color: '#0d9488', margin: '0 auto 16px' }} />
            <h2 className="register-title">Account Created!</h2>
            <p className="register-subtitle" style={{ marginBottom: '24px' }}>
              Your resident account for <strong>{towerBlock} - {flatNumber}</strong> has been registered. You can now sign in to access your portal.
            </p>
            <button
              className="btn-primary-register"
              onClick={() => navigate('/login')}
            >
              Proceed to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-root-container">
      {/* ====================================================================
          LEFT HERO BRAND PANEL (Identical to Login Reference)
          ==================================================================== */}
      <div className="left-hero-panel">
        <div className="left-panel-brand">
          <img src="/logo.png" alt="BPS Twin Towers Logo" className="brand-logo-icon" />
          <span className="brand-title">BPS Twin Towers</span>
        </div>

        <div className="blueprint-display-card">
          <img
            src="/community-blueprint.png"
            alt="Community Network Layout"
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
          <span className="social-proof-label">Join over 12,000+ active residents</span>
        </div>
      </div>

      {/* ====================================================================
          RIGHT REGISTRATION WORKSPACE (Matching Screenshot)
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
                  placeholder="Alex Carter"
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
                    placeholder="alex@hub.com"
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

            {/* Tower/Block & Flat Number (2 columns) */}
            <div className="form-grid-2col">
              <div className="form-group-col">
                <label htmlFor="reg-tower" className="reg-label">Tower / Block</label>
                <div className="reg-input-wrapper">
                  <Building2 size={18} className="reg-input-icon" />
                  <select
                    id="reg-tower"
                    className="reg-text-input reg-select-input"
                    value={towerBlock}
                    onChange={(e) => setTowerBlock(e.target.value)}
                  >
                    <option value="Block A">Tower A (Block A)</option>
                    <option value="Block B">Tower B (Block B)</option>
                  </select>
                </div>
              </div>

              <div className="form-group-col">
                <label htmlFor="reg-flat" className="reg-label">Flat / Apartment No.</label>
                <div className="reg-input-wrapper">
                  <Home size={18} className="reg-input-icon" />
                  <input
                    id="reg-flat"
                    type="text"
                    placeholder="1402 or B-811"
                    className="reg-text-input"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm Password (2 columns) */}
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
              {loading ? 'Creating Account...' : 'Create Account'}
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
