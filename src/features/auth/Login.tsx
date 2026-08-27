import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, UserPlus, FileCheck2 } from 'lucide-react';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;
      navigate('/');
    } catch (err: any) {
      console.error('Email login error:', err.message);
      setError(err.message || 'Invalid email or password. You can also sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
      setError('Failed to connect to Google authentication. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-root-container">
      {/* ====================================================================
          LEFT HERO BRAND PANEL (Matching Reference)
          ==================================================================== */}
      <div className="left-hero-panel">
        {/* Top Brand Header */}
        <div className="left-panel-brand">
          <img src="/logo.png" alt="BPS Twin Towers Logo" className="brand-logo-icon" />
          <span className="brand-title">BPS Twin Towers</span>
        </div>

        {/* Center 3D Community Blueprint Card */}
        <div className="blueprint-display-card">
          <img
            src="/community-blueprint.png"
            alt="Community Layout"
            className="blueprint-img"
          />
        </div>

        {/* Headlines Section */}
        <div className="hero-text-block">
          <h1 className="hero-main-title">Your community, connected.</h1>
          <p className="hero-sub-text">
            Manage flat clearances, visitor authorizations, amenity bookings, and real-time neighborhood updates in one secure unified dashboard.
          </p>
        </div>

        {/* Bottom Social Proof */}
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
          RIGHT AUTHENTICATION PANEL (Matching Reference + Real Database Flow)
          ==================================================================== */}
      <div className="right-auth-panel">
        <div className="auth-card-wrapper animate-fade-in">
          {/* Header */}
          <div className="auth-header">
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Enter your residential credentials to access your portal.</p>
          </div>

          {error && <div className="auth-error-alert">{error}</div>}

          {/* Email / Password Form */}
          <form className="auth-form" onSubmit={handleEmailLogin}>
            {/* Email Field */}
            <div className="input-group">
              <label htmlFor="email-input" className="input-label">Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon-left" />
                <input
                  id="email-input"
                  type="email"
                  placeholder="name@bpstwintowers.com"
                  className="text-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="input-group">
              <label htmlFor="password-input" className="input-label">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon-left" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  className="text-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-icon-right-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="form-meta-row">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkbox-label">Remember me</span>
              </label>
              <button
                type="button"
                className="forgot-link"
                onClick={() => setError('To reset password, please sign in via Google OAuth or contact the admin.')}
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Primary CTA */}
            <button
              type="submit"
              className="btn-primary-sign-in"
              disabled={loading || googleLoading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="secure-divider">
            <span className="divider-line"></span>
            <span className="divider-text">OR SECURE LOG IN</span>
            <span className="divider-line"></span>
          </div>

          {/* Google SSO */}
          <button
            type="button"
            className="btn-nfc-pass"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
          >
            <svg className="google-sso-icon" viewBox="0 0 24 24">
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
            <span>{googleLoading ? 'Connecting...' : 'Sign in with Google Workspace'}</span>
          </button>

          {/* Quick Secondary Links */}
          <div className="login-quick-links">
            <Link to="/register" className="quick-link-item">
              <UserPlus size={15} />
              <span>Register New Flat</span>
            </Link>
            <span className="quick-link-dot">•</span>
            <Link to="/registration-status" className="quick-link-item">
              <FileCheck2 size={15} />
              <span>Check Application Status</span>
            </Link>
          </div>

          {/* Security & RLS Notice */}
          <div className="login-security-badge">
            <ShieldCheck size={14} className="security-icon" />
            <span>Protected by Supabase Row-Level Security</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
