import { supabase } from './client';

export type CampaignCategory =
  | 'Festival'
  | 'Cultural'
  | 'Charity'
  | 'Emergency Fund'
  | 'Infrastructure'
  | 'Puja'
  | 'Sports'
  | 'Other';

export type CampaignStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Active'
  | 'Closed'
  | 'Cancelled';

export type PaymentMethod =
  | 'UPI'
  | 'Bank Transfer'
  | 'Cash'
  | 'Cheque'
  | 'Other';

export type DonationStatus =
  | 'Pending'
  | 'Verified'
  | 'Rejected'
  | 'Cancelled';

export interface CampaignItem {
  id: string;
  title: string;
  description: string | null;
  category: CampaignCategory;
  target_amount: number;
  start_date: string;
  end_date: string | null;
  banner_url: string | null;
  status: CampaignStatus;
  cancellation_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  verified_total?: number;
  donations_count?: number;
}

export interface DonationItem {
  id: string;
  campaign_id: string;
  user_id: string;
  flat_id: string | null;
  amount: number;
  payment_method: PaymentMethod;
  payment_reference: string | null;
  receipt_number: string | null;
  donor_name: string;
  donor_mobile: string | null;
  donor_email: string | null;
  notes: string | null;
  status: DonationStatus;
  rejection_reason: string | null;
  verified_by: string | null;
  verified_at: string | null;
  donated_at: string;
  created_at: string;
  updated_at: string;
  campaign?: CampaignItem;
  flat_number?: string;
  block_name?: string;
}

export interface FinanceSummary {
  total_campaigns: number;
  active_campaigns: number;
  total_target: number;
  total_verified_amount: number;
  total_pending_amount: number;
  verified_donations_count: number;
  pending_donations_count: number;
}

export interface CreateCampaignPayload {
  title: string;
  description?: string;
  category: CampaignCategory;
  target_amount: number;
  start_date: string;
  end_date?: string;
  banner_url?: string;
}

export interface SubmitDonationPayload {
  campaign_id: string;
  flat_id?: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  donor_name: string;
  donor_mobile?: string;
  donor_email?: string;
  notes?: string;
}

// ---------- RESIDENT CAMPAIGN & DONATION QUERIES ----------

export async function fetchActiveCampaigns(): Promise<CampaignItem[]> {
  const { data, error } = await supabase
    .from('donation_campaigns')
    .select(`
      *,
      donations ( id, status, amount )
    `)
    .in('status', ['Active', 'Closed'])
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => {
    const verified = (row.donations || []).filter((d: any) => d.status === 'Verified');
    const verifiedTotal = verified.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);

    return {
      ...row,
      target_amount: Number(row.target_amount || 0),
      verified_total: verifiedTotal,
      donations_count: verified.length,
    };
  });
}

export async function fetchCampaignDetails(campaignId: string): Promise<CampaignItem | null> {
  const { data, error } = await supabase
    .from('donation_campaigns')
    .select(`
      *,
      donations ( id, status, amount )
    `)
    .eq('id', campaignId)
    .single();

  if (error) throw error;
  if (!data) return null;

  const verified = (data.donations || []).filter((d: any) => d.status === 'Verified');
  const verifiedTotal = verified.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);

  return {
    ...data,
    target_amount: Number(data.target_amount || 0),
    verified_total: verifiedTotal,
    donations_count: verified.length,
  };
}

export async function fetchUserDonations(): Promise<DonationItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data, error } = await supabase
    .from('donations')
    .select(`
      *,
      donation_campaigns ( * ),
      flats (
        flat_number,
        blocks ( name )
      )
    `)
    .eq('user_id', user.id)
    .order('donated_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    amount: Number(row.amount || 0),
    campaign: row.donation_campaigns,
    flat_number: row.flats?.flat_number || '',
    block_name: row.flats?.blocks?.name || '',
  }));
}

export async function submitDonation(payload: SubmitDonationPayload): Promise<any> {
  const { data, error } = await supabase.rpc('submit_donation', {
    p_campaign_id: payload.campaign_id,
    p_flat_id: payload.flat_id || null,
    p_amount: payload.amount,
    p_payment_method: payload.payment_method,
    p_payment_reference: payload.payment_reference || '',
    p_donor_name: payload.donor_name,
    p_donor_mobile: payload.donor_mobile || '',
    p_donor_email: payload.donor_email || '',
    p_notes: payload.notes || '',
  });

  if (error) throw error;
  return data;
}

