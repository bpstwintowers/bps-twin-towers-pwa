import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
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
      console.error('Error fetching registrations:', err);
      setError('Failed to load registration requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getMembershipLabel = (type: string) => {
    switch (type) {
      case 'Primary Resident': return 'Owner';
      case 'Family Member': return 'Family Member';
      case 'Tenant': return 'Tenant';
      case 'Staff': return 'Staff';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="status-container">
        <div className="registration-loading">
          <div className="spinner" />
          <span>Loading registrations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="status-container">
      <div className="status-card glass-panel animate-fade-in">
        <div className="status-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn-outline"
              onClick={() => navigate('/')}
              style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)' }}
            >
              <ArrowLeft size={18} />
            </button>
            <h2>My Registrations</h2>
          </div>
          <button
            className="btn-outline"
            onClick={fetchRegistrations}
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)' }}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {error && (
          <div className="form-error">
            <span>{error}</span>
          </div>
        )}

        {registrations.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
            <Clock size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
            <p>No registration requests found.</p>
            <button
              className="btn-primary"
              onClick={() => navigate('/register')}
              style={{ marginTop: '1rem' }}
            >
              Register Now
            </button>
          </div>
        )}

        {registrations.map((reg) => (
          <div key={reg.id} className="request-card">
            <div className="request-card-header">
              <span className="request-flat-name">
                {reg.flat_number || 'Flat'}
                {reg.block_name ? ` (Block ${reg.block_name})` : ''}
              </span>
              <StatusBadge status={reg.status} />
            </div>
            <div className="request-card-details">
              <span className="request-detail-label">Type</span>
              <span className="request-detail-value">{getMembershipLabel(reg.requested_membership_type)}</span>

              <span className="request-detail-label">Relationship</span>
              <span className="request-detail-value">{reg.relationship}</span>

              <span className="request-detail-label">Submitted</span>
              <span className="request-detail-value">{formatDate(reg.created_at)}</span>

              {reg.reviewed_at && (
                <>
                  <span className="request-detail-label">Reviewed</span>
                  <span className="request-detail-value">{formatDate(reg.reviewed_at)}</span>
                </>
              )}
            </div>

            {reg.status === 'Correction Required' && reg.correction_message && (
              <div className="correction-banner">
                <strong>Correction Required:</strong> {reg.correction_message}
              </div>
            )}

            {reg.status === 'Rejected' && reg.rejection_reason && (
              <div className="rejection-banner">
                <strong>Rejected:</strong> {reg.rejection_reason}
              </div>
            )}
          </div>
        ))}

        {registrations.length > 0 && !registrations.some(r => r.status === 'Pending' || r.status === 'Approved') && (
          <button
            className="btn-primary"
            onClick={() => navigate('/register')}
            style={{ width: '100%', marginTop: '0.75rem' }}
          >
            Submit New Registration
          </button>
        )}
      </div>
    </div>
  );
};
