export interface SurveyQuestion {
  id: string;
  title: string;
  subtitle?: string;
  type: 'rating' | 'single-choice' | 'multi-choice' | 'text';
  category: 'water' | 'power' | 'lift' | 'security' | 'cleanliness' | 'general';
  options?: { value: string; label: string; icon?: string; badge?: string }[];
  maxRating?: number;
  required?: boolean;
}

export interface SurveyTemplate {
  id: string;
  title: string;
  tagline: string;
  description: string;
  badge: string;
  estimatedTime: string;
  targetAudience: string;
  isActive: boolean;
  totalResponses: number;
  satisfactionScore: number;
  bannerColor: string;
  questions: SurveyQuestion[];
}

export const SAMPLE_SURVEYS: SurveyTemplate[] = [
  {
    id: 'society-operations-pulse',
    title: 'Society Operations & Essential Services Pulse',
    tagline: 'Lifts, Water Supply, DG Power Backup & Housekeeping Assessment',
    description: 'Help the Management Committee prioritize immediate maintenance, vendor servicing, and infrastructure upgrades across Tower A and Tower B.',
    badge: 'High Priority',
    estimatedTime: '2 mins',
    targetAudience: 'All Residents (Tower A & B)',
    isActive: true,
    totalResponses: 142,
    satisfactionScore: 84,
    bannerColor: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
    questions: [
      {
        id: 'water_supply',
        title: 'Water Supply & Quality',
        subtitle: 'Rate the consistency of municipal/tanker water timing, pressure, and clarity in your flat.',
        type: 'rating',
        category: 'water',
        maxRating: 5,
        required: true,
      },
      {
        id: 'lift_performance',
        title: 'Elevator / Lift Operations',
        subtitle: 'How satisfied are you with lift availability, jerk-free transit, and breakdown response times?',
        type: 'rating',
        category: 'lift',
        maxRating: 5,
        required: true,
      },
      {
        id: 'power_backup',
        title: 'DG Generator & Power Backup',
        subtitle: 'How smooth is the switchover during power cuts and voltage stability?',
        type: 'rating',
        category: 'power',
        maxRating: 5,
        required: true,
      },
      {
        id: 'cleanliness',
        title: 'Common Area Housekeeping & Hygiene',
        subtitle: 'Daily corridor sweeping, garbage collection, and basement cleanliness.',
        type: 'rating',
        category: 'cleanliness',
        maxRating: 5,
        required: true,
      },
      {
        id: 'top_priority_issue',
        title: 'What single issue requires the MOST urgent attention by the MC this month?',
        type: 'single-choice',
        category: 'general',
        required: true,
        options: [
          { value: 'lift_servicing', label: 'Lift AMC & sensor servicing (Tower A/B)', badge: 'Critical' },
          { value: 'water_metering', label: 'Water pump maintenance / pipeline pressure', badge: 'Daily Impact' },
          { value: 'parking_discipline', label: 'Basement parking slot violations & visitor parking', badge: 'Civic' },
          { value: 'security_diligence', label: 'Security guard alertness & night patrols', badge: 'Safety' },
          { value: 'pest_control', label: 'Society-wide fogging & pest control', badge: 'Health' },
        ],
      },
      {
        id: 'suggestions',
        title: 'Any specific suggestions, pain points, or observations for your tower/floor?',
        subtitle: 'Your feedback will be reviewed in the upcoming Management Committee review.',
        type: 'text',
        category: 'general',
        required: false,
      },
    ],
  },
  {
    id: 'security-visitor-review',
    title: 'Security & Gate Management Review',
    tagline: 'Main Gate Access, Visitor App Passes & Night Patrol Feedback',
    description: 'Evaluating security guard protocols, digital visitor verification speed, and vehicle parking management.',
    badge: 'Safety First',
    estimatedTime: '3 mins',
    targetAudience: 'Tower A & Tower B Residents',
    isActive: true,
    totalResponses: 98,
    satisfactionScore: 78,
    bannerColor: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    questions: [
      {
        id: 'gate_verification',
        title: 'How diligently do gate guards verify unfamiliar delivery agents and cabs?',
        type: 'single-choice',
        category: 'security',
        required: true,
        options: [
          { value: 'always', label: 'Always — Strict call / pass confirmation every time' },
          { value: 'mostly', label: 'Mostly — Occasionally let regular delivery agents pass' },
          { value: 'rarely', label: 'Rarely — Gate verification is too lenient' },
          { value: 'unsure', label: 'Not sure / Haven’t observed' },
        ],
      },
      {
        id: 'app_gate_pass_rating',
        title: 'Digital Visitor Pass Convenience',
        subtitle: 'How easy and reliable is approving visitors through the BPS Twin Towers App?',
        type: 'rating',
        category: 'security',
        maxRating: 5,
        required: true,
      },
      {
        id: 'security_improvements',
        title: 'Which security enhancements would you like prioritized?',
        type: 'multi-choice',
        category: 'security',
        options: [
          { value: 'cctv_blindspots', label: 'Additional CCTV cameras in stairwells & terrace' },
          { value: 'boom_barrier', label: 'Automated RFID Boom Barrier for resident vehicles' },
          { value: 'night_patrols', label: 'Hourly guard baton rounds with checkpoint logs' },
          { value: 'speed_breakers', label: 'Basement driveway convex mirrors & speed checks' },
        ],
      },
      {
        id: 'security_comments',
        title: 'Specific security or guard feedback',
        type: 'text',
        category: 'security',
      },
    ],
  },
  {
    id: 'monsoon-preparedness',
    title: 'Monsoon & Drainage Preparedness Survey',
    tagline: 'Waterproofing, Storm Water Drains & Terrace Leak Checks',
    description: 'Pre-monsoon audit to detect terrace seepage, basement rain runoff, and DG room waterproofing before peak rains.',
    badge: 'Seasonal Audit',
    estimatedTime: '2 mins',
    targetAudience: 'Top Floor & Basement Stakeholders',
    isActive: true,
    totalResponses: 64,
    satisfactionScore: 71,
    bannerColor: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    questions: [
      {
        id: 'seepage_experienced',
        title: 'Have you noticed any dampness, seepage, or wall leaks in your flat or corridor?',
        type: 'single-choice',
        category: 'water',
        required: true,
        options: [
          { value: 'no_issues', label: 'No issues observed' },
          { value: 'minor_dampness', label: 'Minor external wall moisture / peeling paint' },
          { value: 'active_seepage', label: 'Active water dripping / seepage near duct or ceiling' },
        ],
      },
      {
        id: 'drainage_rating',
        title: 'Society Storm-Water Drainage Effectiveness',
        subtitle: 'Rating of water runoff flow around podium and basement ramps.',
        type: 'rating',
        category: 'cleanliness',
        maxRating: 5,
        required: true,
      },
      {
        id: 'monsoon_notes',
        title: 'Specific location notes (e.g., Tower A Flat 402 Duct / Ramp B)',
        type: 'text',
        category: 'general',
      },
    ],
  },
];

