import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import {
  fetchWaterStrategies,
  createWaterStrategy,
  toggleStrategyUpvote,
  addStrategyComment,
  updateStrategyStatus,
  fetchPulseSurvey,
  submitPulseSurveyVote,
  type WaterStrategyItem,
  type StrategyCategory,
  type StrategyStatus,
  type TargetAuthority,
  type PulseSurveyResponse,
} from '../../services/waterInitiativeService';
import {
  Droplets,
  Plus,
  ThumbsUp,
  MessageSquare,
  Search,
  Filter,
  Users,
  ShieldAlert,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Share2,
  Sparkles,
  Award,
  ChevronRight,
  HandHelping,
  ArrowRight,
  Printer,
  Copy,
  Check,
  X,
  Send,
  SlidersHorizontal,
  ChevronDown,
  Star,
} from 'lucide-react';
import './WaterInitiativePage.css';

const CATEGORIES: { id: StrategyCategory | 'ALL'; label: string; icon: any }[] = [
  { id: 'ALL', label: 'All Strategies', icon: Droplets },
  { id: 'Legal & Regulatory', label: 'Legal & RERA Notice', icon: ShieldAlert },
  { id: 'Builder Negotiation', label: 'Builder Negotiation', icon: Building2 },
  { id: 'Municipal & Water Board', label: 'Municipal Water Board', icon: Droplets },
  { id: 'Media & Public RTI', label: 'RTI & Public Outreach', icon: FileText },
  { id: 'Society Infrastructure', label: 'Infrastructure & Sump', icon: SlidersHorizontal },
  { id: 'Community Action', label: 'Resident Task Force', icon: Users },
];



export interface WaterInitiativeProps {
  isRegisteredUser?: boolean;
}

