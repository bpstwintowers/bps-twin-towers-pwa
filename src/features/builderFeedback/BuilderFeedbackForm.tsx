import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import {
  Star,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Building,
  ArrowRight,
  Share2,
  Trash2,
  Info,
  Check,
  Award,
} from 'lucide-react';
import type {
  BuilderReview,
  BuilderFeedbackConfig,
} from '../../types/builderFeedback';
import {
  REVIEW_TAGS,
  DEFAULT_BUILDER_CONFIG,
} from '../../types/builderFeedback';
import {
  submitBuilderReview,
  fetchAllReviews,
  getBuilderConfig,
  computeReviewAnalytics,
  markPostedToGoogle,
} from '../../services/builderFeedbackService';
import { ReviewCardModal } from './ReviewCardModal';
import './BuilderFeedbackForm.css';

const RATING_DESCRIPTIONS: { [key: number]: string } = {
  1: 'Terrible - Serious quality or handover issues',
  2: 'Poor - Did not meet commitments',
  3: 'Average - Met basic expectations, has room to improve',
  4: 'Very Good - Impressive quality and smooth experience',
  5: 'Outstanding - 5-Star luxury build and flawless service!',
};

export const BuilderFeedbackForm: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [config, setConfig] = useState<BuilderFeedbackConfig>(getBuilderConfig());
  const [existingReviews, setExistingReviews] = useState<BuilderReview[]>([]);
  const [analytics, setAnalytics] = useState(computeReviewAnalytics([]));

  // Form state
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [residentName, setResidentName] = useState<string>('');
  const [flatNo, setFlatNo] = useState<string>('');
  const [tower, setTower] = useState<'Tower A' | 'Tower B'>('Tower A');
  const [handoverYear, setHandoverYear] = useState<string>('2024');
  const [headline, setHeadline] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Solid Construction',
    'Timely Handover',
  ]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Aspect Ratings (1-5)
  const [aspects, setAspects] = useState({
    constructionQuality: 5,
    amenitiesQuality: 5,
    handoverExperience: 5,
    communication: 4,
    valueForMoney: 5,
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedReview, setSubmittedReview] = useState<BuilderReview | null>(null);
  const [selectedReviewForCard, setSelectedReviewForCard] = useState<BuilderReview | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'community'>('form');

  useEffect(() => {
    // Load current user profile
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setProfile(data);
              setResidentName(data.full_name || data.name || '');
              if (data.flat_number) setFlatNo(data.flat_number);
              if (data.tower) setTower(data.tower === 'Tower B' ? 'Tower B' : 'Tower A');
            }
          });
      }
    });

    // Load reviews
    loadReviewsData();
  }, []);

  const loadReviewsData = async () => {
    const list = await fetchAllReviews();
    setExistingReviews(list);
    setAnalytics(computeReviewAnalytics(list));
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const readers = Array.from(files).map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((base64Photos) => {
      setPhotos((prev) => [...prev, ...base64Photos].slice(0, 4)); // max 4 photos
      setIsUploading(false);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!flatNo.trim()) {
      alert('Please enter your flat number');
      return;
    }
    if (!comment.trim()) {
      alert('Please provide your review comments');
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewPayload = {
        residentId: profile?.id || 'guest-' + Date.now(),
        residentName: residentName.trim(),
        flatNo: flatNo.trim(),
        tower,
        userEmail: profile?.email || undefined,
        rating,
        headline: headline.trim() || `My experience living at ${config.societyName}`,
        comment: comment.trim(),
        aspectRatings: aspects,
        photos,
        tags: selectedTags,
        isVerifiedResident: true,
        handoverYear,
        postedToGoogle: false,
        status: 'approved' as const,
      };

      const saved = await submitBuilderReview(reviewPayload);
      setSubmittedReview(saved);
      setSelectedReviewForCard(saved);
      await loadReviewsData();
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="builder-feedback-container animate-fade-in">
      {/* Hero Banner */}
      <div className="builder-hero-banner">
        <div className="hero-content">
          <div className="flex items-center gap-2 mb-2">
            <span className="hero-pill">
              <Building size={14} />
              <span>Builder Ratings & Reviews</span>
            </span>
            <span className="hero-google-pill">
              <span className="text-blue-500 font-bold">G</span>
              <span className="text-red-500 font-bold">o</span>
              <span className="text-yellow-500 font-bold">o</span>
              <span className="text-blue-500 font-bold">g</span>
              <span className="text-green-500 font-bold">l</span>
              <span className="text-red-500 font-bold">e</span>
              <span className="ml-1 text-slate-700 dark:text-slate-200">Verified Sync</span>
            </span>
          </div>

          <h1 className="hero-title">
            Share Your Experience with {config.builderName}
          </h1>
          <p className="hero-subtitle">
            Help prospective home-buyers and fellow residents by rating the construction quality, handover transparency, and community living at {config.societyName}.
          </p>

          {/* Overall Score Badge */}
          <div className="hero-stats-row">
            <div className="stat-card">
              <div className="stat-stars">
                <span className="stat-big-num">{analytics.averageRating}</span>
                <div className="stat-star-icons">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={18}
                      className={
                        s <= Math.round(analytics.averageRating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }
                    />
                  ))}
                </div>
              </div>
              <div className="stat-label">
                Average Resident Rating ({analytics.totalReviews} reviews)
              </div>
            </div>

            <div className="stat-card verified-stat-card">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-emerald-500" size={24} />
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  100% Verified
                </span>
              </div>
              <div className="stat-label">From registered flat owners & tenants</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          <MessageSquare size={18} />
          <span>Write Builder Review</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'community' ? 'active' : ''}`}
          onClick={() => setActiveTab('community')}
        >
          <Award size={18} />
          <span>Community Reviews ({existingReviews.length})</span>
        </button>
      </div>

      {activeTab === 'form' ? (
        /* Review Form */
        <div className="form-card-wrapper animate-slide-up">
          <form onSubmit={handleSubmit} className="feedback-form">
            {/* 1. Star Rating Selection */}
            <div className="form-section rating-section">
              <label className="section-label">
                Overall Builder Rating <span className="text-red-500">*</span>
              </label>
              <div className="star-picker-container">
                <div className="star-icons-row">
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <button
                      key={starValue}
                      type="button"
                      className="star-btn"
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starValue)}
                      aria-label={`${starValue} stars`}
                    >
                      <Star
                        size={42}
                        className={`transition-transform duration-150 hover:scale-110 ${
                          (hoverRating || rating) >= starValue
                            ? 'text-amber-400 fill-amber-400 drop-shadow'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="rating-desc-pill">
                  {RATING_DESCRIPTIONS[hoverRating || rating]}
                </div>
              </div>
            </div>

            {/* 2. Resident Details */}
            <div className="form-section grid-2-col">
              <div className="input-group">
                <label className="field-label">
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Chandra"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2-col-inner">
                <div className="input-group">
                  <label className="field-label">
                    Tower <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="form-input"
                    value={tower}
                    onChange={(e) => setTower(e.target.value as any)}
                  >
                    <option value="Tower A">Tower A</option>
                    <option value="Tower B">Tower B</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="field-label">
                    Flat No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 504"
                    value={flatNo}
                    onChange={(e) => setFlatNo(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* 3. Aspect Rating Sliders */}
            <div className="form-section aspect-ratings-box">
              <h3 className="aspects-title">Detailed Dimension Ratings (1 to 5)</h3>
              <div className="aspects-grid">
                <div className="aspect-row">
                  <span className="aspect-name">Construction & Materials</span>
                  <div className="aspect-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={20}
                        onClick={() => setAspects({ ...aspects, constructionQuality: s })}
                        className={`cursor-pointer ${
                          aspects.constructionQuality >= s
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="aspect-row">
                  <span className="aspect-name">Clubhouse & Amenities</span>
                  <div className="aspect-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={20}
                        onClick={() => setAspects({ ...aspects, amenitiesQuality: s })}
                        className={`cursor-pointer ${
                          aspects.amenitiesQuality >= s
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="aspect-row">
                  <span className="aspect-name">Handover & Snag Rectification</span>
                  <div className="aspect-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={20}
                        onClick={() => setAspects({ ...aspects, handoverExperience: s })}
                        className={`cursor-pointer ${
                          aspects.handoverExperience >= s
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="aspect-row">
                  <span className="aspect-name">Builder Communication & Timelines</span>
                  <div className="aspect-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={20}
                        onClick={() => setAspects({ ...aspects, communication: s })}
                        className={`cursor-pointer ${
                          aspects.communication >= s
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="aspect-row">
                  <span className="aspect-name">Overall Value for Money</span>
                  <div className="aspect-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={20}
                        onClick={() => setAspects({ ...aspects, valueForMoney: s })}
                        className={`cursor-pointer ${
                          aspects.valueForMoney >= s
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Review Headline & Detailed Comment */}
            <div className="form-section">
              <div className="input-group mb-3">
                <label className="field-label">Headline / Short Summary</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Wonderful living experience and solid structure!"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="field-label">
                  Your Detailed Review <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Describe your journey with BPS Developers—construction quality, finishing, clubhouse facilities, handover timelines, and community life..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 5. Highlight Tags */}
            <div className="form-section">
              <label className="field-label mb-2">Key Highlights (Select all that apply)</label>
              <div className="tags-flex-wrap">
                {REVIEW_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`tag-toggle-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleTagToggle(tag)}
                    >
                      {isSelected ? <Check size={14} /> : null}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Photo Uploads */}
            <div className="form-section">
              <label className="field-label mb-1">
                Attach Photos (Flat handover, interior, elevation, amenities)
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Photos make your Google review authentic and visually striking.
              </p>

              <div className="photos-uploader-container">
                <label className="photo-upload-dropzone">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={photos.length >= 4 || isUploading}
                  />
                  <Upload size={24} className="text-slate-400 mb-1" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {isUploading ? 'Loading photos...' : 'Click to upload photos'}
                  </span>
                  <span className="text-xs text-slate-500">PNG, JPG up to 4 images</span>
                </label>

                {/* Photo Previews */}
                {photos.map((src, idx) => (
                  <div key={idx} className="photo-thumbnail-card">
                    <img src={src} alt={`Upload ${idx + 1}`} className="photo-thumb-img" />
                    <button
                      type="button"
                      className="btn-remove-thumb"
                      onClick={() => handleRemovePhoto(idx)}
                      title="Remove photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-submit-footer">
              <button
                type="submit"
                className="btn-submit-review"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Submitting Review...</span>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>Submit Review & Generate Google Card</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Community Reviews Feed */
        <div className="community-reviews-grid animate-slide-up">
          {existingReviews.map((rev) => (
            <div key={rev.id} className="community-review-card">
              <div className="card-header">
                <div className="flex items-center gap-3">
                  <div className="rev-avatar">
                    {rev.residentName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="rev-name">{rev.residentName}</h4>
                    <p className="rev-flat">
                      {rev.tower} • Flat {rev.flatNo}
                    </p>
                  </div>
                </div>

                <div className="rev-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      className={
                        s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                      }
                    />
                  ))}
                </div>
              </div>

              {rev.headline && <h5 className="rev-headline">"{rev.headline}"</h5>}
              <p className="rev-comment">{rev.comment}</p>

              {rev.tags && rev.tags.length > 0 && (
                <div className="rev-tags-row">
                  {rev.tags.slice(0, 3).map((t, i) => (
                    <span key={i} className="rev-tag-chip">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {rev.photos && rev.photos.length > 0 && (
                <div className="rev-photos-row">
                  {rev.photos.slice(0, 2).map((p, i) => (
                    <img key={i} src={p} alt="Review attachment" className="rev-thumb" />
                  ))}
                </div>
              )}

              <div className="card-footer">
                <span className="text-xs text-slate-500">
                  {new Date(rev.createdAt).toLocaleDateString()}
                </span>
                <button
                  className="btn-open-card-modal"
                  onClick={() => setSelectedReviewForCard(rev)}
                >
                  <Share2 size={14} />
                  <span>Google Card & Post</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Card Modal */}
      {selectedReviewForCard && (
        <ReviewCardModal
          review={selectedReviewForCard}
          onClose={() => setSelectedReviewForCard(null)}
          onPostedToGoogle={() => {
            markPostedToGoogle(selectedReviewForCard.id);
            loadReviewsData();
          }}
        />
      )}
    </div>
  );
};
