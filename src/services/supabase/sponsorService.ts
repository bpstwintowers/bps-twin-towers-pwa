import { supabase } from './client';

export type SponsorType =
  | 'Individual'
  | 'Business'
  | 'Organization'
  | 'Community Member'
  | 'Vendor'
  | 'Other';

export type SponsorStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Active'
  | 'Inactive'
  | 'Rejected'
  | 'Cancelled';

export type SponsorshipStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Active'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled';

export type SponsorshipVisibility = 'Public' | 'Community Only' | 'Private';

export type ContributionType = 'Monetary' | 'In-Kind' | 'Service' | 'Other';

export type ContributionStatus = 'Pending' | 'Verified' | 'Rejected' | 'Cancelled';

export interface SponsorTierItem {
  id: string;
  name: string;
  description: string | null;
  minimum_amount: number;
  benefits: string[];
  display_order: number;
  status: 'Active' | 'Inactive' | 'Archived';
  created_at: string;
  updated_at: string;
}

export interface SponsorItem {
  id: string;
  sponsor_type: SponsorType;
  name: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  profile_id: string | null;
  status: SponsorStatus;
  rejection_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SponsorshipItem {
  id: string;
  sponsor_id: string;
  event_id: string | null;
  campaign_id: string | null;
  tier_id: string | null;
  status: SponsorshipStatus;
  visibility: SponsorshipVisibility;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  sponsor?: SponsorItem;
  tier?: SponsorTierItem;
  event?: {
    id: string;
    title: string;
    category: string;
  } | null;
  campaign?: {
    id: string;
    title: string;
    category: string;
  } | null;
  contributions?: SponsorContributionItem[];
}

export interface SponsorContributionItem {
  id: string;
  sponsorship_id: string;
  contribution_type: ContributionType;
  amount: number | null;
  payment_method: string | null;
  payment_reference: string | null;
  receipt_number: string | null;
  in_kind_description: string | null;
  in_kind_quantity: number | null;
  in_kind_unit: string | null;
  in_kind_estimated_value: number | null;
  status: ContributionStatus;
  rejection_reason: string | null;
  verified_by: string | null;
  verified_at: string | null;
  contributed_at: string;
  created_at: string;
  updated_at: string;
  sponsorship?: SponsorshipItem;
}

export interface SponsorSummary {
  total_sponsors: number;
  active_sponsorships: number;
  pending_approvals: number;
  pending_contributions: number;
  verified_cash_amount: number;
  verified_in_kind_estimated_value: number;
  total_sponsorship_value: number;
}

export interface SubmitSponsorshipPayload {
  sponsor_name: string;
  sponsor_type: SponsorType;
  contact_name: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  event_id?: string;
  campaign_id?: string;
  tier_id?: string;
  contribution_type: ContributionType;
  amount?: number;
  payment_method?: string;
  payment_reference?: string;
  in_kind_description?: string;
  in_kind_quantity?: number;
  in_kind_unit?: string;
  in_kind_estimated_value?: number;
}

export interface CreateTierPayload {
  name: string;
  description?: string;
  minimum_amount: number;
  benefits: string[];
  display_order: number;
}

export interface CreateSponsorPayload {
  sponsor_type: SponsorType;
  name: string;
  contact_name: string;
  email?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  description?: string;
  profile_id?: string;
}

// ---------- RESIDENT QUERIES & APPLICATIONS ----------

export async function fetchSponsorTiers(): Promise<SponsorTierItem[]> {
  const { data, error } = await supabase
    .from('sponsor_tiers')
    .select('*')
    .eq('status', 'Active')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data || []).map((t: any) => ({
    ...t,
    minimum_amount: Number(t.minimum_amount || 0),
  }));
}

export async function fetchPublicSponsorships(
  eventId?: string,
  campaignId?: string
): Promise<SponsorshipItem[]> {
  let query = supabase
    .from('sponsorships')
    .select(`
      *,
      sponsor:sponsors ( * ),
      tier:sponsor_tiers ( * ),
      event:events ( id, title, category ),
      campaign:donation_campaigns ( id, title, category )
    `)
    .in('status', ['Approved', 'Active'])
    .in('visibility', ['Public', 'Community Only'])
    .order('created_at', { ascending: false });

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as SponsorshipItem[];
}

