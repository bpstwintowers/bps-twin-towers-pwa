import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, ArrowRight, RefreshCw, Mail } from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import { getUserRegistrations, type RegistrationRequest } from '../../services/supabase/registrationService';
import './RegistrationFlow.css';

export const RegistrationStatus: React.FC = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserRegistrations();
      setRegistrations(data);
    } catch (err: any) {
      console.warn('Error fetching registrations:', err);
      // For anonymous users viewing status or initial check
      setRegistrations([]);
    } finally {
      setLoading(false);
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

  return (
    <div className="status-screen-wrapper">
      <div className="registration-pending-card animate-fade-in">
        {/* Top Status Icon */}
        <div className={`status-icon-circle ${isApproved ? 'approved' : 'pending'}`}>
          {isApproved ? (
            <CheckCircle2 size={36} className="status-icon-approved" />
          ) : (
            <Clock size={36} className="status-icon-pending" />
          )}
        </div>

        {/* Title & Subtitle */}
        <h1 className="pending-card-title">
          {isApproved ? 'Registration Approved!' : 'Registration Pending'}
        </h1>
        <p className="pending-card-description">
          {isApproved
            ? `Your flat access for ${latestReg?.flat_number || 'your flat'} has been verified and approved by the BPS Twin Towers management committee.`
            : 'Your registration is under review. Our admin team will verify your details and approve your account shortly.'}
        </p>

        {/* Flat Details Pill (if available) */}
        {latestReg && (
          <div className="pending-flat-badge">
            <span>
              Flat: <strong>{latestReg.flat_number || 'Selected Flat'}</strong>
              {latestReg.block_name ? ` • Block ${latestReg.block_name}` : ''}
            </span>
            <span className={`status-tag ${latestReg.status.toLowerCase().replace(/\s+/g, '-')}`}>
              {latestReg.status}
            </span>
          </div>
        )}

        {/* What Happens Next Card */}
        <div className="what-happens-next-card">
          <h3 className="next-steps-title">What happens next?</h3>

          <div className="next-steps-list">
            <div className="step-item">
              <span className="step-num-badge">1</span>
              <p className="step-text">Admin reviews your details to match you with resident archives.</p>
            </div>

            <div className="step-item">
              <span className="step-num-badge">2</span>
              <p className="step-text">You'll receive an email notification once approval is complete.</p>
            </div>

            <div className="step-item">
              <span className="step-num-badge">3</span>
              <p className="step-text">Log in to explore and unlock access to all hub community features.</p>
            </div>
          </div>
        </div>

        {/* Primary CTA Button */}
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
            <button
              type="button"
              className="btn-pending-primary"
              onClick={() => navigate('/login')}
            >
              <span>Back to Login</span>
            </button>
          )}
        </div>

        {/* Support Footer */}
        <div className="pending-card-footer">
          <span>Need assistance? Contact </span>
          <a href="mailto:bpstwintowers.society@gmail.com" className="pending-support-link">
            bpstwintowers.society@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
};