// ---------- ADMIN & FINANCE OPERATIONS ----------

export async function fetchFinanceSummary(): Promise<FinanceSummary> {
  const { data, error } = await supabase.rpc('get_finance_summary');
  if (error) throw error;
  return data as FinanceSummary;
}

export async function fetchAdminCampaigns(
  statusFilter?: string,
  categoryFilter?: string,
  search?: string
): Promise<CampaignItem[]> {
  let query = supabase
    .from('donation_campaigns')
    .select(`
      *,
      donations ( id, status, amount )
    `)
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.eq('status', statusFilter);
  }

  if (categoryFilter && categoryFilter !== 'ALL') {
    query = query.eq('category', categoryFilter);
  }

  if (search && search.trim().length > 0) {
    query = query.ilike('title', `%${search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row: any) => {
    const verified = (row.donations || []).filter((d: any) => d.status === 'Verified');
    const verifiedTotal = verified.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);

    return {
      ...row,
      target_amount: Number(row.target_amount || 0),
      verified_total: verifiedTotal,
      donations_count: verified.length,
    };
  });
}

export async function createAdminCampaign(payload: CreateCampaignPayload): Promise<CampaignItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data, error } = await supabase
    .from('donation_campaigns')
    .insert({
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      category: payload.category,
      target_amount: payload.target_amount,
      start_date: payload.start_date,
      end_date: payload.end_date || null,
      banner_url: payload.banner_url || null,
      status: 'Active',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CampaignItem;
}

export async function updateAdminCampaign(
  id: string,
  payload: Partial<CreateCampaignPayload>
): Promise<CampaignItem> {
  const { data, error } = await supabase
    .from('donation_campaigns')
    .update({
      ...(payload.title && { title: payload.title.trim() }),
      ...(payload.description !== undefined && { description: payload.description?.trim() || null }),
      ...(payload.category && { category: payload.category }),
      ...(payload.target_amount !== undefined && { target_amount: payload.target_amount }),
      ...(payload.start_date && { start_date: payload.start_date }),
      ...(payload.end_date !== undefined && { end_date: payload.end_date || null }),
      ...(payload.banner_url !== undefined && { banner_url: payload.banner_url || null }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CampaignItem;
}

export async function activateAdminCampaign(campaignId: string): Promise<any> {
  const { data, error } = await supabase.rpc('admin_activate_campaign', {
    p_campaign_id: campaignId,
  });
  if (error) throw error;
  return data;
}

export async function closeAdminCampaign(campaignId: string): Promise<any> {
  const { data, error } = await supabase.rpc('admin_close_campaign', {
    p_campaign_id: campaignId,
  });
  if (error) throw error;
  return data;
}

export async function fetchAdminDonations(
  campaignId?: string,
  statusFilter?: string,
  search?: string
): Promise<DonationItem[]> {
  let query = supabase
    .from('donations')
    .select(`
      *,
      donation_campaigns ( id, title, category ),
      flats (
        flat_number,
        blocks ( name )
      )
    `)
    .order('donated_at', { ascending: false });

  if (campaignId && campaignId !== 'ALL') {
    query = query.eq('campaign_id', campaignId);
  }

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.eq('status', statusFilter);
  }

  if (search && search.trim().length > 0) {
    const q = search.trim();
    query = query.or(`donor_name.ilike.%${q}%,payment_reference.ilike.%${q}%,receipt_number.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    amount: Number(row.amount || 0),
    campaign: row.donation_campaigns,
    flat_number: row.flats?.flat_number || '',
    block_name: row.flats?.blocks?.name || '',
  }));
}

export async function verifyAdminDonation(donationId: string): Promise<any> {
  const { data, error } = await supabase.rpc('admin_verify_donation', {
    p_donation_id: donationId,
  });
  if (error) throw error;
  return data;
}

export async function rejectAdminDonation(donationId: string, reason: string): Promise<any> {
  const { data, error } = await supabase.rpc('admin_reject_donation', {
    p_donation_id: donationId,
    p_reason: reason.trim(),
  });
  if (error) throw error;
  return data;
}
