export type GaneshContributionType = 'General Contribution' | 'Pooja Item' | 'Mahaprasadam' | 'Pujari Dakshina' | 'Laddu Auction' | 'Flowers & Decoration' | 'Sound & Light' | 'Visarjan & Band' | 'Other';

export type GaneshPaymentMode = 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque';

export type GaneshPaymentStatus = 'Verified' | 'Pending' | 'Rejected';

export interface GaneshContributionRecord {
  id: string;
  slNo?: number;
  donorName: string;
  flatNo: string;
  tower: 'A' | 'B' | 'Other';
  amount: number;
  contributionType: GaneshContributionType;
  isSponsor: boolean;
  sponsorCategory?: string; // e.g., 'Pooja Item Sponsor', 'Mahaprasadam Sponsor', 'Pujari Sponsor'
  paymentMode: GaneshPaymentMode;
  transactionRef?: string;
  notes?: string;
  verified: boolean;
  createdAt: string;
}

export interface GaneshFamilyMember {
  id: string;
  name: string;
  relationship?: string;
  rasi?: string;
  nakshatram?: string;
}

export interface GaneshSankalpamRecord {
  id: string;
  flatNo: string;
  tower: 'A' | 'B' | 'Other';
  primaryResidentName: string;
  contactMobile?: string;
  gothram: string;
  familyMembers: GaneshFamilyMember[];
  preferredPujaDate?: string;
  specialPrayers?: string;
  prasadOptIn?: boolean;
  submittedAt: string;
}

export type GaneshExpenseCategory =
  | 'Idol & Visarjan'
  | 'Priest & Puja Samagri'
  | 'Mahaprasadam & Food'
  | 'Pandal & Decoration'
  | 'Sound & Lighting'
  | 'Cultural Events & Gifts'
  | 'Security & Cleaning'
  | 'Misc & Contingency';

export interface GaneshExpenseRecord {
  id: string;
  title: string;
  category: GaneshExpenseCategory;
  amount: number;
  paidTo: string;
  paymentMode: GaneshPaymentMode;
  expenseDate: string;
  invoiceNo?: string;
  receiptUrl?: string;
  approvedBy?: string;
  notes?: string;
  status: 'Paid' | 'Pending Reimbursement' | 'Planned';
  createdAt: string;
}

export interface GaneshFinancialSummary {
  targetBudget: number;
  totalContributions: number;
  totalSponsorships: number;
  totalCollections: number;
  totalExpenses: number;
  netBalance: number;
  totalContributorsCount: number;
  totalSponsorsCount: number;
  towerAAmount: number;
  towerBAmount: number;
  towerACount: number;
  towerBCount: number;
  sankalpamCount: number;
}