export interface CommunityResultsStat {
  totalParticipants: number;
  towerABreakdown: { towerA: number; towerB: number };
  overallSatisfaction: number;
  ratingsSummary: {
    category: string;
    label: string;
    average: number;
    distribution: { stars: number; percentage: number }[];
  }[];
  topPriorities: { label: string; percentage: number; count: number }[];
  keyFeedbackQuotes: { tower: 'Tower A' | 'Tower B'; role: string; quote: string; date: string }[];
}

export const SAMPLE_COMMUNITY_ANALYTICS: CommunityResultsStat = {
  totalParticipants: 142,
  towerABreakdown: { towerA: 78, towerB: 64 },
  overallSatisfaction: 84,
  ratingsSummary: [
    {
      category: 'water',
      label: '💧 Water Supply & Timing',
      average: 4.4,
      distribution: [
        { stars: 5, percentage: 56 },
        { stars: 4, percentage: 32 },
        { stars: 3, percentage: 8 },
        { stars: 2, percentage: 3 },
        { stars: 1, percentage: 1 },
      ],
    },
    {
      category: 'lift',
      label: '🛗 Lift & Elevator Reliability',
      average: 3.9,
      distribution: [
        { stars: 5, percentage: 40 },
        { stars: 4, percentage: 28 },
        { stars: 3, percentage: 18 },
        { stars: 2, percentage: 10 },
        { stars: 1, percentage: 4 },
      ],
    },
    {
      category: 'power',
      label: '⚡ DG Power Backup Switchover',
      average: 4.6,
      distribution: [
        { stars: 5, percentage: 68 },
        { stars: 4, percentage: 24 },
        { stars: 3, percentage: 6 },
        { stars: 2, percentage: 2 },
        { stars: 1, percentage: 0 },
      ],
    },
    {
      category: 'cleanliness',
      label: '🧹 Common Area Housekeeping',
      average: 4.2,
      distribution: [
        { stars: 5, percentage: 48 },
        { stars: 4, percentage: 36 },
        { stars: 3, percentage: 11 },
        { stars: 2, percentage: 3 },
        { stars: 1, percentage: 2 },
      ],
    },
  ],
  topPriorities: [
    { label: 'Lift AMC sensor overhaul & door calibration', percentage: 42, count: 60 },
    { label: 'Basement visitor parking regulation', percentage: 26, count: 37 },
    { label: 'Water pump schedule & pressure normalization', percentage: 18, count: 26 },
    { label: 'Night security patrol logging', percentage: 14, count: 19 },
  ],
  keyFeedbackQuotes: [
    {
      tower: 'Tower A',
      role: 'Owner Resident (Flat A-704)',
      quote: 'Power backup response is outstanding. However, Passenger Lift 2 in Tower A has occasional door sensor delays on 7th floor that need AMC attention.',
      date: 'Yesterday',
    },
    {
      tower: 'Tower B',
      role: 'Tenant (Flat B-302)',
      quote: 'Corridor cleanliness and garbage collection are very regular. The PWA digital pass makes food delivery seamless.',
      date: '2 days ago',
    },
    {
      tower: 'Tower A',
      role: 'Owner Resident (Flat A-1201)',
      quote: 'Appreciate the water initiative updates. Requesting regular basement drain cleaning before peak monsoon rains.',
      date: '3 days ago',
    },
  ],
};
