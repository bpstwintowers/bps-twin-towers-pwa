import React, { useState } from 'react';
import {
  Vote,
  BarChart3,
  Star,
  CheckCircle2,
  Send,
  Building2,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Droplets,
  RotateCcw,
  Share2,
  Check,
} from 'lucide-react';
import {
  SAMPLE_SURVEYS,
  SAMPLE_COMMUNITY_ANALYTICS,
  type SurveyTemplate,
} from './surveyData';
import './ResidentSurveys.css';

export const ResidentSurveys: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'survey' | 'results'>('survey');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>(SAMPLE_SURVEYS[0].id);
  
  // Resident identity
  const [selectedTower, setSelectedTower] = useState<'Tower A' | 'Tower B'>('Tower A');
  const [occupancyStatus, setOccupancyStatus] = useState<'Owner' | 'Tenant'>('Owner');
  const [flatNumber, setFlatNumber] = useState<string>('');
  
  // Form responses
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const activeSurvey: SurveyTemplate =
    SAMPLE_SURVEYS.find((s) => s.id === selectedSurveyId) || SAMPLE_SURVEYS[0];

  const handleRatingSelect = (questionId: string, value: number) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSingleChoiceSelect = (questionId: string, value: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleMultiChoiceToggle = (questionId: string, value: string) => {
    setResponses((prev) => {
      const currentList: string[] = prev[questionId] || [];
      const updated = currentList.includes(value)
        ? currentList.filter((v) => v !== value)
        : [...currentList, value];
      return { ...prev, [questionId]: updated };
    });
  };

  const handleTextChange = (questionId: string, value: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleReset = () => {
    setResponses({});
    setSubmitted(false);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="surveys-container">
      {/* 1. Hero Banner */}
      <div className="surveys-hero-card">
        <div className="surveys-hero-header">
          <div className="surveys-hero-title-group">
            <span className="surveys-badge">
              <Sparkles size={14} /> Resident Voice & Society Polls
            </span>
            <h1 className="surveys-hero-title">BPS Twin Towers Resident Surveys</h1>
            <p className="surveys-hero-subtitle">
              Your feedback directly shapes society maintenance priorities, security protocols,
              and AMC allocations for Tower A & Tower B.
            </p>
          </div>

          <div className="surveys-hero-actions">
            <button
              type="button"
              className={`surveys-tab-pill-btn ${activeTab === 'survey' ? 'active' : ''}`}
              onClick={() => setActiveTab('survey')}
            >
              <Vote size={16} /> Take Survey
            </button>
            <button
              type="button"
              className={`surveys-tab-pill-btn ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab('results')}
            >
              <BarChart3 size={16} /> Community Results
            </button>
            <button
              type="button"
              className="surveys-tab-pill-btn"
              onClick={handleShare}
              title="Share survey link"
            >
              {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
              {copiedLink ? 'Copied' : 'Share'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Survey Templates Switcher */}
      <div className="survey-template-selector">
        {SAMPLE_SURVEYS.map((survey) => (
          <button
            key={survey.id}
            type="button"
            className={`survey-template-card ${selectedSurveyId === survey.id ? 'active' : ''}`}
            onClick={() => {
              setSelectedSurveyId(survey.id);
              setSubmitted(false);
              setResponses({});
            }}
          >
            <div className="survey-template-top">
              <span className="survey-template-tag">{survey.badge}</span>
              <span className="survey-template-time">⏱️ {survey.estimatedTime}</span>
            </div>
            <h3 className="survey-template-title">{survey.title}</h3>
            <p className="survey-template-desc">{survey.tagline}</p>
            <div className="survey-template-meta">
              <span>👥 {survey.totalResponses} submissions</span>
              <span>⭐ {survey.satisfactionScore}% positive</span>
            </div>
          </button>
        ))}
      </div>

      {/* 3. Main Content: Survey Form vs Community Analytics */}
      {activeTab === 'survey' ? (
        <div className="survey-form-container">
          {submitted ? (
            <div className="survey-success-card">
              <div className="success-icon-wrap">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="survey-form-headline">Thank You for Your Feedback!</h2>
              <p className="survey-form-subtext" style={{ maxWidth: 500, margin: '0 auto' }}>
                Your responses have been recorded anonymously for <strong>{selectedTower}</strong>. The
                Management Committee reviews aggregate resident feedback during weekly operational
                meetings.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="submit-btn"
                  onClick={() => setActiveTab('results')}
                >
                  <BarChart3 size={16} /> View Community Results
                </button>
                <button
                  type="button"
                  className="surveys-tab-pill-btn"
                  style={{ color: 'var(--on-surface, #1e293b)', borderColor: 'var(--outline-variant)' }}
                  onClick={handleReset}
                >
                  <RotateCcw size={16} /> Submit Another Response
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="survey-form-header">
                <h2 className="survey-form-headline">{activeSurvey.title}</h2>
                <p className="survey-form-subtext">{activeSurvey.description}</p>
              </div>

              {/* Resident Context Selector */}
              <div className="resident-identity-bar">
                <div className="identity-field">
                  <label className="identity-label">Tower / Block</label>
                  <select
                    className="identity-select"
                    value={selectedTower}
                    onChange={(e) => setSelectedTower(e.target.value as 'Tower A' | 'Tower B')}
                  >
                    <option value="Tower A">Tower A (14 Floors)</option>
                    <option value="Tower B">Tower B (14 Floors)</option>
                  </select>
                </div>

                <div className="identity-field">
                  <label className="identity-label">Resident Type</label>
                  <select
                    className="identity-select"
                    value={occupancyStatus}
                    onChange={(e) => setOccupancyStatus(e.target.value as 'Owner' | 'Tenant')}
                  >
                    <option value="Owner">Owner Resident</option>
                    <option value="Tenant">Tenant</option>
                  </select>
                </div>

                <div className="identity-field">
                  <label className="identity-label">Flat No. (Optional)</label>
                  <input
                    type="text"
                    className="identity-input"
                    placeholder="e.g. A-704"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic Questions */}
              <div className="questions-list">
                {activeSurvey.questions.map((q, idx) => (
                  <div key={q.id} className="question-card">
                    <div className="question-title-row">
                      <span className="question-num">Q{idx + 1}</span>
                      <h4 className="question-text">
                        {q.title} {q.required && <span className="question-required">*</span>}
                      </h4>
                    </div>
                    {q.subtitle && <p className="question-desc">{q.subtitle}</p>}

                    {/* 1. Rating Question */}
                    {q.type === 'rating' && (
                      <div className="star-rating-group">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isSelected = (responses[q.id] || 0) >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              className={`star-btn ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleRatingSelect(q.id, star)}
                            >
                              <Star size={18} />
                              <span>{star}</span>
                            </button>
                          );
                        })}
                        {responses[q.id] && (
                          <span className="rating-label">
                            {responses[q.id] === 5 && '🌟 Excellent'}
                            {responses[q.id] === 4 && '👍 Good'}
                            {responses[q.id] === 3 && '😐 Average'}
                            {responses[q.id] === 2 && '⚠️ Needs Attention'}
                            {responses[q.id] === 1 && '🚨 Urgent Issue'}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 2. Single Choice Question */}
                    {q.type === 'single-choice' && q.options && (
                      <div className="options-grid">
                        {q.options.map((opt) => (
                          <label
                            key={opt.value}
                            className={`option-card-label ${
                              responses[q.id] === opt.value ? 'selected' : ''
                            }`}
                          >
                            <div className="option-left-content">
                              <input
                                type="radio"
                                name={q.id}
                                value={opt.value}
                                checked={responses[q.id] === opt.value}
                                onChange={() => handleSingleChoiceSelect(q.id, opt.value)}
                                required={q.required}
                              />
                              <span>{opt.label}</span>
                            </div>
                            {opt.badge && <span className="option-badge">{opt.badge}</span>}
                          </label>
                        ))}
                      </div>
                    )}

                    {/* 3. Multi Choice Question */}
                    {q.type === 'multi-choice' && q.options && (
                      <div className="options-grid">
                        {q.options.map((opt) => {
                          const currentVals: string[] = responses[q.id] || [];
                          const checked = currentVals.includes(opt.value);
                          return (
                            <label
                              key={opt.value}
                              className={`option-card-label ${checked ? 'selected' : ''}`}
                            >
                              <div className="option-left-content">
                                <input
                                  type="checkbox"
                                  value={opt.value}
                                  checked={checked}
                                  onChange={() => handleMultiChoiceToggle(q.id, opt.value)}
                                />
                                <span>{opt.label}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* 4. Text Question */}
                    {q.type === 'text' && (
                      <textarea
                        className="question-textarea"
                        placeholder="Type your feedback, observations, or floor-specific details..."
                        value={responses[q.id] || ''}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        rows={3}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Submit Footer */}
              <div className="survey-submit-bar">
                <span className="submit-helper">
                  <ShieldAlert size={14} /> Responses are encrypted & shared with society committee
                </span>
                <button type="submit" className="submit-btn">
                  <Send size={16} /> Submit Survey
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* 4. Community Results & Analytics View */
        <div className="survey-results-container">
          {/* Top KPI row */}
          <div className="analytics-grid">
            <div className="metric-card">
              <div className="metric-icon-box">
                <Vote size={24} />
              </div>
              <div className="metric-content">
                <span className="metric-value">{SAMPLE_COMMUNITY_ANALYTICS.totalParticipants}</span>
                <span className="metric-title">Total Verified Responses</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box" style={{ background: '#dcfce7', color: '#16a34a' }}>
                <CheckCircle2 size={24} />
              </div>
              <div className="metric-content">
                <span className="metric-value">{SAMPLE_COMMUNITY_ANALYTICS.overallSatisfaction}%</span>
                <span className="metric-title">Overall Satisfaction Index</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Building2 size={24} />
              </div>
              <div className="metric-content">
                <span className="metric-value">
                  {SAMPLE_COMMUNITY_ANALYTICS.towerABreakdown.towerA} /{' '}
                  {SAMPLE_COMMUNITY_ANALYTICS.towerABreakdown.towerB}
                </span>
                <span className="metric-title">Tower A vs Tower B Ratio</span>
              </div>
            </div>
          </div>

          {/* Service Satisfaction Breakdown */}
          <div className="analytics-section-card">
            <h3 className="analytics-section-title">
              <BarChart3 size={20} color="var(--teal-600)" /> Service Performance Breakdown
            </h3>

            {SAMPLE_COMMUNITY_ANALYTICS.ratingsSummary.map((item) => (
              <div key={item.category} className="rating-bar-row">
                <div className="rating-bar-label-group">
                  <span>{item.label}</span>
                  <span style={{ color: 'var(--teal-700)', fontWeight: 700 }}>
                    {item.average} / 5.0 ⭐
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${(item.average / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Top Priority Demands */}
          <div className="analytics-section-card">
            <h3 className="analytics-section-title">
              <ArrowRight size={20} color="var(--teal-600)" /> Top Resident Priority Demands
            </h3>
            <div className="options-grid">
              {SAMPLE_COMMUNITY_ANALYTICS.topPriorities.map((pri, idx) => (
                <div
                  key={idx}
                  className="option-card-label"
                  style={{ cursor: 'default', background: 'var(--surface-container-low)' }}
                >
                  <div className="option-left-content">
                    <span style={{ fontWeight: 800, color: 'var(--teal-600)' }}>#{idx + 1}</span>
                    <span>{pri.label}</span>
                  </div>
                  <span className="option-badge">
                    {pri.count} votes ({pri.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Resident Feedback Voice */}
          <div className="analytics-section-card">
            <h3 className="analytics-section-title">
              <Droplets size={20} color="var(--teal-600)" /> Recent Resident Observations
            </h3>
            {SAMPLE_COMMUNITY_ANALYTICS.keyFeedbackQuotes.map((fb, idx) => (
              <div key={idx} className="feedback-quote-card">
                <div className="quote-header">
                  <span>
                    {fb.tower} • {fb.role}
                  </span>
                  <span>{fb.date}</span>
                </div>
                <p className="quote-text">"{fb.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