export async function fetchUserSponsorships(): Promise<SponsorshipItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data, error } = await supabase
    .from('sponsorships')
    .select(`
      *,
      sponsor:sponsors ( * ),
      tier:sponsor_tiers ( * ),
      event:events ( id, title, category ),
      campaign:donation_campaigns ( id, title, category ),
      contributions:sponsor_contributions ( * )
    `)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((s: any) => ({
    ...s,
    contributions: (s.contributions || []).map((c: any) => ({
      ...c,
      amount: c.amount ? Number(c.amount) : null,
      in_kind_estimated_value: c.in_kind_estimated_value ? Number(c.in_kind_estimated_value) : null,
      in_kind_quantity: c.in_kind_quantity ? Number(c.in_kind_quantity) : null,
    })),
  }));
}

export async function submitSponsorApplication(payload: SubmitSponsorshipPayload): Promise<any> {
  const { data, error } = await supabase.rpc('submit_sponsor_application', {
    p_sponsor_name: payload.sponsor_name,
    p_sponsor_type: payload.sponsor_type,
    p_contact_name: payload.contact_name,
    p_email: payload.email || '',
    p_phone: payload.phone || '',
    p_website: payload.website || '',
    p_description: payload.description || '',
    p_event_id: payload.event_id || null,
    p_campaign_id: payload.campaign_id || null,
    p_tier_id: payload.tier_id || null,
    p_contribution_type: payload.contribution_type,
    p_amount: payload.amount || null,
    p_payment_method: payload.payment_method || null,
    p_payment_reference: payload.payment_reference || '',
    p_in_kind_description: payload.in_kind_description || null,
    p_in_kind_quantity: payload.in_kind_quantity || null,
    p_in_kind_unit: payload.in_kind_unit || '',
    p_in_kind_estimated_value: payload.in_kind_estimated_value || null,
  });

  if (error) throw error;
  return data;
}

// ---------- ADMIN & FINANCE OPERATIONS ----------

export async function fetchSponsorSummary(): Promise<SponsorSummary> {
  const { data, error } = await supabase.rpc('get_sponsor_summary');
  if (error) throw error;
  return data as SponsorSummary;
}