export const WaterInitiativePage: React.FC<WaterInitiativeProps> = ({ isRegisteredUser = true }) => {
  const navigate = useNavigate();

  // State
  const [strategies, setStrategies] = useState<WaterStrategyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'forum' | 'roadmap' | 'survey' | 'dossier'>('forum');
  const [selectedCategory, setSelectedCategory] = useState<StrategyCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'upvotes' | 'recent'>('upvotes');
  const [statusFilter, setStatusFilter] = useState<StrategyStatus | 'ALL'>('ALL');

  // User Profile & Auth
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [userFlat, setUserFlat] = useState<string>('Resident');
  const [isAdmin, setIsAdmin] = useState(false);

  // Guest inputs (when not logged in)
  const [guestName, setGuestName] = useState(() => localStorage.getItem('bps_guest_name') || '');
  const [guestFlat, setGuestFlat] = useState(() => localStorage.getItem('bps_guest_flat') || '');
  const [guestMobile, setGuestMobile] = useState(() => localStorage.getItem('bps_guest_mobile') || '');

  // Modals & Expansion
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [volunteerOffers, setVolunteerOffers] = useState<Record<string, boolean>>({});
  const [commentingMap, setCommentingMap] = useState<Record<string, boolean>>({});

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsAnonymous, setFormIsAnonymous] = useState(false);
  const [formWillingToLead, setFormWillingToLead] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Survey State
  const [survey, setSurvey] = useState<PulseSurveyResponse | null>(null);
  const [surveySelections, setSurveySelections] = useState<string[]>([]);
  const [hasVotedSurvey, setHasVotedSurvey] = useState(false);

  // Copy Feedback
  const [copiedDossier, setCopiedDossier] = useState(false);

  // Admin Status Edit Modal
  const [selectedStrategyForAdmin, setSelectedStrategyForAdmin] = useState<WaterStrategyItem | null>(
    null
  );
  const [adminNewStatus, setAdminNewStatus] = useState<StrategyStatus>('Adopted by Task Force');
  const [adminOfficialNotes, setAdminOfficialNotes] = useState('');

  // Initial Data Load
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profile) {
            setCurrentProfile(profile);
            if (profile.role === 'admin' || profile.role === 'super_admin' || profile.email?.includes('admin')) {
              setIsAdmin(true);
            }
          }

          // Try fetching resident flat
          const { data: residentData } = await supabase
            .from('residents')
            .select('flat_id, flats(flat_number, block)')
            .eq('user_id', user.id)
            .maybeSingle();

          if (residentData?.flats) {
            const f = residentData.flats as any;
            setUserFlat(`${f.block || ''} ${f.flat_number || ''}`.trim() || 'Resident');
          }
        }

        const strats = await fetchWaterStrategies();
        setStrategies(strats);

        const sData = await fetchPulseSurvey();
        setSurvey(sData);
        if (sData.user_voted_options && sData.user_voted_options.length > 0) {
          setHasVotedSurvey(true);
          setSurveySelections(sData.user_voted_options);
        }
      } catch (err) {
        console.error('Error initializing Water Initiative:', err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // Filter & Sort
  const filteredStrategies = useMemo(() => {
    return strategies
      .filter((item) => {
        if (selectedCategory !== 'ALL') {
          const matchCat =
            item.category === selectedCategory ||
            (item.categories && item.categories.includes(selectedCategory as StrategyCategory));
          if (!matchCat) return false;
        }
        if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchAuthor = item.author_name.toLowerCase().includes(q);
          const matchSteps = item.action_steps.some((s) => s.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchAuthor && !matchSteps) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'upvotes') {
          return b.upvotes - a.upvotes;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [strategies, selectedCategory, statusFilter, searchQuery, sortBy]);

  // Key Metrics
  const totalStrategies = strategies.length;
  const totalUpvotes = strategies.reduce((acc, curr) => acc + curr.upvotes, 0);
  const totalVolunteers = strategies.reduce(
    (acc, curr) =>
      acc +
      (curr.willing_to_lead ? 1 : 0) +
      curr.comments.filter((c) => c.is_volunteer_offer).length,
    0
  );
  const adoptedCount = strategies.filter(
    (s) => s.status === 'Adopted by Task Force' || s.status === 'In Action'
  ).length;

  // Upvote Handler
  const handleUpvote = async (strategyId: string) => {
    const userId = currentUser?.id || 'guest-' + window.location.hostname;
    try {
      // Optimistic update
      setStrategies((prev) =>
        prev.map((item) => {
          if (item.id === strategyId) {
            const hasUpvoted = item.upvoted_by_user_ids.includes(userId);
            const newUpvotedBy = hasUpvoted
              ? item.upvoted_by_user_ids.filter((id) => id !== userId)
              : [...item.upvoted_by_user_ids, userId];
            const newCount = hasUpvoted ? Math.max(0, item.upvotes - 1) : item.upvotes + 1;
            return {
              ...item,
              upvotes: newCount,
              upvoted_by_user_ids: newUpvotedBy,
            };
          }
          return item;
        })
      );

      await toggleStrategyUpvote(strategyId, userId);
    } catch (err) {
      console.error('Failed to upvote strategy:', err);
    }
  };

  // Add Comment Handler
  const handleAddComment = async (strategyId: string) => {
    const text = commentInputs[strategyId]?.trim();
    if (!text) return;

    const authorName = currentProfile?.full_name || currentUser?.email?.split('@')[0] || 'Resident';
    const isVolunteer = !!volunteerOffers[strategyId];

    try {
      setCommentingMap((prev) => ({ ...prev, [strategyId]: true }));
      const newComment = await addStrategyComment(strategyId, {
        author_name: authorName,
        author_flat: userFlat,
        author_id: currentUser?.id,
        comment: text,
        is_volunteer_offer: isVolunteer,
      });

      setStrategies((prev) =>
        prev.map((item) => {
          if (item.id === strategyId) {
            return {
              ...item,
              comments: [...item.comments, newComment],
            };
          }
          return item;
        })
      );

      // Reset input
      setCommentInputs((prev) => ({ ...prev, [strategyId]: '' }));
      setVolunteerOffers((prev) => ({ ...prev, [strategyId]: false }));
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setCommentingMap((prev) => ({ ...prev, [strategyId]: false }));
    }
  };

  // Submit New Strategy
  const handleSubmitStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) return;

    try {
      setFormSubmitting(true);

      let authorName = 'Verified Resident';
      let authorFlat = userFlat;

      if (!formIsAnonymous) {
        if (currentUser) {
          authorName = currentProfile?.full_name || currentUser?.email?.split('@')[0] || 'Resident';
          authorFlat = userFlat;
        } else {
          authorName = guestName.trim() || 'Resident';
          authorFlat = guestFlat.trim() || 'BPS Resident';
          if (guestName) localStorage.setItem('bps_guest_name', guestName);
          if (guestFlat) localStorage.setItem('bps_guest_flat', guestFlat);
          if (guestMobile) localStorage.setItem('bps_guest_mobile', guestMobile);
        }
      }

      const newStrategy = await createWaterStrategy({
        title: formTitle.trim(),
        category: 'Builder Negotiation',
        categories: ['Builder Negotiation'],
        impact_rating: 5,
        description: formDescription.trim(),
        action_steps: ['Strategic proposal submitted for community task force review'],
        target_authority: 'Builder / Developer Management',
        estimated_timeline: '2 Weeks',
        budget_requirement: 'Society Supported',
        author_name: authorName,
        author_flat: authorFlat,
        author_id: currentUser?.id,
        is_anonymous: formIsAnonymous,
        willing_to_lead: formWillingToLead,
      });

      setStrategies((prev) => [newStrategy, ...prev]);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsSubmitModalOpen(false);
        // Reset form
        setFormTitle('');
        setFormDescription('');
      }, 1200);
    } catch (err) {
      console.error('Error submitting strategy:', err);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Pulse Survey Submit
  const handleSurveyOptionToggle = (key: string) => {
    if (hasVotedSurvey) return;
    if (surveySelections.includes(key)) {
      setSurveySelections(surveySelections.filter((k) => k !== key));
    } else {
      setSurveySelections([...surveySelections, key]);
    }
  };

  const handleCastSurveyVote = async () => {
    if (surveySelections.length === 0 || hasVotedSurvey) return;
    try {
      const updated = await submitPulseSurveyVote(surveySelections);
      setSurvey(updated);
      setHasVotedSurvey(true);
    } catch (err) {
      console.error('Error submitting survey vote:', err);
    }
  };

  // Admin Status Update
  const handleSaveAdminStatus = async () => {
    if (!selectedStrategyForAdmin) return;
    try {
      await updateStrategyStatus(
        selectedStrategyForAdmin.id,
        adminNewStatus,
        adminOfficialNotes.trim() || undefined
      );

      setStrategies((prev) =>
        prev.map((item) => {
          if (item.id === selectedStrategyForAdmin.id) {
            return {
              ...item,
              status: adminNewStatus,
              official_notes: adminOfficialNotes.trim() || item.official_notes,
            };
          }
          return item;
        })
      );
      setSelectedStrategyForAdmin(null);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Copy Dossier
  const handleCopyDossier = () => {
    const textLines = [
      '===========================================================',
      'BPS TWIN TOWERS - MUNICIPAL WATER ACTION STRATEGY DOSSIER',
      'Compiled from Community Resident Proposals & Endorsements',
      `Date: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`,
      '===========================================================\n',
    ];

    strategies.forEach((s, idx) => {
      textLines.push(`[#${idx + 1}] ${s.title.toUpperCase()}`);
      textLines.push(`Category: ${s.category} | Status: ${s.status} | Endorsements: ${s.upvotes} Upvotes`);
      textLines.push(`Target Authority: ${s.target_authority} | Timeline: ${s.estimated_timeline}`);
      textLines.push(`Proposed By: ${s.author_name} (${s.author_flat})`);
      textLines.push(`\nDescription:\n${s.description}\n`);
      textLines.push('Action Steps:');
      s.action_steps.forEach((step, sIdx) => {
        textLines.push(`  ${sIdx + 1}. ${step}`);
      });
      if (s.official_notes) {
        textLines.push(`Task Force Note: ${s.official_notes}`);
      }
      textLines.push('\n-----------------------------------------------------------\n');
    });

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopiedDossier(true);
    setTimeout(() => setCopiedDossier(false), 2500);
  };

  const getStatusBadgeClass = (status: StrategyStatus) => {
    switch (status) {
      case 'Adopted by Task Force':
        return 'badge-adopted';
      case 'In Action':
        return 'badge-inaction';
      case 'Resolved':
        return 'badge-resolved';
      case 'Parked':
        return 'badge-parked';
      default:
        return 'badge-underreview';
    }
  };

  return (
    <div className={`water-initiative-page ${!isRegisteredUser ? 'public-mode' : ''}`}>
      {/* Public Header Bar (Rendered when accessed openly without login session) */}
      {!isRegisteredUser && (
        <header className="water-public-navbar">
          <div className="water-public-nav-brand" onClick={() => navigate('/')}>
            <img src="/bps-logo.png" alt="BPS Twin Towers" className="water-public-logo" />
            <div className="water-public-brand-text">
              <div className="water-public-title">BPS Twin Towers</div>
              <div className="water-public-sub">Residents Community Action Portal</div>
            </div>
          </div>
          <div className="water-public-nav-actions">
            <button
              type="button"
              className="btn-public-secondary"
              onClick={() => navigate('/ganesh-utsav')}
            >
              <Sparkles size={15} />
              <span>Ganesh Utsav</span>
            </button>
            <button
              type="button"
              className="btn-public-primary"
              onClick={() => navigate('/login')}
            >
              <span>Resident Login</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </header>
      )}

      {/* =========================================================================
          HERO BANNER & HEADER
         ========================================================================= */}
      <section className="water-hero-card">
        <div className="water-hero-glow" />
        <div className="water-hero-content">
          <div className="water-hero-topline">
            <span className="water-badge-pulse">
              <span className="pulse-dot" /> High Priority Society Initiative
            </span>
            <span className="water-hero-society">BPS Twin Towers Society</span>
          </div>

          <h1 className="water-hero-title">
            <Droplets className="water-icon-title" size={32} />
            Municipal Water Connection Action Hub
          </h1>

          <p className="water-hero-desc">
            A united resident platform to propose ideas, strategic blueprints, legal notices, and
            negotiation plans to approach the builder and fast-track our <strong>Municipal Potable Water Line</strong>.
          </p>

          {/* Quick Stat Pill Cards */}
          <div className="water-stats-grid">
            <div className="water-stat-item">
              <div className="stat-icon-wrap" style={{ color: '#0D9488', background: 'rgba(13, 148, 136, 0.12)' }}>
                <FileText size={20} />
              </div>
              <div className="stat-text">
                <span className="stat-num">{totalStrategies}</span>
                <span className="stat-label">Strategic Ideas</span>
              </div>
            </div>

            <div className="water-stat-item">
              <div className="stat-icon-wrap" style={{ color: '#0284C7', background: 'rgba(2, 132, 199, 0.12)' }}>
                <ThumbsUp size={20} />
              </div>
              <div className="stat-text">
                <span className="stat-num">{totalUpvotes}</span>
                <span className="stat-label">Community Votes</span>
              </div>
            </div>

            <div className="water-stat-item">
              <div className="stat-icon-wrap" style={{ color: '#16A34A', background: 'rgba(22, 163, 74, 0.12)' }}>
                <CheckCircle2 size={20} />
              </div>
              <div className="stat-text">
                <span className="stat-num">{adoptedCount}</span>
                <span className="stat-label">Adopted by Task Force</span>
              </div>
            </div>

            <div className="water-stat-item">
              <div className="stat-icon-wrap" style={{ color: '#8B5CF6', background: 'rgba(139, 92, 246, 0.12)' }}>
                <HandHelping size={20} />
              </div>
              <div className="stat-text">
                <span className="stat-num">{totalVolunteers}</span>
                <span className="stat-label">Delegation Volunteers</span>
              </div>
            </div>
          </div>

          <div className="water-hero-actions">
            <button
              type="button"
              className="btn-primary-water"
              onClick={() => setIsSubmitModalOpen(true)}
            >
              <Plus size={18} />
              <span>Post Your Idea or Strategy</span>
            </button>
            <button
              type="button"
              className="btn-secondary-water"
              onClick={() => setActiveTab('survey')}
            >
              <Sparkles size={16} />
              <span>Cast Pulse Vote</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          NAVIGATION TABS
         ========================================================================= */}
      <div className="water-tabs-bar">
        <button
          className={`water-tab-btn ${activeTab === 'forum' ? 'active' : ''}`}
          onClick={() => setActiveTab('forum')}
        >
          <FileText size={17} />
          <span>Strategy Forum & Ideas ({strategies.length})</span>
        </button>
        <button
          className={`water-tab-btn ${activeTab === 'roadmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('roadmap')}
        >
          <Award size={17} />
          <span>Action Roadmap & Timeline</span>
        </button>
        <button
          className={`water-tab-btn ${activeTab === 'survey' ? 'active' : ''}`}
          onClick={() => setActiveTab('survey')}
        >
          <Users size={17} />
          <span>Community Pulse Poll</span>
        </button>
        <button
          className={`water-tab-btn ${activeTab === 'dossier' ? 'active' : ''}`}
          onClick={() => setActiveTab('dossier')}
        >
          <Printer size={17} />
          <span>Task Force Dossier</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: STRATEGY FORUM & IDEAS
         ========================================================================= */}
      {activeTab === 'forum' && (
        <div className="water-tab-content">
          {/* Controls: Search, Filter, Sort */}
          <div className="water-controls-card">
            <div className="water-search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search strategies by keywords, RERA, legal, meeting, sump..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="water-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="water-filter-row">
              <div className="water-sort-wrap">
                <span className="sort-label">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="water-select"
                >
                  <option value="upvotes">🔥 Most Upvoted (Top Community Picks)</option>
                  <option value="recent">⏱️ Most Recent</option>
                </select>
              </div>

              <div className="water-status-filter-wrap">
                <span className="sort-label">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="water-select"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Adopted by Task Force">⭐ Adopted by Task Force</option>
                  <option value="In Action">⚡ In Action</option>
                  <option value="Under Review">🔍 Under Review</option>
                  <option value="Resolved">✅ Resolved</option>
                </select>
              </div>

              <button
                type="button"
                className="btn-new-idea-compact"
                onClick={() => setIsSubmitModalOpen(true)}
              >
                <Plus size={16} />
                <span>Submit Idea</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="water-category-pills">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`cat-pill-btn ${active ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <Icon size={14} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Strategies Grid / List */}
          {filteredStrategies.length === 0 ? (
            <div className="water-empty-state">
              <Droplets size={48} className="empty-icon" />
              <h3>No strategies found matching your filters</h3>
              <p>Be the first resident to submit a strategy in this category!</p>
              <button
                type="button"
                className="btn-primary-water"
                onClick={() => setIsSubmitModalOpen(true)}
              >
                <Plus size={16} />
                <span>Post Your Strategy</span>
              </button>
            </div>
          ) : (
            <div className="water-cards-container">
              {filteredStrategies.map((strategy) => {
                const isExpanded = !!expandedComments[strategy.id];
                const userId = currentUser?.id || 'guest-' + window.location.hostname;
                const hasUserUpvoted = strategy.upvoted_by_user_ids.includes(userId);

                return (
                  <div key={strategy.id} className="strategy-card">
                    {/* Top Metadata */}
                    <div className="strategy-card-header">
                      <div className="strategy-tags">
                        {(strategy.categories && strategy.categories.length > 0
                          ? strategy.categories
                          : [strategy.category]
                        ).map((catName) => (
                          <span key={catName} className="strategy-category-badge">
                            {catName}
                          </span>
                        ))}

                        {strategy.impact_rating && (
                          <span className="strategy-rating-badge" title={`Strategic Impact Rating: ${strategy.impact_rating}/5`}>
                            <Star size={12} fill="#f59e0b" color="#f59e0b" />
                            <span>{strategy.impact_rating}/5 Impact</span>
                          </span>
                        )}

                        <span
                          className={`strategy-status-badge ${getStatusBadgeClass(
                            strategy.status
                          )}`}
                        >
                          {strategy.status === 'Adopted by Task Force' && <Sparkles size={13} />}
                          {strategy.status}
                        </span>
                      </div>

                      {/* Admin Quick Status Modifier */}
                      {isAdmin && (
                        <button
                          type="button"
                          className="admin-edit-badge-btn"
                          title="Update Status (Admin)"
                          onClick={() => {
                            setSelectedStrategyForAdmin(strategy);
                            setAdminNewStatus(strategy.status);
                            setAdminOfficialNotes(strategy.official_notes || '');
                          }}
                        >
                          <SlidersHorizontal size={13} />
                          <span>Admin Edit</span>
                        </button>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h3 className="strategy-title">{strategy.title}</h3>
                    <p className="strategy-desc">{strategy.description}</p>

                    {/* Action Steps Roadmap */}
                    {strategy.action_steps && strategy.action_steps.length > 0 && (
                      <div className="strategy-steps-section">
                        <div className="steps-title">
                          <CheckCircle2 size={15} /> Proposed Action Plan:
                        </div>
                        <ul className="strategy-steps-list">
                          {strategy.action_steps.map((step, idx) => (
                            <li key={idx} className="step-item">
                              <span className="step-num">{idx + 1}</span>
                              <span className="step-text">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Meta Specifications */}
                    <div className="strategy-meta-grid">
                      <div className="meta-pill">
                        <Building2 size={13} />
                        <span><strong>Target:</strong> {strategy.target_authority}</span>
                      </div>
                      <div className="meta-pill">
                        <Clock size={13} />
                        <span><strong>Timeline:</strong> {strategy.estimated_timeline}</span>
                      </div>
                      <div className="meta-pill">
                        <FileText size={13} />
                        <span><strong>Budget:</strong> {strategy.budget_requirement}</span>
                      </div>
                      {strategy.willing_to_lead && (
                        <div className="meta-pill volunteer-pill">
                          <HandHelping size={13} />
                          <span>Author willing to lead delegation</span>
                        </div>
                      )}
                    </div>

                    {/* Official Task Force Remarks (if adopted/in action) */}
                    {strategy.official_notes && (
                      <div className="strategy-official-notes">
                        <div className="official-notes-header">
                          <ShieldAlert size={14} />
                          <span>Official Task Force Update</span>
                        </div>
                        <p>{strategy.official_notes}</p>
                      </div>
                    )}

                    {/* Card Footer: Author, Upvote, Comments */}
                    <div className="strategy-card-footer">
                      <div className="strategy-author-info">
                        <div className="author-avatar">
                          {strategy.author_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="author-details">
                          <span className="author-name">{strategy.author_name}</span>
                          <span className="author-flat">Flat {strategy.author_flat}</span>
                        </div>
                      </div>

                      <div className="strategy-actions-right">
                        {/* Upvote Button */}
                        <button
                          type="button"
                          className={`btn-upvote ${hasUserUpvoted ? 'upvoted' : ''}`}
                          onClick={() => handleUpvote(strategy.id)}
                          title="Endorse this strategy"
                        >
                          <ThumbsUp size={16} />
                          <span>{strategy.upvotes}</span>
                          <span className="upvote-label">Endorse</span>
                        </button>

                        {/* Comment Button */}
                        <button
                          type="button"
                          className="btn-comment-toggle"
                          onClick={() =>
                            setExpandedComments((prev) => ({
                              ...prev,
                              [strategy.id]: !prev[strategy.id],
                            }))
                          }
                        >
                          <MessageSquare size={16} />
                          <span>{strategy.comments.length}</span>
                        </button>
                      </div>
                    </div>

                    {/* Expanded Discussion / Comment Section */}
                    {isExpanded && (
                      <div className="strategy-discussion-box">
                        <div className="discussion-title">
                          <MessageSquare size={15} /> Resident Discussions & Offers to Help (
                          {strategy.comments.length})
                        </div>

                        {/* Comment List */}
                        {strategy.comments.length > 0 ? (
                          <div className="comments-list">
                            {strategy.comments.map((comment) => (
                              <div
                                key={comment.id}
                                className={`comment-bubble ${
                                  comment.is_volunteer_offer ? 'volunteer-comment' : ''
                                }`}
                              >
                                <div className="comment-header">
                                  <div className="comment-author">
                                    <span className="c-name">{comment.author_name}</span>
                                    <span className="c-flat">({comment.author_flat})</span>
                                  </div>
                                  {comment.is_volunteer_offer && (
                                    <span className="volunteer-badge">
                                      <HandHelping size={12} /> Volunteer Offer
                                    </span>
                                  )}
                                  <span className="c-time">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="comment-body">{comment.comment}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="no-comments-yet">
                            No resident replies yet. Be the first to refine this strategy or offer help!
                          </div>
                        )}

                        {/* Add Comment Input */}
                        <div className="add-comment-wrapper">
                          <input
                            type="text"
                            placeholder="Add your thoughts, legal advice, or offer to join..."
                            value={commentInputs[strategy.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [strategy.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(strategy.id);
                              }
                            }}
                            className="comment-input"
                          />
                          <div className="comment-action-row">
                            <label className="volunteer-checkbox-label">
                              <input
                                type="checkbox"
                                checked={!!volunteerOffers[strategy.id]}
                                onChange={(e) =>
                                  setVolunteerOffers((prev) => ({
                                    ...prev,
                                    [strategy.id]: e.target.checked,
                                  }))
                                }
                              />
                              <span>Offer to join delegation / assist in execution</span>
                            </label>

                            <button
                              type="button"
                              className="btn-submit-comment"
                              disabled={
                                !commentInputs[strategy.id]?.trim() || commentingMap[strategy.id]
                              }
                              onClick={() => handleAddComment(strategy.id)}
                            >
                              <Send size={14} />
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: ACTION ROADMAP & MILESTONES
         ========================================================================= */}
      {activeTab === 'roadmap' && (
        <div className="water-tab-content">
          <div className="roadmap-container-card">
            <div className="roadmap-header">
              <h2>
                <Award size={22} className="text-teal" /> 5-Phase Municipal Water Strategy Roadmap
              </h2>
              <p>
                Our community execution trajectory to move from initial strategy consolidation to
                having potable municipal water flowing into society sump tanks.
              </p>
            </div>

            <div className="roadmap-timeline">
              {/* Phase 1 */}
              <div className="timeline-item active-phase">
                <div className="timeline-badge current">
                  <span>1</span>
                </div>
                <div className="timeline-content">
                  <div className="timeline-phase-top">
                    <span className="phase-title">Phase 1: Resident Ideation & Strategy Consolidation</span>
                    <span className="phase-status-pill in-progress">Active / Ongoing</span>
                  </div>
                  <p className="phase-desc">
                    Gathering proposals, legal citations, and resident willingness to form the core
                    society Water Action Committee.
                  </p>
                  <div className="phase-deliverables">
                    <strong>Milestone Deliverables:</strong>
                    <ul>
                      <li>10+ vetted resident strategic proposals submitted on this portal</li>
                      <li>Constitution of 8-member BPS Water Task Force (Towers A & B)</li>
                      <li>Drafting of joint statutory legal notice citing RERA handover commitments</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Phase 2 */}
              <div className="timeline-item">
                <div className="timeline-badge upcoming">
                  <span>2</span>
                </div>
                <div className="timeline-content">
                  <div className="timeline-phase-top">
                    <span className="phase-title">Phase 2: Formal Builder Ultimatum & Joint Deputation</span>
                    <span className="phase-status-pill scheduled">Target: Week 2</span>
                  </div>
                  <p className="phase-desc">
                    Meeting the Developer leadership team with formal signature petitions, tanker
                    expenditure audit, and 15-day compliance notice.
                  </p>
                  <div className="phase-deliverables">
                    <strong>Milestone Deliverables:</strong>
                    <ul>
                      <li>Executive delegation meeting at Builder corporate office</li>
                      <li>Signed Minutes of Meeting (MoM) with water board application file number</li>
                      <li>Builder payment proof for municipal connection charges & road cutting fee</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Phase 3 */}
              <div className="timeline-item">
                <div className="timeline-badge upcoming">
                  <span>3</span>
                </div>
                <div className="timeline-content">
                  <div className="timeline-phase-top">
                    <span className="phase-title">Phase 3: Municipal Water Board & Local Authority Liaison</span>
                    <span className="phase-status-pill scheduled">Target: Week 4</span>
                  </div>
                  <p className="phase-desc">
                    Joint resident representation to Zonal Assistant Executive Engineer (AEE) and Ward
                    Councillor for fast-tracking bulk feeder line branch.
                  </p>
                  <div className="phase-deliverables">
                    <strong>Milestone Deliverables:</strong>
                    <ul>
                      <li>Site inspection by Municipal Water Board engineers</li>
                      <li>Verification of feeder main pipeline branch pressure & road cutting permit</li>
                      <li>Escalation to MLA / Consumer Forum if builder fails to cooperate</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Phase 4 */}
              <div className="timeline-item">
                <div className="timeline-badge upcoming">
                  <span>4</span>
                </div>
                <div className="timeline-content">
                  <div className="timeline-phase-top">
                    <span className="phase-title">Phase 4: Society Infrastructure Readiness & Metering</span>
                    <span className="phase-status-pill upcoming-pill">Target: Month 2</span>
                  </div>
                  <p className="phase-desc">
                    Testing society underground sump chambers, dual-piping bypass lines, and bulk
                    flow meter connections.
                  </p>
                  <div className="phase-deliverables">
                    <strong>Milestone Deliverables:</strong>
                    <ul>
                      <li>1.5 Lakh Litre Potable Sump cleaning & disinfection</li>
                      <li>Installation of electromagnetic bulk flow meter and automated cutoff valve</li>
                      <li>Water quality testing lab certification for municipal supply inlet</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Phase 5 */}
              <div className="timeline-item">
                <div className="timeline-badge upcoming">
                  <span>5</span>
                </div>
                <div className="timeline-content">
                  <div className="timeline-phase-top">
                    <span className="phase-title">Phase 5: Municipal Water Supply Commissioned</span>
                    <span className="phase-status-pill goal-pill">Final Goal</span>
                  </div>
                  <p className="phase-desc">
                    Commissioning of regular municipal potable water supply, saving society ₹1.2L+
                    monthly in tanker expenses and ensuring 24/7 water security for all 400+ flats.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: COMMUNITY PULSE SURVEY
         ========================================================================= */}
      {activeTab === 'survey' && (
        <div className="water-tab-content">
          <div className="survey-container-card">
            <div className="survey-header">
              <div className="survey-icon-wrap">
                <Users size={24} />
              </div>
              <div>
                <h2>Community Consensus & Readiness Pulse</h2>
                <p>
                  Help the Managing Committee and Task Force gauge collective resident backing for
                  key escalation actions.
                </p>
              </div>
            </div>

            <div className="survey-questions-grid">
              {/* Option 1 */}
              <div
                className={`survey-option-card ${
                  surveySelections.includes('delegation') ? 'selected' : ''
                }`}
                onClick={() => handleSurveyOptionToggle('delegation')}
              >
                <div className="option-checkbox">
                  {surveySelections.includes('delegation') ? (
                    <CheckCircle2 size={20} className="text-teal" />
                  ) : (
                    <div className="checkbox-empty" />
                  )}
                </div>
                <div className="option-info">
                  <h4>Join Physical Delegation to Builder Office</h4>
                  <p>
                    I am willing to join an in-person resident delegation meeting at the builder
                    headquarters on a Saturday morning.
                  </p>
                  {survey && (
                    <div className="option-progress-bar-wrap">
                      <div
                        className="option-progress-bar"
                        style={{
                          width: `${Math.round(
                            (survey.builder_delegation_willing / (survey.total_votes || 1)) * 100
                          )}%`,
                        }}
                      />
                      <span className="option-progress-text">
                        {survey.builder_delegation_willing} residents agreed (
                        {Math.round(
                          (survey.builder_delegation_willing / (survey.total_votes || 1)) * 100
                        )}
                        %)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Option 2 */}
              <div
                className={`survey-option-card ${
                  surveySelections.includes('legal') ? 'selected' : ''
                }`}
                onClick={() => handleSurveyOptionToggle('legal')}
              >
                <div className="option-checkbox">
                  {surveySelections.includes('legal') ? (
                    <CheckCircle2 size={20} className="text-teal" />
                  ) : (
                    <div className="checkbox-empty" />
                  )}
                </div>
                <div className="option-info">
                  <h4>Support Joint Legal Notice & RERA Escalation</h4>
                  <p>
                    I authorize the society to issue a statutory legal notice to the builder firm
                    and file with RERA if compliance is not met.
                  </p>
                  {survey && (
                    <div className="option-progress-bar-wrap">
                      <div
                        className="option-progress-bar bar-legal"
                        style={{
                          width: `${Math.round(
                            (survey.legal_notice_support / (survey.total_votes || 1)) * 100
                          )}%`,
                        }}
                      />
                      <span className="option-progress-text">
                        {survey.legal_notice_support} residents agreed (
                        {Math.round(
                          (survey.legal_notice_support / (survey.total_votes || 1)) * 100
                        )}
                        %)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Option 3 */}
              <div
                className={`survey-option-card ${
                  surveySelections.includes('water_board') ? 'selected' : ''
                }`}
                onClick={() => handleSurveyOptionToggle('water_board')}
              >
                <div className="option-checkbox">
                  {surveySelections.includes('water_board') ? (
                    <CheckCircle2 size={20} className="text-teal" />
                  ) : (
                    <div className="checkbox-empty" />
                  )}
                </div>
                <div className="option-info">
                  <h4>Assist in Municipal Water Board / Ward Visits</h4>
                  <p>
                    I can assist in visiting the Zonal Water Board office, submitting petitions, or
                    coordinating with local ward representatives.
                  </p>
                  {survey && (
                    <div className="option-progress-bar-wrap">
                      <div
                        className="option-progress-bar bar-board"
                        style={{
                          width: `${Math.round(
                            (survey.water_board_visit_willing / (survey.total_votes || 1)) * 100
                          )}%`,
                        }}
                      />
                      <span className="option-progress-text">
                        {survey.water_board_visit_willing} residents agreed (
                        {Math.round(
                          (survey.water_board_visit_willing / (survey.total_votes || 1)) * 100
                        )}
                        %)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="survey-actions-footer">
              {hasVotedSurvey ? (
                <div className="voted-acknowledgment">
                  <CheckCircle2 size={18} className="text-teal" />
                  <span>Thank you for casting your vote! Your responses have been recorded in the community tally.</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-cast-vote"
                  disabled={surveySelections.length === 0}
                  onClick={handleCastSurveyVote}
                >
                  <Send size={16} />
                  <span>Submit My Choices ({surveySelections.length} Selected)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: TASK FORCE DOSSIER & EXPORT
         ========================================================================= */}
      {activeTab === 'dossier' && (
        <div className="water-tab-content">
          <div className="dossier-container-card">
            <div className="dossier-header">
              <div>
                <h2>
                  <FileText size={22} className="text-teal" /> Official Task Force Action Dossier
                </h2>
                <p>
                  Compiled executive brief for the Managing Committee, Legal Counsel, and Builder
                  Delegation meeting.
                </p>
              </div>

              <div className="dossier-action-buttons">
                <button
                  type="button"
                  className="btn-dossier-action"
                  onClick={handleCopyDossier}
                >
                  {copiedDossier ? <Check size={16} className="text-teal" /> : <Copy size={16} />}
                  <span>{copiedDossier ? 'Copied to Clipboard!' : 'Copy Dossier Text'}</span>
                </button>
                <button
                  type="button"
                  className="btn-dossier-action btn-print"
                  onClick={() => window.print()}
                >
                  <Printer size={16} />
                  <span>Print Dossier</span>
                </button>
              </div>
            </div>

            <div className="dossier-printable-area">
              <div className="dossier-doc-header">
                <div className="dossier-brand">BPS TWIN TOWERS RESIDENTS ASSOCIATION</div>
                <div className="dossier-subtitle">
                  ACTION PLAN & STRATEGIC SUBMISSIONS: MUNICIPAL WATER SUPPLY CONNECTION
                </div>
                <div className="dossier-meta-date">
                  Compiled on {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })} | Total Proposals: {strategies.length} | Community Votes: {totalUpvotes}
                </div>
              </div>

              <div className="dossier-executive-summary">
                <h4>Executive Summary:</h4>
                <p>
                  As of September 2026, BPS Twin Towers (comprising 400+ residential families across Block A and
                  Block B) continues to rely on private water tankers and groundwater borewells, despite statutory
                  mandates and RERA sale deed commitments for municipal potable water supply connection.
                </p>
                <p>
                  This dossier consolidates the collective strategic consensus, proposed legal actions, builder
                  meeting agendas, and infrastructure audits submitted and endorsed by society residents.
                </p>
              </div>

              <div className="dossier-items-list">
                {strategies.map((strat, index) => (
                  <div key={strat.id} className="dossier-item">
                    <div className="dossier-item-header">
                      <span className="dossier-num">Proposal #{index + 1}</span>
                      <span className="dossier-status">Status: {strat.status}</span>
                    </div>
                    <h3 className="dossier-item-title">{strat.title}</h3>
                    <div className="dossier-item-meta">
                      <span><strong>Category:</strong> {strat.category}</span>
                      <span><strong>Target Authority:</strong> {strat.target_authority}</span>
                      <span><strong>Timeline:</strong> {strat.estimated_timeline}</span>
                      <span><strong>Community Support:</strong> {strat.upvotes} Endorsements</span>
                    </div>
                    <p className="dossier-item-desc">{strat.description}</p>
                    <div className="dossier-action-steps-box">
                      <strong>Execution Steps:</strong>
                      <ol>
                        {strat.action_steps.map((st, i) => (
                          <li key={i}>{st}</li>
                        ))}
                      </ol>
                    </div>
                    {strat.official_notes && (
                      <div className="dossier-taskforce-note">
                        <strong>Task Force Directive:</strong> {strat.official_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUBMISSION MODAL: NEW PROPOSAL / STRATEGY
         ========================================================================= */}
      {isSubmitModalOpen && (
        <div className="water-modal-backdrop" onClick={() => setIsSubmitModalOpen(false)}>
          <div
            className="water-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="water-modal-header">
              <div className="modal-header-left">
                <Droplets size={22} className="text-teal" />
                <div>
                  <h3>Submit Strategy or Action Proposal</h3>
                  <p>Share your ideas on how our society can approach the builder & authorities</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsSubmitModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {submitSuccess ? (
              <div className="modal-success-state">
                <CheckCircle2 size={56} className="text-teal animate-bounce" />
                <h3>Proposal Posted Successfully!</h3>
                <p>Your strategy is now live on the society board for resident voting and Task Force review.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitStrategy} className="water-modal-form">

                {/* Title */}
                <div className="form-group">
                  <label className="form-label">
                    Proposal Title / Headline <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Issue 15-day statutory legal notice citing RERA occupancy water clause"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="form-input"
                    maxLength={140}
                    required
                  />
                </div>

                {/* Detailed Strategy */}
                <div className="form-group">
                  <label className="form-label">
                    Detailed Strategy & Rationale <span className="req">*</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Write your thoughts, suggestions, or strategic steps here..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="form-input textarea-input"
                    required
                  />
                </div>

                {/* Guest Author Fields (when not logged in) */}
                {!currentUser && !formIsAnonymous && (
                  <div className="guest-identity-card">
                    <div className="guest-identity-title">
                      <Users size={14} className="text-teal" />
                      <span>Resident Information</span>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">
                          Your Name <span className="req">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Ramesh Sharma"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="form-input"
                          required={!formIsAnonymous}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          Tower & Flat No <span className="req">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. A-402 or B-1201"
                          value={guestFlat}
                          onChange={(e) => setGuestFlat(e.target.value)}
                          className="form-input"
                          required={!formIsAnonymous}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Checkboxes */}
                <div className="form-checkboxes-card">
                  <label className="modal-checkbox-row">
                    <input
                      type="checkbox"
                      checked={formWillingToLead}
                      onChange={(e) => setFormWillingToLead(e.target.checked)}
                    />
                    <span>
                      <strong>I am willing to volunteer / participate</strong> in executing this
                      strategy (e.g. joining builder meetings or drafting documents).
                    </span>
                  </label>

                  <label className="modal-checkbox-row">
                    <input
                      type="checkbox"
                      checked={formIsAnonymous}
                      onChange={(e) => setFormIsAnonymous(e.target.checked)}
                    />
                    <span>Post anonymously (Your name will be hidden from public view).</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="water-modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setIsSubmitModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit-proposal"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? (
                      <span>Publishing...</span>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Publish Strategy</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          ADMIN STATUS UPDATE MODAL
         ========================================================================= */}
      {selectedStrategyForAdmin && (
        <div className="water-modal-backdrop" onClick={() => setSelectedStrategyForAdmin(null)}>
          <div className="water-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="water-modal-header">
              <div className="modal-header-left">
                <SlidersHorizontal size={20} className="text-teal" />
                <div>
                  <h3>Update Strategy Status (Task Force / Admin)</h3>
                  <p className="truncate-text">{selectedStrategyForAdmin.title}</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedStrategyForAdmin(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="water-modal-form">
              <div className="form-group">
                <label className="form-label">Review Status</label>
                <select
                  value={adminNewStatus}
                  onChange={(e) => setAdminNewStatus(e.target.value as any)}
                  className="form-input select-input"
                >
                  <option value="Under Review">🔍 Under Review</option>
                  <option value="Adopted by Task Force">⭐ Adopted by Task Force</option>
                  <option value="In Action">⚡ In Action</option>
                  <option value="Resolved">✅ Resolved / Completed</option>
                  <option value="Parked">⏸️ Parked</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Official Task Force Remarks / Action Update</label>
                <textarea
                  rows={3}
                  placeholder="Provide status feedback to residents (e.g., Drafting team formed; Meeting scheduled on Saturday with builder MD...)"
                  value={adminOfficialNotes}
                  onChange={(e) => setAdminOfficialNotes(e.target.value)}
                  className="form-input textarea-input"
                />
              </div>

              <div className="water-modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setSelectedStrategyForAdmin(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-submit-proposal"
                  onClick={handleSaveAdminStatus}
                >
                  <Check size={16} />
                  <span>Save Status</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterInitiativePage;
