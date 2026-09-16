import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Image as ImageIcon,
  Share2,
} from 'lucide-react';
import type { BuilderReview, BuilderFeedbackConfig } from '../../types/builderFeedback';
import { getBuilderConfig } from '../../services/builderFeedbackService';
import {
  generateReviewCardCanvas,
  downloadReviewCardAsPng,
} from '../../utils/reviewCardCanvas';

interface ReviewCardModalProps {
  review: BuilderReview;
  onClose: () => void;
  onPostedToGoogle?: () => void;
}

export const ReviewCardModal: React.FC<ReviewCardModalProps> = ({
  review,
  onClose,
  onPostedToGoogle,
}) => {
  const [theme, setTheme] = useState<'google-light' | 'modern-dark' | 'gold-luxury'>('google-light');
  const [includePhotos, setIncludePhotos] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [config] = useState<BuilderFeedbackConfig>(getBuilderConfig());

  // Render preview canvas
  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    generateReviewCardCanvas(review, { theme, includePhotos })
      .then((canvas) => {
        if (isMounted) {
          setPreviewUrl(canvas.toDataURL('image/png'));
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Error generating card canvas:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [review, theme, includePhotos]);

  const handleCopyText = () => {
    const fullText = `${review.headline ? review.headline + '\n\n' : ''}${review.comment}\n\n- Verified Resident of ${review.tower}, Flat ${review.flatNo}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = async () => {
    await downloadReviewCardAsPng(review, { theme, includePhotos });
  };

  const handleOpenGoogleReviews = () => {
    handleCopyText();
    if (onPostedToGoogle) onPostedToGoogle();
    window.open(config.googleReviewUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="review-modal-overlay animate-fade-in" onClick={onClose}>
      <div
        className="review-modal-content animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="review-modal-header">
          <div className="flex items-center gap-2">
            <div className="google-icon-pill">
              <span className="text-blue-500 font-bold">G</span>
              <span className="text-red-500 font-bold">o</span>
              <span className="text-yellow-500 font-bold">o</span>
              <span className="text-blue-500 font-bold">g</span>
              <span className="text-green-500 font-bold">l</span>
              <span className="text-red-500 font-bold">e</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Review Card & Google Post Helper
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn-close-icon"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="review-modal-body">
          {/* Card Preview Column */}
          <div className="review-preview-col">
            <div className="card-aspect-controls">
              <span className="text-xs font-semibold text-slate-500">THEME:</span>
              <button
                className={`theme-chip ${theme === 'google-light' ? 'active' : ''}`}
                onClick={() => setTheme('google-light')}
              >
                Google Light
              </button>
              <button
                className={`theme-chip ${theme === 'modern-dark' ? 'active' : ''}`}
                onClick={() => setTheme('modern-dark')}
              >
                Dark Mode
              </button>
              <button
                className={`theme-chip ${theme === 'gold-luxury' ? 'active' : ''}`}
                onClick={() => setTheme('gold-luxury')}
              >
                Luxury Gold
              </button>

              {review.photos && review.photos.length > 0 && (
                <label className="toggle-photos-label">
                  <input
                    type="checkbox"
                    checked={includePhotos}
                    onChange={(e) => setIncludePhotos(e.target.checked)}
                  />
                  <span>Include Photos ({review.photos.length})</span>
                </label>
              )}
            </div>

            <div className="preview-canvas-box">
              {isGenerating ? (
                <div className="preview-loading-spinner">
                  <Sparkles className="animate-spin text-amber-500" size={32} />
                  <span className="text-sm font-medium mt-2">Rendering 1080p Review Card...</span>
                </div>
              ) : (
                <img
                  src={previewUrl}
                  alt={`Review card for ${review.residentName}`}
                  className="preview-image-canvas shadow-xl rounded-xl"
                />
              )}
            </div>

            <button
              className="btn-download-card"
              onClick={handleDownload}
              disabled={isGenerating}
            >
              <Download size={18} />
              <span>Download High-Res Card (PNG for Google / WhatsApp)</span>
            </button>
          </div>

          {/* Quick Actions & Instructions Column */}
          <div className="review-actions-col">
            {/* Direct Google Post Step */}
            <div className="google-publish-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge-step">STEP 1</span>
                <h4 className="font-bold text-slate-800 dark:text-slate-100">
                  Post on Google Business
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                Click below to copy your review and jump straight to the Builder's official Google Reviews page.
              </p>

              <button
                className="btn-google-cta"
                onClick={handleOpenGoogleReviews}
              >
                <div className="flex items-center gap-2">
                  <ExternalLink size={18} />
                  <span>Copy Review & Open Google Page</span>
                </div>
              </button>
            </div>

            {/* Step 2: Attach image card */}
            <div className="google-publish-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge-step badge-step-2">STEP 2</span>
                <h4 className="font-bold text-slate-800 dark:text-slate-100">
                  Attach Image in Google Review
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                1. Download the generated Review Card image using the button on the left.
                <br />
                2. Paste your copied review in Google Reviews.
                <br />
                3. Click the <strong>"Add Photos"</strong> camera icon in Google Review and attach the downloaded card image!
              </p>
            </div>

            {/* Review text box for easy manual copying */}
            <div className="review-text-preview-box">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Review Text
                </span>
                <button
                  className="btn-copy-mini"
                  onClick={handleCopyText}
                >
                  {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="review-copy-area">
                <div className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                  {review.headline}
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {review.comment}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
