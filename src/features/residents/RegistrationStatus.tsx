import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, ArrowRight, RefreshCw, Building2, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import { getUserRegistrations, type RegistrationRequest } from '../../services/supabase/registrationService';
import './RegistrationStatus.css';

export const RegistrationStatus: React.FC = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRegistrations = async (showRefreshSpinner = false) => {
    try {
      if (showRefreshSpinner) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await getUserRegistrations();
      setRegistrations(data);
    } catch (err: any) {
      console.warn('Error fetching registrations:', err);
      setRegistrations([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  if (loading) {
    return (
      <div className="status-screen-wrapper">
        <div className="status-loading-spinner">
          <div className="spinner" />
          <span>Verifying registration status...</span>
        </div>
      </div>
    );
  }

  // Check latest registration status
  const latestReg = registrations[0];
  const isApproved = latestReg?.status === 'Approved';
  const isRejected = latestReg?.status === 'Rejected';

  const handleBackToLogin = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    navigate('/login');
  };

  return (
    <div className="status-screen-wrapper">
      {/* Brand Header */}
      <div className="status-brand-header">
        <div className="status-brand-badge">
          <img src="/logo.png" alt="BPS Twin Towers" className="status-brand-logo" />
        </div>
        <div className="status-brand-texts">
          <span className="status-brand-super">Saidabad • Hyderabad</span>
          <h2 className="status-brand-name">BPS TWIN TOWERS</h2>
        </div>
      </div>

      <div className="registration-pending-card animate-fade-in">
        {/* Top Status Icon */}
        <div
          className={`status-icon-circle ${
            isApproved ? 'approved' : isRejected ? 'rejected' : 'pending'
          }`}
        >
          {isApproved ? (
            <CheckCircle2 size={36} className="status-icon-approved" />
          ) : isRejected ? (
            <AlertCircle size={36} className="status-icon-pending" />
          ) : (
            <Clock size={36} className="status-icon-pending" />
          )}
        </div>

        {/* Title & Subtitle */}
        <h1 className="pending-card-title">
          {isApproved
            ? 'Registration Approved!'
            : isRejected
            ? 'Registration Rejected'
            : 'Registration Pending'}
        </h1>
        <p className="pending-card-description">
          {isApproved
            ? `Your flat access for ${
                latestReg?.flat_number || 'your flat'
              } has been verified and approved by the BPS Twin Towers management committee.`
            : isRejected
            ? 'Your application could not be verified with society records. Please reach out to administration.'
            : 'Your registration is under review. Our admin team will verify your details and approve your account shortly.'}
        </p>

        {/* Flat Details Pill (if available) */}
        {latestReg && (
          <div className="pending-flat-badge">
            <div className="pending-flat-info">
              <Building2 size={16} style={{ color: '#00685f', flexShrink: 0 }} />
              <span>
                Flat: <strong>{latestReg.flat_number || 'Selected Flat'}</strong>
                {latestReg.block_name ? ` • Block ${latestReg.block_name}` : ''}
              </span>
            </div>
            <span
              className={`status-tag ${latestReg.status
                .toLowerCase()
                .replace(/\s+/g, '-')}`}
            >
              {latestReg.status}
            </span>
          </div>
        )}

        {/* What Happens Next Card */}
        <div className="what-happens-next-card">
          <h3 className="next-steps-title">What happens next?</h3>

          <div className="next-steps-list">
            <div className="next-step-row">
              <span className="step-num-badge">1</span>
              <p className="step-text">Admin reviews your submitted details to match resident records.</p>
            </div>

            <div className="next-step-row">
              <span className="step-num-badge">2</span>
              <p className="step-text">You'll receive verification approval on your registered email.</p>
            </div>

            <div className="next-step-row">
              <span className="step-num-badge">3</span>
              <p className="step-text">Sign in to access visitor passes, maintenance payments, and notices.</p>
            </div>
          </div>
        </div>

        {/* Primary CTA Buttons */}
        <div className="pending-card-actions">
          {isApproved ? (
            <button
              type="button"
              className="btn-pending-primary"
              onClick={() => navigate('/')}
            >
              <span>Enter Community Dashboard</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-pending-primary"
                onClick={handleBackToLogin}
              >
                <span>Back to Login</span>
              </button>
              <button
                type="button"
                className="btn-pending-secondary"
                onClick={() => fetchRegistrations(true)}
                disabled={isRefreshing}
              >
                <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
                <span>{isRefreshing ? 'Checking...' : 'Check Status Again'}</span>
              </button>
            </>
          )}
        </div>

        {/* Support Footer */}
        <div className="pending-card-footer">
          <span>Need assistance? Contact </span>
          <a
            href="mailto:bpstwintowers.society@gmail.com"
            className="pending-support-link"
          >
            bpstwintowers.society@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
};
