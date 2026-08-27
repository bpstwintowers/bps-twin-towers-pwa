import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, Users, UserCheck, Briefcase, ShieldCheck, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Stepper } from '../../components/ui/Stepper';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  searchFlats,
  submitRegistration,
  getFlatOwnerInfo,
  type FlatSearchResult,
  type RegistrationPayload,
} from '../../services/supabase/registrationService';
import './RegistrationFlow.css';

const STEPS = ['Select Flat', 'Membership', 'Details', 'Review'];

interface MembershipOption {
  value: RegistrationPayload['requested_membership_type'];
  label: string;
  description: string;
  icon: React.ReactNode;
  relationship: string;
  resident_type?: string;
}

const MEMBERSHIP_OPTIONS: MembershipOption[] = [
  {
    value: 'Primary Resident',
    label: 'Owner',
    description: 'I own this flat',
    icon: <Home size={20} />,
    relationship: 'Self',
    resident_type: 'Owner',
  },
  {
    value: 'Family Member',
    label: 'Family Member',
    description: 'Family of the owner',
    icon: <Users size={20} />,
    relationship: 'Family',
  },
  {
    value: 'Tenant',
    label: 'Tenant',
    description: 'Renting this flat',
    icon: <UserCheck size={20} />,
    relationship: 'Tenant',
    resident_type: 'Tenant',
  },
  {
    value: 'Staff',
    label: 'Staff',
    description: 'Domestic staff',
    icon: <Briefcase size={20} />,
    relationship: 'Staff',
    resident_type: 'Staff',
  },
];

