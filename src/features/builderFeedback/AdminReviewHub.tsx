import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  ShieldCheck,
  Download,
  Share2,
  Filter,
  Search,
  CheckCircle2,
  Sliders,
  ExternalLink,
  MessageSquare,
  FileSpreadsheet,
  Settings,
  Sparkles,
  TrendingUp,
  Image as ImageIcon,
  Check,
  Copy,
} from 'lucide-react';
import type {
  BuilderReview,
  BuilderFeedbackConfig,
} from '../../types/builderFeedback';
import {
  getBuilderConfig,
  saveBuilderConfig,
  fetchAllReviews,
  updateReviewStatus,
  markPostedToGoogle,
  computeReviewAnalytics,
} from '../../services/builderFeedbackService';
import { ReviewCardModal } from './ReviewCardModal';
import { downloadReviewCardAsPng } from '../../utils/reviewCardCanvas';
import './AdminReviewHub.css';

export const AdminReviewHub: React.FC = () => {
  const [reviews, setReviews] = useState<BuilderReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | '5stars' | 'featured' | 'with-photos' | 'not-posted'>('all');
  const [towerFilter, setTowerFilter] = useState<'all' | 'Tower A' | 'Tower B'>('all');
  const [selectedReviewForCard, setSelectedReviewForCard] = useState<BuilderReview | null>(null);

  // Builder Config Settings Modal
  const [config, setConfig] = useState<BuilderFeedbackConfig>(getBuilderConfig());
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempGoogleUrl, setTempGoogleUrl] = useState(config.googleReviewUrl);
  const [tempBuilderName, setTempBuilderName] = useState(config.builderName);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const list = await fetchAllReviews();
    setReviews(list);
    setLoading(false);
  };

  const analytics = useMemo(() => computeReviewAnalytics(reviews), [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Search
      const matchSearch =
        r.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.flatNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.headline && r.headline.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      // Tower
      if (towerFilter !== 'all' && r.tower !== towerFilter) return false;

      // Status
      if (statusFilter === '5stars' && r.rating !== 5) return false;
      if (statusFilter === 'featured' && r.status !== 'featured') return false;
      if (statusFilter === 'with-photos' && (!r.photos || r.photos.length === 0)) return false;
      if (statusFilter === 'not-posted' && r.postedToGoogle) return false;

      return true;
    });
  }, [reviews, searchTerm, statusFilter, towerFilter]);

  const handleToggleFeatured = async (review: BuilderReview) => {
    const nextStatus = review.status === 'featured' ? 'approved' : 'featured';
    await updateReviewStatus(review.id, nextStatus);
    await loadData();
  };

  const handleSaveConfig = () => {
    const updated = {
      ...config,
      googleReviewUrl: tempGoogleUrl,
      builderName: tempBuilderName,
    };
    saveBuilderConfig(updated);
    setConfig(updated);
    setIsConfigOpen(false);
  };

  const handleExportCsv = () => {
    if (!reviews.length) return;
    const headers = [
      'ID',
      'Resident Name',
      'Tower',
      'Flat',
      'Overall Rating',
      'Construction Quality',
      'Amenities',
      'Handover Experience',
      'Communication',
      'Value For Money',
      'Headline',
      'Comment',
      'Posted To Google',
      'Status',
      'Date',
    ];

    const rows = reviews.map((r) => [
      r.id,
      `"${r.residentName.replace(/"/g, '""')}"`,
      r.tower,
      r.flatNo,
      r.rating,
      r.aspectRatings?.constructionQuality || r.rating,
      r.aspectRatings?.amenitiesQuality || r.rating,
      r.aspectRatings?.handoverExperience || r.rating,
      r.aspectRatings?.communication || r.rating,
      r.aspectRatings?.valueForMoney || r.rating,
      `"${(r.headline || '').replace(/"/g, '""')}"`,
      `"${r.comment.replace(/"/g, '""')}"`,
      r.postedToGoogle ? 'Yes' : 'No',
      r.status,
      new Date(r.createdAt).toISOString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bps_builder_reviews_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-review-hub-container animate-fade-in">
      {/* Top Header */}
      <div className="hub-top-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="hub-badge">MANAGEMENT CONSOLE</span>
            <span className="google-sync-tag">
              <span className="text-blue-500 font-bold">G</span>
              <span className="text-red-500 font-bold">o</span>
              <span className="text-yellow-500 font-bold">o</span>
              <span className="text-blue-500 font-bold">g</span>
              <span className="text-green-500 font-bold">l</span>
              <span className="text-red-500 font-bold">e</span>
              <span className="ml-1 text-slate-700">Review Generator</span>
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Builder Feedback & Review Image Studio
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Moderate resident reviews, inspect dimension analytics, and generate high-resolution Google Review image cards to upload on Google Business.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-action-outline" onClick={handleExportCsv}>
            <FileSpreadsheet size={16} />
            <span>Export CSV</span>
          </button>
          <button className="btn-action-primary" onClick={() => setIsConfigOpen(true)}>
            <Settings size={16} />
            <span>Google Link Settings</span>
          </button>
        </div>
      </div>

      {/* Analytics Scorecards */}
      <div className="analytics-scorecard-grid">
        {/* Main Rating Scorecard */}
        <div className="scorecard-main">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Overall Builder Rating
            </span>
            <span className="badge-positive">Verified Residents</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="score-big">{analytics.averageRating}</span>
            <div className="flex flex-col">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={20}
                    className={
                      s <= Math.round(analytics.averageRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500 mt-1">
                Based on {analytics.totalReviews} total resident submissions
              </span>
            </div>
          </div>

          {/* Rating distribution mini-bars */}
          <div className="rating-dist-bars mt-4">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = analytics.ratingDistribution[stars] || 0;
              const pct = analytics.totalReviews ? (count / analytics.totalReviews) * 100 : 0;
              return (
                <div key={stars} className="dist-bar-row">
                  <span className="text-xs font-semibold text-slate-600 w-12">{stars} ★</span>
                  <div className="dist-track">
                    <div className="dist-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dimension Breakdown */}
        <div className="scorecard-dimensions">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
            Aspect Quality Breakdown
          </span>

          <div className="dimensions-list">
            <div className="dim-row">
              <span className="dim-title">Construction & Materials</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{analytics.aspectAverages.constructionQuality}</span>
                <Star size={14} className="fill-amber-400 text-amber-400" />
              </div>
            </div>

            <div className="dim-row">
              <span className="dim-title">Clubhouse & Amenities</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{analytics.aspectAverages.amenitiesQuality}</span>
                <Star size={14} className="fill-amber-400 text-amber-400" />
              </div>
            </div>

            <div className="dim-row">
              <span className="dim-title">Handover & Snag Rectification</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{analytics.aspectAverages.handoverExperience}</span>
                <Star size={14} className="fill-amber-400 text-amber-400" />
              </div>
            </div>

            <div className="dim-row">
              <span className="dim-title">Communication & Timelines</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{analytics.aspectAverages.communication}</span>
                <Star size={14} className="fill-amber-400 text-amber-400" />
              </div>
            </div>

            <div className="dim-row">
              <span className="dim-title">Overall Value for Money</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{analytics.aspectAverages.valueForMoney}</span>
                <Star size={14} className="fill-amber-400 text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="hub-filters-bar">
        <div className="search-input-box">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search resident, flat number, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Reviews ({reviews.length})</option>
            <option value="5stars">5 Star Reviews Only</option>
            <option value="featured">Featured / Pinned</option>
            <option value="with-photos">With Photos</option>
            <option value="not-posted">Pending Google Post</option>
          </select>

          <select
            className="filter-select"
            value={towerFilter}
            onChange={(e) => setTowerFilter(e.target.value as any)}
          >
            <option value="all">All Towers</option>
            <option value="Tower A">Tower A</option>
            <option value="Tower B">Tower B</option>
          </select>
        </div>
      </div>

      {/* Reviews Table / Grid */}
      <div className="hub-reviews-table-wrapper">
        <table className="hub-table">
          <thead>
            <tr>
              <th>Resident & Unit</th>
              <th>Rating & Highlights</th>
              <th>Review Snippet</th>
              <th>Photos</th>
              <th>Google Status</th>
              <th>Actions & Studio</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-500">
                  No reviews match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filteredReviews.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {r.residentName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.tower} • Flat {r.flatNo}
                    </div>
                    {r.isVerifiedResident && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-0.5">
                        <CheckCircle2 size={10} /> Verified
                      </span>
                    )}
                  </td>

                  <td>
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={s <= r.rating ? 'fill-amber-400' : 'text-slate-300'}
                        />
                      ))}
                      <span className="font-bold text-xs text-slate-800 ml-1">
                        {r.rating}.0
                      </span>
                    </div>
                    {r.tags && r.tags.length > 0 && (
                      <div className="text-[11px] text-slate-600 mt-1">
                        {r.tags[0]} {r.tags.length > 1 ? `+${r.tags.length - 1}` : ''}
                      </div>
                    )}
                  </td>

                  <td className="max-w-xs">
                    {r.headline && (
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1">
                        "{r.headline}"
                      </div>
                    )}
                    <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {r.comment}
                    </div>
                  </td>

                  <td>
                    {r.photos && r.photos.length > 0 ? (
                      <div className="flex gap-1">
                        {r.photos.slice(0, 2).map((p, i) => (
                          <img
                            key={i}
                            src={p}
                            alt="Attachment"
                            className="w-9 h-9 object-cover rounded border border-slate-200"
                          />
                        ))}
                        {r.photos.length > 2 && (
                          <span className="text-[10px] font-bold text-slate-500 self-center">
                            +{r.photos.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">None</span>
                    )}
                  </td>

                  <td>
                    {r.postedToGoogle ? (
                      <span className="badge-posted-google">
                        <Check size={12} /> Posted on Google
                      </span>
                    ) : (
                      <button
                        className="badge-pending-google"
                        onClick={async () => {
                          await markPostedToGoogle(r.id);
                          await loadData();
                        }}
                      >
                        Mark as Posted
                      </button>
                    )}
                  </td>

                  <td>
                    <div className="flex items-center gap-1.5">
                      <button
                        className="btn-card-studio"
                        onClick={() => setSelectedReviewForCard(r)}
                        title="Open Card Generator Studio & Download PNG"
                      >
                        <Sparkles size={14} />
                        <span>Google Card</span>
                      </button>

                      <button
                        className="btn-quick-download"
                        onClick={() => downloadReviewCardAsPng(r)}
                        title="Direct Download Card PNG"
                      >
                        <Download size={14} />
                      </button>

                      <button
                        className={`btn-feature-toggle ${r.status === 'featured' ? 'is-featured' : ''}`}
                        onClick={() => handleToggleFeatured(r)}
                        title={r.status === 'featured' ? 'Unpin from Top' : 'Pin to Top'}
                      >
                        <Star size={14} className={r.status === 'featured' ? 'fill-amber-400' : ''} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Review Card Generator Modal */}
      {selectedReviewForCard && (
        <ReviewCardModal
          review={selectedReviewForCard}
          onClose={() => setSelectedReviewForCard(null)}
          onPostedToGoogle={async () => {
            await markPostedToGoogle(selectedReviewForCard.id);
            await loadData();
          }}
        />
      )}

      {/* Builder Config Modal */}
      {isConfigOpen && (
        <div className="review-modal-overlay animate-fade-in" onClick={() => setIsConfigOpen(false)}>
          <div className="config-modal-box animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="config-header">
              <h3 className="font-bold text-lg text-slate-800">Builder Google Review Settings</h3>
              <button className="btn-close-icon" onClick={() => setIsConfigOpen(false)}>
                ✕
              </button>
            </div>

            <div className="config-body">
              <div className="input-group mb-3">
                <label className="field-label">Builder Official Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={tempBuilderName}
                  onChange={(e) => setTempBuilderName(e.target.value)}
                />
              </div>

              <div className="input-group mb-3">
                <label className="field-label">
                  Google Business Profile Review Link
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  value={tempGoogleUrl}
                  onChange={(e) => setTempGoogleUrl(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Residents will be automatically redirected to this URL with their review text copied to clipboard.
                </p>
              </div>
            </div>

            <div className="config-footer">
              <button className="btn-action-outline" onClick={() => setIsConfigOpen(false)}>
                Cancel
              </button>
              <button className="btn-action-primary" onClick={handleSaveConfig}>
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
