import { supabase } from './supabase/client';

export type StrategyCategory =
  | 'Legal & Regulatory'
  | 'Builder Negotiation'
  | 'Municipal & Water Board'
  | 'Media & Public RTI'
  | 'Society Infrastructure'
  | 'Community Action';

export type StrategyStatus =
  | 'Under Review'
  | 'Adopted by Task Force'
  | 'In Action'
  | 'Resolved'
  | 'Parked';

export type TargetAuthority =
  | 'Builder / Developer Management'
  | 'Municipal Water Board (CMWSSB/BWSSB)'
  | 'RERA Authority'
  | 'Local MLA / Ward Councillor'
  | 'Society Task Force'
  | 'All Stakeholders';

export interface StrategyComment {
  id: string;
  strategy_id: string;
  author_name: string;
  author_flat: string;
  author_id?: string;
  comment: string;
  is_volunteer_offer: boolean;
  created_at: string;
}

export interface WaterStrategyItem {
  id: string;
  title: string;
  category: StrategyCategory;
  categories?: StrategyCategory[];
  impact_rating?: number; // 1 to 5 stars
  description: string;
  action_steps: string[];
  target_authority: TargetAuthority;
  estimated_timeline: string;
  budget_requirement: string;
  author_name: string;
  author_flat: string;
  author_id?: string;
  is_anonymous: boolean;
  willing_to_lead: boolean;
  status: StrategyStatus;
  upvotes: number;
  upvoted_by_user_ids: string[];
  comments: StrategyComment[];
  official_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PulseSurveyResponse {
  total_votes: number;
  builder_delegation_willing: number;
  legal_notice_support: number;
  water_board_visit_willing: number;
  user_voted_options: string[]; // e.g. ['delegation', 'legal', 'water_board']
}

const STORAGE_KEY_STRATEGIES = 'bps_water_initiative_strategies';
const STORAGE_KEY_SURVEY = 'bps_water_initiative_survey';

// Initial realistic seed strategies tailored for BPS Twin Towers society
const INITIAL_STRATEGIES: WaterStrategyItem[] = [
  {
    id: 'strat-1',
    title: 'Formal 15-Day Joint Legal Notice citing RERA Handover Non-Compliance',
    category: 'Legal & Regulatory',
    description:
      'Issue a statutory legal notice to the builder firm through our Society Legal Counsel demanding immediate deposit of municipal water connection charges with the Water Board and completion of bulk meter handover as per RERA occupancy commitments.',
    action_steps: [
      'Draft formal notice citing RERA Project Registration clauses and Sale Deed obligations regarding potable water supply.',
      'Gather signatures of at least 50+ registered owners across Block A & Block B.',
      'Serve notice via Registered Post with Acknowledgment Due (RPAD) and official email to Developer Directors.',
      'Set a strict 15-day SLA before escalating to RERA Enforcement Bench.',
    ],
    target_authority: 'Builder / Developer Management',
    estimated_timeline: '2 Weeks',
    budget_requirement: 'Society Legal Fund (₹15,000 - ₹25,000)',
    author_name: 'Adv. Rajesh Sharma',
    author_flat: 'A-1204',
    is_anonymous: false,
    willing_to_lead: true,
    status: 'Adopted by Task Force',
    upvotes: 48,
    upvoted_by_user_ids: ['seed-user-1', 'seed-user-2'],
    comments: [
      {
        id: 'c1',
        strategy_id: 'strat-1',
        author_name: 'Senthil Nathan',
        author_flat: 'B-803',
        comment:
          'Fully support this! We should also attach the original sanction layout plan where municipal water line inlet is clearly marked.',
        is_volunteer_offer: false,
        created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'c2',
        strategy_id: 'strat-1',
        author_name: 'Dr. Priya Varma',
        author_flat: 'A-402',
        comment:
          'I am willing to join the signing delegation and help coordinate signatures across A-wing floors 1 to 7.',
        is_volunteer_offer: true,
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      },
    ],
    official_notes:
      'Shortlisted by Managing Committee in the Sep 10th review. Drafting committee formed with 3 resident advocates.',
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'strat-2',
    title: 'High-Level Resident Delegation Meeting with Developer Managing Director',
    category: 'Builder Negotiation',
    description:
      'Organize an 8-member joint delegation (4 from Tower A, 4 from Tower B) to meet the Builder MD at their corporate headquarters with a structured agenda and minutes-of-meeting recording.',
    action_steps: [
      'Submit written appointment request with 3 proposed dates.',
      'Prepare one-page dossier showing tanker expenditure vs municipal connection feasibility.',
      'Request written commitment on submission of Water Board application & demand draft receipt.',
      'Establish a weekly progress review WhatsApp group with builder liaison officer.',
    ],
    target_authority: 'Builder / Developer Management',
    estimated_timeline: '1 Week',
    budget_requirement: 'Zero Cost',
    author_name: 'Anand Kumar K',
    author_flat: 'B-1402',
    is_anonymous: false,
    willing_to_lead: true,
    status: 'In Action',
    upvotes: 41,
    upvoted_by_user_ids: ['seed-user-3'],
    comments: [
      {
        id: 'c3',
        strategy_id: 'strat-2',
        author_name: 'Karthik Behera',
        author_flat: 'B-901',
        comment: 'Count me in for the delegation meeting. We need clear timeline commitments in writing.',
        is_volunteer_offer: true,
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      },
    ],
    official_notes:
      'Meeting scheduled for coming Saturday 11:00 AM at builder head office. Delegation members confirmed.',
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'strat-3',
    title: 'Joint Representation to Municipal Water Board Chief Engineer & Ward Councillor',
    category: 'Municipal & Water Board',
    description:
      'Visit the local Zonal Water Supply office with property tax receipts and building sanction copy to understand why the municipal feeder line branch connection is pending and verify whether builder has paid the road-cutting charges.',
    action_steps: [
      'Verify if builder has officially applied for bulk connection file number.',
      'Check if road-cutting permission fees have been paid to Municipal Corporation.',
      'Request Ward Councillor endorsement letter highlighting 400+ family water security.',
      'Submit formal petition for fast-track inspection of society sump & pumping layout.',
    ],
    target_authority: 'Municipal Water Board (CMWSSB/BWSSB)',
    estimated_timeline: '3 Weeks',
    budget_requirement: 'Zero Cost / Minimal Documentation',
    author_name: 'M. Mathaiyan',
    author_flat: 'A-705',
    is_anonymous: false,
    willing_to_lead: true,
    status: 'Under Review',
    upvotes: 35,
    upvoted_by_user_ids: [],
    comments: [
      {
        id: 'c4',
        strategy_id: 'strat-3',
        author_name: 'Venkat Raman',
        author_flat: 'A-1002',
        comment: 'I personally know the retired AE from the water board division; I can help facilitate this meeting.',
        is_volunteer_offer: true,
        created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      },
    ],
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'strat-4',
    title: 'File Multi-Point RTI on Society Water Infrastructure Sanctions & Pipeline Approval',
    category: 'Media & Public RTI',
    description:
      'Submit Right to Information (RTI) applications with the Urban Development Authority & Water Supply Board to retrieve exact records of builder undertakings, NOC clearances, and infrastructure handover status.',
    action_steps: [
      'Draft 5 targeted RTI questions regarding BPS Twin Towers project sanction conditions.',
      'File online via State RTI Portal with nominal ₹10 fee.',
      'Use the RTI response as incontrovertible documentary evidence during builder and legal meetings.',
    ],
    target_authority: 'RERA Authority',
    estimated_timeline: '30 Days (Statutory RTI period)',
    budget_requirement: '₹50 RTI Fees',
    author_name: 'Subramanian R',
    author_flat: 'B-501',
    is_anonymous: false,
    willing_to_lead: true,
    status: 'Under Review',
    upvotes: 29,
    upvoted_by_user_ids: [],
    comments: [],
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'strat-5',
    title: 'Society Underground Sump & Dual-Piping Readiness Audit',
    category: 'Society Infrastructure',
    description:
      'Perform a technical inspection of our society raw water vs municipal potable water sump chambers, bulk flow meter provisions, and internal booster pumps to ensure zero delay on the day municipal supply is activated.',
    action_steps: [
      'Inspect 1.5 Lakh Litre underground municipal storage chamber.',
      'Check pipeline valve segregation between borewell/tanker line and incoming municipal supply line.',
      'Ensure society water treatment plant (WTP) filters and bypass line are fully serviced.',
    ],
    target_authority: 'Society Task Force',
    estimated_timeline: '4 Days',
    budget_requirement: 'Society Maintenance Budget',
    author_name: 'G. Sundaram (Technical Lead)',
    author_flat: 'A-301',
    is_anonymous: false,
    willing_to_lead: true,
    status: 'In Action',
    upvotes: 32,
    upvoted_by_user_ids: [],
    comments: [],
    official_notes: 'Plumbing supervisor and facility manager assigned to complete sump audit by Friday.',
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
];

const INITIAL_SURVEY: PulseSurveyResponse = {
  total_votes: 118,
  builder_delegation_willing: 86,
  legal_notice_support: 104,
  water_board_visit_willing: 62,
  user_voted_options: [],
};

/**
 * Get all water connection strategies
 */
export async function fetchWaterStrategies(): Promise<WaterStrategyItem[]> {
  try {
    // Try Supabase table if it exists
    const { data, error } = await supabase
      .from('water_strategies' as any)
      .select('*')
      .order('upvotes', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as unknown as WaterStrategyItem[];
    }
  } catch {
    // Fallback to local storage
  }

  const cached = localStorage.getItem(STORAGE_KEY_STRATEGIES);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // parse error
    }
  }

