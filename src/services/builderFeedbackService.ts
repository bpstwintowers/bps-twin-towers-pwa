import { supabase } from './supabase/client';
import type {
  BuilderReview,
  BuilderFeedbackConfig,
} from '../types/builderFeedback';
import { DEFAULT_BUILDER_CONFIG } from '../types/builderFeedback';

const STORAGE_KEY = 'bps_builder_reviews_v1';
const CONFIG_KEY = 'bps_builder_config_v1';

// Seed demo reviews so the user immediately experiences realistic data
const SEED_REVIEWS: BuilderReview[] = [
  {
    id: 'rev-001',
    residentId: 'res-101',
    residentName: 'Rajesh Kumar & Family',
    flatNo: 'A-402',
    tower: 'Tower A',
    rating: 5,
    headline: 'Exceeded our expectations! Premium construction & pristine finishing.',
    comment: 'Moving into BPS Twin Towers has been a delightful journey. The builder team adhered strictly to the promised handover date. The quality of fittings, marble tiling, and cross-ventilation in Tower A is stellar. Highly recommend BPS Developers!',
    aspectRatings: {
      constructionQuality: 5,
      amenitiesQuality: 5,
      handoverExperience: 5,
      communication: 4,
      valueForMoney: 5,
    },
    photos: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    ],
    tags: ['Solid Construction', 'Timely Handover', 'Great Amenities', 'Prime Location'],
    isVerifiedResident: true,
    handoverYear: '2024',
    postedToGoogle: true,
    status: 'featured',
    likesCount: 18,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: 'rev-002',
    residentId: 'res-102',
    residentName: 'Priya & Anand Sharma',
    flatNo: 'B-705',
    tower: 'Tower B',
    rating: 5,
    headline: 'Top-tier lifestyle amenities and seamless documentation process.',
    comment: 'The clubhouse, high-speed elevators, and landscaped walking tracks give a true luxury feel. The builder sales and engineering team were very patient with our custom tile requests during construction.',
    aspectRatings: {
      constructionQuality: 5,
      amenitiesQuality: 5,
      handoverExperience: 4,
      communication: 5,
      valueForMoney: 4,
    },
    photos: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    ],
    tags: ['Great Amenities', 'Clear Documentation', 'Modern Elevators', 'Secure Gated Campus'],
    isVerifiedResident: true,
    handoverYear: '2025',
    postedToGoogle: true,
    status: 'approved',
    likesCount: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'rev-003',
    residentId: 'res-103',
    residentName: 'Suresh Venkat',
    flatNo: 'A-1104',
    tower: 'Tower A',
    rating: 4,
    headline: 'Solid structure and great community layout',
    comment: 'Very pleased with the structural strength and 24/7 security features. Minor snag list items in the bathroom were quickly rectified within 48 hours of reporting. Trustworthy builder.',
    aspectRatings: {
      constructionQuality: 5,
      amenitiesQuality: 4,
      handoverExperience: 4,
      communication: 4,
      valueForMoney: 4,
    },
    photos: [],
    tags: ['Solid Construction', 'Responsive Management', 'Vastu Compliant'],
    isVerifiedResident: true,
    handoverYear: '2025',
    postedToGoogle: false,
    status: 'approved',
    likesCount: 6,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  }
];

export const getBuilderConfig = (): BuilderFeedbackConfig => {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error reading builder config:', e);
  }
  return DEFAULT_BUILDER_CONFIG;
};

export const saveBuilderConfig = (config: BuilderFeedbackConfig): void => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const fetchAllReviews = async (): Promise<BuilderReview[]> => {
  try {
    // Attempt Supabase fetch
    const { data, error } = await supabase
      .from('builder_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id,
        residentId: item.resident_id,
        residentName: item.resident_name,
        flatNo: item.flat_no,
        tower: item.tower,
        userEmail: item.user_email,
        rating: item.rating,
        headline: item.headline,
        comment: item.comment,
        aspectRatings: item.aspect_ratings || {
          constructionQuality: item.rating,
          amenitiesQuality: item.rating,
          handoverExperience: item.rating,
          communication: item.rating,
          valueForMoney: item.rating,
        },
        photos: item.photos || [],
        tags: item.tags || [],
        isVerifiedResident: item.is_verified_resident ?? true,
        handoverYear: item.handover_year,
        postedToGoogle: item.posted_to_google ?? false,
        status: item.status || 'approved',
        likesCount: item.likes_count || 0,
        adminNotes: item.admin_notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    }
  } catch (err) {
    console.warn('Supabase builder_reviews not available, using local cache:', err);
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    // Initialize seed reviews
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REVIEWS));
    return SEED_REVIEWS;
  } catch {
    return SEED_REVIEWS;
  }
};