const RELATIONSHIP_OPTIONS = [
  { value: 'Self', label: 'Self' },
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Parent', label: 'Parent' },
  { value: 'Child', label: 'Son / Daughter' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Other', label: 'Other' },
];

export const RegistrationFlow: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Flat selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FlatSearchResult[]>([]);
  const [selectedFlat, setSelectedFlat] = useState<FlatSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState<{ owner_registered: boolean; owner_email: string | null } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 2: Membership
  const [selectedMembership, setSelectedMembership] = useState<MembershipOption | null>(null);

  // Step 3: Details
  const [mobile, setMobile] = useState('');
  const [relationship, setRelationship] = useState('');
  const [residentSince, setResidentSince] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced flat search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 1) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const results = await searchFlats(query);
        setSearchResults(results);
        setShowResults(true);
      } catch (err: any) {
        console.error('Search error:', err);
        setError('Failed to search flats. Please try again.');
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  // When flat is selected, get owner info
  const handleSelectFlat = async (flat: FlatSearchResult) => {
    setSelectedFlat(flat);
    setSearchQuery(flat.flat_number);
    setShowResults(false);
    setError(null);

    try {
      const info = await getFlatOwnerInfo(flat.flat_id);
      setOwnerInfo(info);
    } catch (err) {
      console.error('Error getting owner info:', err);
    }
  };

  const handleChangeFlat = () => {
    setSelectedFlat(null);
    setOwnerInfo(null);
    setSearchQuery('');
    setSelectedMembership(null);
    setCurrentStep(0);
  };

  const handleSelectMembership = (option: MembershipOption) => {
    setSelectedMembership(option);
    setError(null);

    // Pre-set relationship
    if (option.value === 'Primary Resident') {
      setRelationship('Self');
    } else if (option.value === 'Tenant') {
      setRelationship('Tenant');
    } else if (option.value === 'Staff') {
      setRelationship('Staff');
    } else {
      setRelationship('');
    }
  };

  const canProceedStep0 = selectedFlat !== null;
  const canProceedStep1 = selectedMembership !== null;
  const canProceedStep2 = (() => {
    if (!selectedMembership) return false;
    if (!mobile.trim()) return false;
    if (selectedMembership.value === 'Family Member' && !relationship) return false;
    return true;
  })();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFlat || !selectedMembership) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload: RegistrationPayload = {
        flat_id: selectedFlat.flat_id,
        requested_membership_type: selectedMembership.value,
        relationship: selectedMembership.value === 'Family Member' ? relationship : selectedMembership.relationship,
        mobile: mobile.trim() || undefined,
        resident_type: selectedMembership.resident_type,
        resident_since: residentSince || undefined,
        remarks: remarks.trim() || undefined,
      };

      await submitRegistration(payload);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render Steps ---

  const renderStep0 = () => (
    <div className="animate-fade-in">
      <div className="form-section">
        <div className="form-section-title">Find your flat</div>
        {selectedFlat ? (
          <div className="selected-flat">
            <div className="selected-flat-info">
              <div className="selected-flat-icon">
                <Home size={18} />
              </div>
              <div className="selected-flat-details">
                <h3>{selectedFlat.flat_number}</h3>
                <p>{selectedFlat.bhk || 'Flat'}</p>
              </div>
            </div>
            <button className="change-flat-btn" onClick={handleChangeFlat}>
              Change
            </button>
          </div>
        ) : (
          <div className="flat-search-wrapper" ref={searchRef}>
            <Search size={16} className="flat-search-icon" />
            <input
              type="text"
              className="flat-search-input"
              placeholder="Type flat number (e.g. A101, B205)..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              autoFocus
            />
            {searching && (
              <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              </div>
            )}
            {showResults && searchResults.length > 0 && (
              <div className="flat-results">
                {searchResults.map((flat) => (
                  <div
                    key={flat.flat_id}
                    className="flat-result-item"
                    onClick={() => handleSelectFlat(flat)}
                  >
                    <span className="flat-result-number">{flat.flat_number}</span>
                    <div className="flat-result-meta">
                      {flat.bhk && <span>{flat.bhk}</span>}
                      {flat.owner_registered && (
                        <span className="flat-result-badge">Owner registered</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showResults && !searching && searchResults.length === 0 && searchQuery.trim().length > 0 && (
              <div className="flat-results">
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No flats found for "{searchQuery}"
                </div>
              </div>
            )}
          </div>
        )}

        {selectedFlat && ownerInfo && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            {ownerInfo.owner_registered ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
                Owner registered
                {ownerInfo.owner_email && <span>({ownerInfo.owner_email})</span>}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <AlertCircle size={14} style={{ color: 'var(--warning)' }} />
                No owner registered for this flat yet
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="animate-fade-in">
      <div className="form-section">
        <div className="form-section-title">How are you associated with this flat?</div>
        <div className="membership-grid">
          {MEMBERSHIP_OPTIONS.map((option) => {
            // If owner is already registered and user tries to select owner
            const isOwnerBlocked = option.value === 'Primary Resident' && ownerInfo?.owner_registered;

            return (
              <div
                key={option.value}
                className={`membership-option ${selectedMembership?.value === option.value ? 'selected' : ''} ${isOwnerBlocked ? 'disabled' : ''}`}
                onClick={() => !isOwnerBlocked && handleSelectMembership(option)}
                style={isOwnerBlocked ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                title={isOwnerBlocked ? 'This flat already has a registered owner' : undefined}
              >
                <div className="membership-option-icon">{option.icon}</div>
                <span className="membership-option-label">{option.label}</span>
                <span className="membership-option-desc">
                  {isOwnerBlocked ? 'Already registered' : option.description}
                </span>
              </div>
            );
          })}
        </div>
        {selectedMembership && ownerInfo && !ownerInfo.owner_registered && selectedMembership.value !== 'Primary Resident' && (
          <div className="form-warning">
            <AlertCircle size={16} />
            <span>This flat has no registered owner. Consider registering as the owner first.</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (!selectedMembership) return null;

    return (
      <div className="animate-fade-in">
        <div className="form-section">
          <div className="form-section-title">Your details</div>

          <div className="form-group">
            <label className="form-label">Mobile Number *</label>
            <input
              type="tel"
              className="form-input"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              maxLength={10}
            />
            <p className="form-hint">10-digit mobile number</p>
          </div>

          {selectedMembership.value === 'Family Member' && (
            <div className="form-group">
              <label className="form-label">Relationship *</label>
              <select
                className="form-input"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                style={{
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  paddingRight: '2rem',
                }}
              >
                <option value="" disabled>Select relationship</option>
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-secondary)' }}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedMembership.value === 'Primary Resident' && (
            <div className="form-group">
              <label className="form-label">Resident Since</label>
              <input
                type="date"
                className="form-input"
                value={residentSince}
                onChange={(e) => setResidentSince(e.target.value)}
              />
              <p className="form-hint">Optional — when you started living here</p>
            </div>
          )}

          {selectedMembership.value === 'Tenant' && (
            <>
              <div className="form-group">
                <label className="form-label">Lease Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Lease End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <p className="form-hint">Optional</p>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Remarks</label>
            <textarea
              className="form-input"
              placeholder="Any additional information..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    if (!selectedFlat || !selectedMembership) return null;

    return (
      <div className="animate-fade-in">
        <div className="review-section">
          <div className="form-section-title">Review your registration</div>

          <div className="review-item">
            <span className="review-label">Flat</span>
            <span className="review-value">{selectedFlat.flat_number}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Membership</span>
            <span className="review-value">{selectedMembership.label}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Relationship</span>
            <span className="review-value">
              {selectedMembership.value === 'Family Member' 
                ? RELATIONSHIP_OPTIONS.find(r => r.value === relationship)?.label || relationship
                : selectedMembership.relationship}
            </span>
          </div>
          <div className="review-item">
            <span className="review-label">Mobile</span>
            <span className="review-value">{mobile || '—'}</span>
          </div>
          {residentSince && (
            <div className="review-item">
              <span className="review-label">Resident Since</span>
              <span className="review-value">{residentSince}</span>
            </div>
          )}
          {startDate && (
            <div className="review-item">
              <span className="review-label">Lease Start</span>
              <span className="review-value">{startDate}</span>
            </div>
          )}
          {endDate && (
            <div className="review-item">
              <span className="review-label">Lease End</span>
              <span className="review-value">{endDate}</span>
            </div>
          )}
          {remarks && (
            <div className="review-item">
              <span className="review-label">Remarks</span>
              <span className="review-value" style={{ maxWidth: '60%', wordBreak: 'break-word' }}>{remarks}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="success-container animate-fade-in">
      <div className="success-icon">
        <CheckCircle2 size={32} />
      </div>
      <h2 className="success-title">Registration Submitted</h2>
      <p className="success-message">
        Your registration has been submitted for approval. You will be notified once it is reviewed.
      </p>
      <div className="success-details">
        <div className="review-item">
          <span className="review-label">Status</span>
          <StatusBadge status="Pending" />
        </div>
        <div className="review-item">
          <span className="review-label">Flat</span>
          <span className="review-value">{selectedFlat?.flat_number}</span>
        </div>
        <div className="review-item">
          <span className="review-label">Membership</span>
          <span className="review-value">{selectedMembership?.label}</span>
        </div>
        <div className="review-item">
          <span className="review-label">Submitted</span>
          <span className="review-value">{new Date().toLocaleDateString()}</span>
        </div>
      </div>
      <div className="registration-actions" style={{ marginTop: '1.5rem' }}>
        <button className="btn-primary" onClick={() => navigate('/')}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );

  // --- Main Render ---

  if (submitted) {
    return (
      <div className="registration-container">
        <div className="registration-card glass-panel animate-fade-in">
          {renderSuccess()}
        </div>
      </div>
    );
  }

  return (
    <div className="registration-container">
      <div className="registration-card glass-panel animate-fade-in">
        <div className="registration-header">
          <h1>Register as a Resident</h1>
          <p>Join the BPS Twin Towers community</p>
        </div>

        <Stepper steps={STEPS} currentStep={currentStep} />

        {error && (
          <div className="form-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {currentStep === 0 && renderStep0()}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        <div className="registration-actions">
          {currentStep > 0 && (
            <button className="btn-outline" onClick={handleBack} disabled={submitting}>
              <ArrowLeft size={16} />
              Back
            </button>
          )}
          {currentStep === 0 && (
            <button className="btn-outline" onClick={() => navigate('/')} style={{ flex: 'none', padding: '0.75rem' }}>
              <ArrowLeft size={16} />
            </button>
          )}

          {currentStep < STEPS.length - 1 && (
            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={
                (currentStep === 0 && !canProceedStep0) ||
                (currentStep === 1 && !canProceedStep1) ||
                (currentStep === 2 && !canProceedStep2)
              }
            >
              Continue
            </button>
          )}

          {currentStep === STEPS.length - 1 && (
            <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Submitting...
                </>
              ) : (
                'Submit Registration'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
