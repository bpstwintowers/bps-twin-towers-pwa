import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Wrench,
  Camera,
  Upload,
  AlertTriangle,
  Send,
  CheckCircle2,
} from 'lucide-react';
import {
  fetchComplaintCategories,
  createComplaint,
  uploadComplaintAttachment,
  type ComplaintCategoryItem,
  type ComplaintPriority,
  type LocationType,
  type CreateComplaintPayload,
} from '../../services/supabase/complaintService';
import { fetchActiveFacilities, type FacilityItem } from '../../services/supabase/facilityService';
import { resolveUserAccess, type AccessInfo } from '../../services/supabase/registrationService';
import './ComplaintList.css';

export const ComplaintForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useState<ComplaintCategoryItem[]>([]);
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [access, setAccess] = useState<AccessInfo[]>([]);
  const [selectedFlatId, setSelectedFlatId] = useState('');

  const [category, setCategory] = useState('Plumbing');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [locationType, setLocationType] = useState<LocationType>('My Flat');
  const [locationDetail, setLocationDetail] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [catData, facData, accData] = await Promise.all([
          fetchComplaintCategories(),
          fetchActiveFacilities(),
          resolveUserAccess(),
        ]);

        setCategories(catData);
        setFacilities(facData);
        setAccess(accData);

        if (accData.length > 0) setSelectedFlatId(accData[0].flat_id);
        if (catData.length > 0) setCategory(catData[0].name);

        // Check if redirected from facility details
        const urlFacId = searchParams.get('facilityId');
        const urlFacName = searchParams.get('facilityName');
        if (urlFacId) {
          setLocationType('Facility');
          setSelectedFacilityId(urlFacId);
          setCategory('Facility');
          setTitle(`Maintenance Issue - ${urlFacName || 'Facility'}`);
        }
      } catch (err) {
        console.error('Error initializing complaint form:', err);
      }
    };
    init();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide a complaint subject and detailed description.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateComplaintPayload = {
        flat_id: locationType === 'My Flat' ? selectedFlatId : undefined,
        category,
        title: title.trim(),
        description: description.trim(),
        priority,
        location_type: locationType,
        location_detail: locationDetail.trim() || undefined,
        facility_id: locationType === 'Facility' && selectedFacilityId ? selectedFacilityId : undefined,
      };

      const res = await createComplaint(payload);

      // Upload attachment if provided
      if (selectedFile && res.complaint_id) {
        try {
          await uploadComplaintAttachment(res.complaint_id, selectedFile);
        } catch (uploadErr) {
          console.error('Attachment upload failed:', uploadErr);
        }
      }

      navigate(`/complaints/${res.complaint_id}`);
    } catch (err: any) {
      console.error('Error creating complaint:', err);
      setError(err.message || 'Failed to submit complaint.');
      setSubmitting(false);
    }
  };

  return (
    <div className="complaints-container">
      <header className="complaints-header">
        <div className="complaints-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/complaints')}
              className="btn-outline"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Wrench size={18} style={{ color: '#f59e0b' }} />
                Log a Complaint / Helpdesk Ticket
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                BPS Twin Towers Facility & Maintenance Support
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="complaints-content animate-fade-in">
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.5rem',
            maxWidth: '640px',
            margin: '0 auto',
          }}
        >
          {error && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#f87171',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Category & Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Issue Category *
                </label>
                <select
                  className="admin-search-input"
                  style={{ width: '100%', padding: '0.55rem' }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} (SLA: {c.default_sla_hours}h)
                    </option>
                  ))}
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Lift & Elevator">Lift & Elevator</option>
                  <option value="Water Supply">Water Supply</option>
                  <option value="Housekeeping & Cleaning">Housekeeping & Cleaning</option>
                  <option value="Security & Gate">Security & Gate</option>
                  <option value="Common Area">Common Area</option>
                  <option value="Facility">Facility</option>
                  <option value="Noise & Disturbance">Noise & Disturbance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Priority Level *
                </label>
                <select
                  className="admin-search-input"
                  style={{ width: '100%', padding: '0.55rem' }}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                >
                  <option value="Low">Low (Target: 72 hours)</option>
                  <option value="Medium">Medium (Target: 48 hours)</option>
                  <option value="High">High (Target: 24 hours)</option>
                  <option value="Urgent">Urgent / Emergency (Target: 4 hours)</option>
                </select>
              </div>
            </div>

            {/* Location Type & Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Location Type *
                </label>
                <select
                  className="admin-search-input"
                  style={{ width: '100%', padding: '0.55rem' }}
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value as LocationType)}
                >
                  <option value="My Flat">Inside My Flat</option>
                  <option value="Common Area">Tower Common Area / Lobby</option>
                  <option value="Facility">Society Facility</option>
                  <option value="Parking">Basement / Parking</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {locationType === 'My Flat' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                    Select Flat *
                  </label>
                  <select
                    className="admin-search-input"
                    style={{ width: '100%', padding: '0.55rem' }}
                    value={selectedFlatId}
                    onChange={(e) => setSelectedFlatId(e.target.value)}
                  >
                    {access.map((a) => (
                      <option key={a.flat_id} value={a.flat_id}>
                        Flat {a.flat_number} ({a.block_name})
                      </option>
                    ))}
                  </select>
                </div>
              ) : locationType === 'Facility' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                    Select Facility
                  </label>
                  <select
                    className="admin-search-input"
                    style={{ width: '100%', padding: '0.55rem' }}
                    value={selectedFacilityId}
                    onChange={(e) => setSelectedFacilityId(e.target.value)}
                  >
                    <option value="">Select Facility...</option>
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                    Location Detail
                  </label>
                  <input
                    type="text"
                    className="admin-search-input"
                    style={{ width: '100%' }}
                    placeholder="e.g. Block A 5th Floor Lift Lobby"
                    value={locationDetail}
                    onChange={(e) => setLocationDetail(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Title */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Subject / Title *
              </label>
              <input
                type="text"
                className="admin-search-input"
                style={{ width: '100%' }}
                placeholder="e.g. Kitchen tap water leakage / Lift button not working"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Detailed Description */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Detailed Description *
              </label>
              <textarea
                rows={4}
                className="admin-search-input"
                style={{ width: '100%' }}
                placeholder="Explain the problem clearly, when it started, and any specific technician access instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Photo / Attachment */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Attach Photo / Document (Optional)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="admin-search-input"
                style={{ width: '100%', padding: '0.45rem' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Accepted: JPG, PNG, WEBP, PDF (Max 5MB). Files are securely stored in private society storage.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn-outline" onClick={() => navigate('/complaints')} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting} style={{ gap: '0.35rem' }}>
                <Send size={15} />
                {submitting ? 'Submitting Ticket...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