export const submitBuilderReview = async (review: Omit<BuilderReview, 'id' | 'createdAt'>): Promise<BuilderReview> => {
  const newReview: BuilderReview = {
    ...review,
    id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString(),
  };

  // Try Supabase insert
  try {
    const { data, error } = await supabase
      .from('builder_reviews')
      .insert([
        {
          id: newReview.id,
          resident_id: newReview.residentId,
          resident_name: newReview.residentName,
          flat_no: newReview.flatNo,
          tower: newReview.tower,
          user_email: newReview.userEmail,
          rating: newReview.rating,
          headline: newReview.headline,
          comment: newReview.comment,
          aspect_ratings: newReview.aspectRatings,
          photos: newReview.photos,
          tags: newReview.tags,
          is_verified_resident: newReview.isVerifiedResident,
          handover_year: newReview.handoverYear,
          posted_to_google: newReview.postedToGoogle,
          status: newReview.status,
          created_at: newReview.createdAt,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      console.log('Saved review to Supabase');
    }
  } catch (err) {
    console.warn('Error saving to Supabase, saving to local store:', err);
  }

  // Always update local cache
  try {
    const current = await fetchAllReviews();
    const updated = [newReview, ...current.filter((r) => r.id !== newReview.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error updating local storage:', e);
  }

  return newReview;
};

export const updateReviewStatus = async (
  reviewId: string,
  status: BuilderReview['status'],
  adminNotes?: string
): Promise<void> => {
  try {
    await supabase
      .from('builder_reviews')
      .update({ status, admin_notes: adminNotes, updated_at: new Date().toISOString() })
      .eq('id', reviewId);
  } catch (err) {
    console.warn('Supabase update status failed:', err);
  }

  // Update local storage
  try {
    const current = await fetchAllReviews();
    const updated = current.map((r) =>
      r.id === reviewId ? { ...r, status, adminNotes: adminNotes ?? r.adminNotes } : r
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
};

export const markPostedToGoogle = async (reviewId: string): Promise<void> => {
  try {
    await supabase
      .from('builder_reviews')
      .update({ posted_to_google: true })
      .eq('id', reviewId);
  } catch (err) {
    console.warn('Supabase markPostedToGoogle failed:', err);
  }

  try {
    const current = await fetchAllReviews();
    const updated = current.map((r) =>
      r.id === reviewId ? { ...r, postedToGoogle: true } : r
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
};

export interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [stars: number]: number };
  aspectAverages: {
    constructionQuality: number;
    amenitiesQuality: number;
    handoverExperience: number;
    communication: number;
    valueForMoney: number;
  };
  verifiedCount: number;
  postedToGoogleCount: number;
}

export const computeReviewAnalytics = (reviews: BuilderReview[]): ReviewAnalytics => {
  if (!reviews.length) {
    return {
      totalReviews: 0,
      averageRating: 5.0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      aspectAverages: {
        constructionQuality: 5,
        amenitiesQuality: 5,
        handoverExperience: 5,
        communication: 5,
        valueForMoney: 5,
      },
      verifiedCount: 0,
      postedToGoogleCount: 0,
    };
  }

  const dist: { [stars: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sumRating = 0;
  let aspectSum = {
    constructionQuality: 0,
    amenitiesQuality: 0,
    handoverExperience: 0,
    communication: 0,
    valueForMoney: 0,
  };
  let verifiedCount = 0;
  let postedToGoogleCount = 0;

  for (const r of reviews) {
    const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
    dist[rounded] = (dist[rounded] || 0) + 1;
    sumRating += r.rating;

    if (r.aspectRatings) {
      aspectSum.constructionQuality += r.aspectRatings.constructionQuality || r.rating;
      aspectSum.amenitiesQuality += r.aspectRatings.amenitiesQuality || r.rating;
      aspectSum.handoverExperience += r.aspectRatings.handoverExperience || r.rating;
      aspectSum.communication += r.aspectRatings.communication || r.rating;
      aspectSum.valueForMoney += r.aspectRatings.valueForMoney || r.rating;
    } else {
      aspectSum.constructionQuality += r.rating;
      aspectSum.amenitiesQuality += r.rating;
      aspectSum.handoverExperience += r.rating;
      aspectSum.communication += r.rating;
      aspectSum.valueForMoney += r.rating;
    }

    if (r.isVerifiedResident) verifiedCount++;
    if (r.postedToGoogle) postedToGoogleCount++;
  }

  const total = reviews.length;

  return {
    totalReviews: total,
    averageRating: Number((sumRating / total).toFixed(1)),
    ratingDistribution: dist,
    aspectAverages: {
      constructionQuality: Number((aspectSum.constructionQuality / total).toFixed(1)),
      amenitiesQuality: Number((aspectSum.amenitiesQuality / total).toFixed(1)),
      handoverExperience: Number((aspectSum.handoverExperience / total).toFixed(1)),
      communication: Number((aspectSum.communication / total).toFixed(1)),
      valueForMoney: Number((aspectSum.valueForMoney / total).toFixed(1)),
    },
    verifiedCount,
    postedToGoogleCount,
  };
};
