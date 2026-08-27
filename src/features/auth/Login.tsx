import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import { ShieldCheck, UserPlus, FileCheck2, ArrowRight } from 'lucide-react';
import './Login.css';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Error during Google login:', err.message);
      setError('Failed to initiate Google login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-login-wrapper">
      {/* Left Brand Panel */}
      <div className="login-hero-panel">
        <div className="hero-panel-inner">
          {/* Top Brand Header */}
          <div className="hero-brand">
            <img src="/logo.png" alt="BPS Twin Towers Logo" className="hero-brand-logo" />
            <div>
              <span className="hero-brand-title">BPS Twin Towers</span>
              <span className="hero-brand-subtitle">Saidabad, Hyderabad</span>
            </div>
          </div>

          {/* Central Architectural Building Showcase */}
          <div className="hero-graphic-card">
            <img
              src="/bps-towers-hero.jpg"
              alt="BPS Twin Towers High-Rise Architecture"
              className="hero-graphic-image"
            />
          </div>

          {/* Hero Headlines */}
          <div className="hero-typography">
            <h1 className="hero-headline">Your community, connected.</h1>
            <p className="hero-tagline">
              Manage flat clearances, visitor authorizations, amenity bookings, and real-time neighborhood updates in one secure unified dashboard.
            </p>
          </div>

          {/* Bottom Social Proof */}
          <div className="hero-social-proof">
            <div className="avatar-stack">
              <span className="proof-avatar" style={{ background: '#3b82f6' }}>M</span>
              <span className="proof-avatar" style={{ background: '#10b981' }}>R</span>
              <span className="proof-avatar" style={{ background: '#f59e0b' }}>S</span>
            </div>
            <span className="proof-text">Joined by 240+ flats & verified residents</span>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="login-form-panel">
        <div className="form-panel-inner animate-fade-in">
          <div className="form-header">
            <h2 className="form-title">Welcome Back</h2>
            <p className="form-subtitle">Enter your residential credentials to access your portal.</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Google Single Sign-On Button */}
          <div className="auth-primary-action">
            <button
              className="google-sso-button"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="google-icon" viewBox="0 0 24 24">
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
              <span>{loading ? 'Connecting Google Workspace...' : 'Sign in with Google'}</span>
            </button>
          </div>

          <div className="form-divider">
            <span>OR RESIDENT ACTIONS</span>
          </div>

          {/* Secondary Resident Actions */}
          <div className="secondary-actions-stack">
            <button
              className="action-link-card"
              onClick={() => navigate('/register')}
            >
              <div className="action-card-left">
                <div className="action-card-icon">
                  <UserPlus size={18} />
                </div>
                <div>
                  <span className="action-card-title">New Resident Onboarding</span>
                  <span className="action-card-desc">Register your flat ownership or tenancy</span>
                </div>
              </div>
              <ArrowRight size={16} className="action-card-arrow" />
            </button>

            <button
              className="action-link-card"
              onClick={() => navigate('/registration-status')}
            >
              <div className="action-card-left">
                <div className="action-card-icon">
                  <FileCheck2 size={18} />
                </div>
                <div>
                  <span className="action-card-title">Check Application Status</span>
                  <span className="action-card-desc">Track committee approval & flat clearance</span>
                </div>
              </div>
              <ArrowRight size={16} className="action-card-arrow" />
            </button>
          </div>

          {/* Security & Verification Assurance */}
          <div className="login-security-notice">
            <ShieldCheck size={16} className="security-icon" />
            <span>Protected by Supabase Row-Level Security & Encrypted Google Auth</span>
          </div>

          <div className="form-footer">
            <p>© 2026 BPS Twin Towers Welfare Association • Saidabad</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
