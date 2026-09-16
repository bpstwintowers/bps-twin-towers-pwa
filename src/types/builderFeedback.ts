export interface AspectRatings {
  constructionQuality: number;   // 1-5
  amenitiesQuality: number;      // 1-5
  handoverExperience: number;    // 1-5
  communication: number;         // 1-5
  valueForMoney: number;         // 1-5
}

export type ReviewStatus = 'approved' | 'featured' | 'pending' | 'archived';

export interface BuilderReview {
  id: string;
  residentId: string;
  residentName: string;
  flatNo: string;
  tower: string;
  userEmail?: string;
  rating: number; // 1-5 overall stars
  headline: string;
  comment: string;
  aspectRatings: AspectRatings;
  photos: string[]; // data URLs or image URLs
  tags: string[]; // e.g. ["Spacious Layout", "Top Quality Lift", "Prompt Handover"]
  isVerifiedResident: boolean;
  handoverYear?: string;
  postedToGoogle?: boolean;
  status: ReviewStatus;
  likesCount?: number;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BuilderFeedbackConfig {
  builderName: string;
  societyName: string;
  googleReviewUrl: string;
  placeId?: string;
  supportPhone?: string;
  supportEmail?: string;
}

export const DEFAULT_BUILDER_CONFIG: BuilderFeedbackConfig = {
  builderName: 'BPS Developers & Builders',
  societyName: 'BPS Twin Towers',
  googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
  placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  supportPhone: '+91 98765 43210',
  supportEmail: 'feedback@bpstwintowers.com',
};

export const REVIEW_TAGS = [
  'Solid Construction',
  'Timely Handover',
  'Great Amenities',
  'Spacious Balconies',
  'Prime Location',
  'Clear Documentation',
  'Responsive Management',
  'Modern Elevators',
  'Vastu Compliant',
  'Good Cross Ventilation',
  'Lush Landscaping',
  'Secure Gated Campus'
];