export async function fetchAdminSponsors(
  typeFilter?: string,
  statusFilter?: string,
  search?: string
): Promise<SponsorItem[]> {
  let query = supabase.from('sponsors').select('*').order('created_at', { ascending: false });

  if (typeFilter && typeFilter !== 'ALL') {
    query = query.eq('sponsor_type', typeFilter);
  }

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.eq('status', statusFilter);
  }

  if (search && search.trim().length > 0) {
    query = query.or(`name.ilike.%${search.trim()}%,contact_name.ilike.%${search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as SponsorItem[];
}

export async function createAdminSponsor(payload: CreateSponsorPayload): Promise<SponsorItem> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('sponsors')
    .insert({
      sponsor_type: payload.sponsor_type,
      name: payload.name.trim(),
      contact_name: payload.contact_name.trim(),
      email: payload.email?.trim() || null,
      phone: payload.phone?.trim() || null,
      website: payload.website?.trim() || null,
      logo_url: payload.logo_url?.trim() || null,
      description: payload.description?.trim() || null,
      profile_id: payload.profile_id || null,
      status: 'Active',
      created_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as SponsorItem;
}

export async function updateAdminSponsor(
  id: string,
  payload: Partial<CreateSponsorPayload>
): Promise<SponsorItem> {
  const { data, error } = await supabase
    .from('sponsors')
    .update({
      ...(payload.name && { name: payload.name.trim() }),
      ...(payload.contact_name && { contact_name: payload.contact_name.trim() }),
      ...(payload.email !== undefined && { email: payload.email?.trim() || null }),
      ...(payload.phone !== undefined && { phone: payload.phone?.trim() || null }),
      ...(payload.website !== undefined && { website: payload.website?.trim() || null }),
      ...(payload.logo_url !== undefined && { logo_url: payload.logo_url?.trim() || null }),
      ...(payload.description !== undefined && { description: payload.description?.trim() || null }),
      ...(payload.sponsor_type && { sponsor_type: payload.sponsor_type }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as SponsorItem;
}

export async function fetchAdminSponsorships(
  eventId?: string,
  campaignId?: string,
  statusFilter?: string
): Promise<SponsorshipItem[]> {
  let query = supabase
    .from('sponsorships')
    .select(`
      *,
      sponsor:sponsors ( * ),
      tier:sponsor_tiers ( * ),
      event:events ( id, title, category ),
      campaign:donation_campaigns ( id, title, category ),
      contributions:sponsor_contributions ( * )
    `)
    .order('created_at', { ascending: false });

  if (eventId && eventId !== 'ALL') {
    query = query.eq('event_id', eventId);
  }

  if (campaignId && campaignId !== 'ALL') {
    query = query.eq('campaign_id', campaignId);
  }

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((s: any) => ({
    ...s,
    contributions: (s.contributions || []).map((c: any) => ({
      ...c,
      amount: c.amount ? Number(c.amount) : null,
      in_kind_estimated_value: c.in_kind_estimated_value ? Number(c.in_kind_estimated_value) : null,
      in_kind_quantity: c.in_kind_quantity ? Number(c.in_kind_quantity) : null,
    })),
  }));
}

export async function approveAdminSponsorship(sponsorshipId: string): Promise<any> {
  const { data, error } = await supabase.rpc('admin_approve_sponsorship', {
    p_sponsorship_id: sponsorshipId,
  });

  if (error) throw error;
  return data;
}

export async function rejectAdminSponsorship(sponsorshipId: string, reason: string): Promise<any> {
  const { data, error } = await supabase.rpc('admin_reject_sponsorship', {
    p_sponsorship_id: sponsorshipId,
    p_reason: reason.trim(),
  });

  if (error) throw error;
  return data;
}

export async function fetchAdminContributions(
  sponsorshipId?: string,
  typeFilter?: string,
  statusFilter?: string
): Promise<SponsorContributionItem[]> {
  let query = supabase
    .from('sponsor_contributions')
    .select(`
      *,
      sponsorship:sponsorships (
        id,
        sponsor:sponsors ( name, sponsor_type ),
        event:events ( title ),
        campaign:donation_campaigns ( title )
      )
    `)
    .order('contributed_at', { ascending: false });

  if (sponsorshipId && sponsorshipId !== 'ALL') {
    query = query.eq('sponsorship_id', sponsorshipId);
  }

  if (typeFilter && typeFilter !== 'ALL') {
    query = query.eq('contribution_type', typeFilter);
  }

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((c: any) => ({
    ...c,
    amount: c.amount ? Number(c.amount) : null,
    in_kind_estimated_value: c.in_kind_estimated_value ? Number(c.in_kind_estimated_value) : null,
    in_kind_quantity: c.in_kind_quantity ? Number(c.in_kind_quantity) : null,
  }));
}

export async function verifyAdminContribution(contributionId: string): Promise<any> {
  const { data, error } = await supabase.rpc('admin_verify_sponsor_contribution', {
    p_contribution_id: contributionId,
  });

  if (error) throw error;
  return data;
}

export async function rejectAdminContribution(contributionId: string, reason: string): Promise<any> {
  const { data, error } = await supabase.rpc('admin_reject_sponsor_contribution', {
    p_contribution_id: contributionId,
    p_reason: reason.trim(),
  });

  if (error) throw error;
  return data;
}

export async function createAdminTier(payload: CreateTierPayload): Promise<SponsorTierItem> {
  const { data, error } = await supabase
    .from('sponsor_tiers')
    .insert({
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      minimum_amount: payload.minimum_amount,
      benefits: payload.benefits,
      display_order: payload.display_order,
      status: 'Active',
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    minimum_amount: Number(data.minimum_amount || 0),
  } as SponsorTierItem;
}

export async function updateAdminTier(
  id: string,
  payload: Partial<CreateTierPayload>
): Promise<SponsorTierItem> {
  const { data, error } = await supabase
    .from('sponsor_tiers')
    .update({
      ...(payload.name && { name: payload.name.trim() }),
      ...(payload.description !== undefined && { description: payload.description?.trim() || null }),
      ...(payload.minimum_amount !== undefined && { minimum_amount: payload.minimum_amount }),
      ...(payload.benefits && { benefits: payload.benefits }),
      ...(payload.display_order !== undefined && { display_order: payload.display_order }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    minimum_amount: Number(data.minimum_amount || 0),
  } as SponsorTierItem;
}