  // Seed default
  localStorage.setItem(STORAGE_KEY_STRATEGIES, JSON.stringify(INITIAL_STRATEGIES));
  return INITIAL_STRATEGIES;
}

/**
 * Save / update strategies in local cache and try remote sync
 */
function saveStrategiesLocal(strategies: WaterStrategyItem[]) {
  localStorage.setItem(STORAGE_KEY_STRATEGIES, JSON.stringify(strategies));
}

/**
 * Create a new Strategy submission
 */
export async function createWaterStrategy(
  payload: Omit<
    WaterStrategyItem,
    'id' | 'status' | 'upvotes' | 'upvoted_by_user_ids' | 'comments' | 'created_at' | 'updated_at'
  >
): Promise<WaterStrategyItem> {
  const newStrategy: WaterStrategyItem = {
    ...payload,
    id: 'strat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    status: 'Under Review',
    upvotes: 1,
    upvoted_by_user_ids: payload.author_id ? [payload.author_id] : [],
    comments: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const existing = await fetchWaterStrategies();
  const updated = [newStrategy, ...existing];
  saveStrategiesLocal(updated);

  try {
    await supabase.from('water_strategies' as any).insert(newStrategy as any);
  } catch {
    // Ignore remote fallback
  }

  return newStrategy;
}

/**
 * Toggle upvote / endorsement for a strategy
 */
export async function toggleStrategyUpvote(
  strategyId: string,
  userId: string
): Promise<{ upvoted: boolean; newCount: number }> {
  const existing = await fetchWaterStrategies();
  const target = existing.find((s) => s.id === strategyId);
  if (!target) throw new Error('Strategy not found');

  const hasUpvoted = target.upvoted_by_user_ids.includes(userId);
  if (hasUpvoted) {
    target.upvoted_by_user_ids = target.upvoted_by_user_ids.filter((id) => id !== userId);
    target.upvotes = Math.max(0, target.upvotes - 1);
  } else {
    target.upvoted_by_user_ids.push(userId);
    target.upvotes += 1;
  }
  target.updated_at = new Date().toISOString();

  saveStrategiesLocal(existing);

  try {
    await supabase
      .from('water_strategies' as any)
      .update({
        upvotes: target.upvotes,
        upvoted_by_user_ids: target.upvoted_by_user_ids,
        updated_at: target.updated_at,
      } as any)
      .eq('id', strategyId);
  } catch {
    // ignore
  }

  return { upvoted: !hasUpvoted, newCount: target.upvotes };
}

/**
 * Add a comment or offer of volunteer help to a strategy
 */
export async function addStrategyComment(
  strategyId: string,
  commentData: {
    author_name: string;
    author_flat: string;
    author_id?: string;
    comment: string;
    is_volunteer_offer: boolean;
  }
): Promise<StrategyComment> {
  const newComment: StrategyComment = {
    id: 'comm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    strategy_id: strategyId,
    ...commentData,
    created_at: new Date().toISOString(),
  };

  const existing = await fetchWaterStrategies();
  const target = existing.find((s) => s.id === strategyId);
  if (!target) throw new Error('Strategy not found');

  target.comments = [...(target.comments || []), newComment];
  target.updated_at = new Date().toISOString();
  saveStrategiesLocal(existing);

  try {
    await supabase
      .from('water_strategies' as any)
      .update({
        comments: target.comments,
        updated_at: target.updated_at,
      } as any)
      .eq('id', strategyId);
  } catch {
    // ignore
  }

  return newComment;
}

/**
 * Update strategy status (Admin / Task Force action)
 */
export async function updateStrategyStatus(
  strategyId: string,
  status: StrategyStatus,
  officialNotes?: string
): Promise<void> {
  const existing = await fetchWaterStrategies();
  const target = existing.find((s) => s.id === strategyId);
  if (!target) throw new Error('Strategy not found');

  target.status = status;
  if (officialNotes !== undefined) {
    target.official_notes = officialNotes;
  }
  target.updated_at = new Date().toISOString();
  saveStrategiesLocal(existing);

  try {
    await supabase
      .from('water_strategies' as any)
      .update({
        status: target.status,
        official_notes: target.official_notes,
        updated_at: target.updated_at,
      } as any)
      .eq('id', strategyId);
  } catch {
    // ignore
  }
}

/**
 * Fetch community pulse survey stats
 */
export async function fetchPulseSurvey(): Promise<PulseSurveyResponse> {
  const cached = localStorage.getItem(STORAGE_KEY_SURVEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_KEY_SURVEY, JSON.stringify(INITIAL_SURVEY));
  return INITIAL_SURVEY;
}

/**
 * Vote in community pulse survey
 */
export async function submitPulseSurveyVote(options: string[]): Promise<PulseSurveyResponse> {
  const current = await fetchPulseSurvey();
  const updated: PulseSurveyResponse = {
    ...current,
    total_votes: current.total_votes + 1,
    builder_delegation_willing: options.includes('delegation')
      ? current.builder_delegation_willing + 1
      : current.builder_delegation_willing,
    legal_notice_support: options.includes('legal')
      ? current.legal_notice_support + 1
      : current.legal_notice_support,
    water_board_visit_willing: options.includes('water_board')
      ? current.water_board_visit_willing + 1
      : current.water_board_visit_willing,
    user_voted_options: options,
  };

  localStorage.setItem(STORAGE_KEY_SURVEY, JSON.stringify(updated));
  return updated;
}
