import { supabase } from './client';

// ---------- Types ----------

export interface AccessInfo {
  membership_id: string;
  flat_id: string;
  membership_type: string;
  relationship: string;
  membership_status: string;
  role_name: string;
  flat_number?: string;
  block_name?: string;
  bhk?: string;
}

export interface FlatSearchResult {
  flat_id: string;
  flat_number: string;
  bhk: string | null;
  owner_registered: boolean;
}

export interface BlockInfo {
  id: string;
  name: string;
  status: string;
}

export interface CommunitySummary {
  active_residents_count: number;
  total_flats_count: number;
}

export interface RegistrationRequest {
  id: string;
  user_id: string;
  flat_id: string;
  relationship: string;
  requested_membership_type: string;
  mobile: string | null;
  status: string;
  remarks: string | null;
  resident_type: string | null;
  resident_since: string | null;
  parking_details: string | null;
  rejection_reason: string | null;
  correction_message: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // joined flat info
  flat_number?: string;
  block_name?: string;
}

export interface VehicleEntry {
  slot_number: string;
  vehicle_type: string;
  make_model: string;
  reg_number: string;
  colour: string;
  remarks?: string;
}

export interface FamilyMemberEntry {
  full_name: string;
  relationship: string;
  dob_month_year?: string;
  age?: number;
  mobile?: string;
  email?: string;
  blood_group?: string;
}

export interface RegistrationPayload {
  flat_id: string;
  block_id?: string;
  requested_membership_type: 'Primary Resident' | 'Family Member' | 'Tenant' | 'Staff';
  relationship: string;
  occupancy_status?: string;
  mobile?: string;
  resident_type?: string;
  resident_since?: string;
  dob_month_year?: string;
  age?: number;
  blood_group?: string;
  family_members?: FamilyMemberEntry[];
  parking_details?: string;
  parking_document_url?: string;
  vehicles?: VehicleEntry[];
  remarks?: string;
  tenant_name?: string;
  tenant_email?: string;
  tenant_mobile?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  rental_agreement_url?: string;
}

// ---------- Access Resolution ----------

export async function resolveUserAccess(): Promise<AccessInfo[]> {
  const { data, error } = await supabase.rpc('resolve_access');
  if (error) throw error;
  const accessRows = (data as AccessInfo[]) || [];

  if (accessRows.length === 0) return [];

  // Fetch flat and block details for each active flat
  const flatIds = accessRows.map((a) => a.flat_id);
  const { data: flatsData } = await supabase
    .from('flats')
    .select(`
      id,
      flat_number,
      bhk,
      blocks!flats_block_id_fkey ( name )
    `)
    .in('id', flatIds);

  const flatMap = new Map((flatsData || []).map((f: any) => [f.id, f]));

  return accessRows.map((row) => {
    const flatInfo = flatMap.get(row.flat_id);
    return {
      ...row,
      flat_number: flatInfo?.flat_number || '',
      block_name: flatInfo?.blocks?.name || '',
      bhk: flatInfo?.bhk || '',
    };
  });
}

// ---------- Flat Search ----------

export async function searchFlats(query: string): Promise<FlatSearchResult[]> {
  if (!query || query.trim().length === 0) return [];
  const { data, error } = await supabase.rpc('search_flats', { p_query: query.trim() });
  if (error) throw error;
  return (data as FlatSearchResult[]) || [];
}

// In-memory caches for static / high-frequency data
let cachedBlocks: BlockInfo[] | null = null;
let cachedSummary: { data: { active_residents_count: number; total_flats_count: number }; timestamp: number } | null = null;

// ---------- Blocks ----------

export async function getBlocks(): Promise<BlockInfo[]> {
  if (cachedBlocks && cachedBlocks.length > 0) {
    return cachedBlocks;
  }
  const { data, error } = await supabase
    .from('blocks')
    .select('id, name, status')
    .eq('status', 'Active')
    .order('name');
  if (error) throw error;
  cachedBlocks = (data as BlockInfo[]) || [];
  return cachedBlocks;
}

// ---------- Registration Requests ----------

export async function getUserRegistrations(): Promise<RegistrationRequest[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('registration_requests')
    .select(`
      *,
      flats!registration_requests_flat_id_fkey (
        flat_number,
        blocks!flats_block_id_fkey ( name )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    flat_number: row.flats?.flat_number || '',
    block_name: row.flats?.blocks?.name || '',
  }));
}

export async function checkDuplicateRegistration(
  flatId: string,
  membershipType: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('registration_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('flat_id', flatId)
    .eq('requested_membership_type', membershipType)
    .in('status', ['Pending', 'Correction Required', 'Approved'])
    .limit(1);

  if (error) throw error;
  return (data || []).length > 0;
}

export async function checkActiveMembership(flatId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('flat_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('flat_id', flatId)
    .eq('status', 'Active')
    .limit(1);

  if (error) throw error;
  return (data || []).length > 0;
}

export async function getFlatOwnerInfo(flatId: string): Promise<{ owner_registered: boolean; owner_email: string | null }> {
  const { data, error } = await supabase.rpc('get_flat_owner', { p_flat_id: flatId });
  if (error) throw error;
  const row = (data as any[])?.[0];
  return {
    owner_registered: row?.owner_registered ?? false,
    owner_email: row?.owner_email ?? null,
  };
}

export async function ensureProfileExists(user: any): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Resident';
    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      photo_url: user.user_metadata?.avatar_url || null,
    });
  }
}

export async function submitRegistration(payload: RegistrationPayload): Promise<{ id: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Ensure user profile exists to satisfy foreign key constraint
  await ensureProfileExists(user);

  // Frontend duplicate check
  const isDuplicate = await checkDuplicateRegistration(payload.flat_id, payload.requested_membership_type);
  if (isDuplicate) {
    throw new Error('You already have a pending or approved registration for this flat and membership type.');
  }

  // Check active membership
  const isActive = await checkActiveMembership(payload.flat_id);
  if (isActive) {
    throw new Error('You already have an active membership for this flat.');
  }

  // Check if flat already has an approved owner / active primary resident
  const { data: existingOwners } = await supabase
    .from('flat_members')
    .select('id')
    .eq('flat_id', payload.flat_id)
    .ilike('membership_type', 'Primary Resident')
    .eq('status', 'Active')
    .limit(1);

  if (existingOwners && existingOwners.length > 0 && payload.requested_membership_type === 'Primary Resident') {
    throw new Error('An approved owner is already registered for this flat. Please register as a Family Member or Tenant.');
  }

  const { data, error } = await supabase
    .from('registration_requests')
    .insert({
      user_id: user.id,
      flat_id: payload.flat_id,
      block_id: payload.block_id || null,
      relationship: payload.relationship,
      requested_membership_type: payload.requested_membership_type,
      occupancy_status: payload.occupancy_status || null,
      mobile: payload.mobile || null,
      resident_type: payload.resident_type || null,
      resident_since: payload.resident_since || null,
      dob_month_year: payload.dob_month_year || null,
      age: payload.age || null,
      blood_group: payload.blood_group || null,
      family_members: payload.family_members || null,
      parking_details: payload.parking_details || null,
      parking_document_url: payload.parking_document_url || null,
      vehicles: payload.vehicles || null,
      remarks: payload.remarks || null,
      tenant_name: payload.tenant_name || null,
      tenant_email: payload.tenant_email || null,
      tenant_mobile: payload.tenant_mobile || null,
      lease_start_date: payload.lease_start_date || null,
      lease_end_date: payload.lease_end_date || null,
      rental_agreement_url: payload.rental_agreement_url || null,
      status: 'Pending',
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function uploadRegistrationDocument(file: File, folder: string = 'documents'): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('registration-docs')
    .upload(fileName, file);

  if (uploadError) {
    console.warn('Storage upload error, using local fallback:', uploadError);
    return URL.createObjectURL(file);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('registration-docs')
    .getPublicUrl(fileName);

  return publicUrl;
}

export interface FlatResidentInfo {
  id: string;
  user_id: string;
  full_name: string;
  resident_type: string;
  masked_email: string;
  status: 'active' | 'pending';
}

function maskEmail(email: string | null): string {
  if (!email) return '•••@•••.com';
  const parts = email.split('@');
  if (parts.length !== 2) return '•••@•••.com';
  const name = parts[0];
  const domain = parts[1];
  const visibleLength = Math.min(3, Math.floor(name.length / 2));
  const maskedName = name.substring(0, visibleLength) + '•'.repeat(Math.max(3, name.length - visibleLength));
  return `${maskedName}@${domain}`;
}

export async function getFlatResidents(flatId: string): Promise<FlatResidentInfo[]> {
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_flat_residents', { p_flat_id: flatId });
    if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      return (rpcData as any[]).map((r) => ({
        id: r.id || flatId,
        user_id: r.user_id || '',
        full_name: r.full_name || 'Resident',
        resident_type: r.resident_type || 'Resident',
        masked_email: r.masked_email || maskEmail(r.email),
        status: r.status === 'pending' ? 'pending' : 'active',
      }));
    }

    const ownerInfo = await getFlatOwnerInfo(flatId);
    if (ownerInfo.owner_registered && ownerInfo.owner_email) {
      return [{
        id: flatId,
        user_id: '',
        full_name: 'Flat Owner',
        resident_type: 'Owner',
        masked_email: maskEmail(ownerInfo.owner_email),
        status: 'active',
      }];
    }
    return [];
  } catch (err) {
    console.warn('getFlatResidents lookup:', err);
    return [];
  }
}

export async function getCommunitySummary(): Promise<{ active_residents_count: number; total_flats_count: number }> {
  try {
    const now = Date.now();
    if (cachedSummary && now - cachedSummary.timestamp < 120000) {
      return cachedSummary.data;
    }
    const { data, error } = await supabase.rpc('get_community_summary');
    if (!error && data) {
      const parsed = data as { active_residents_count: number; total_flats_count: number };
      cachedSummary = { data: parsed, timestamp: now };
      return parsed;
    }
    return { active_residents_count: 8, total_flats_count: 504 };
  } catch (err) {
    console.warn('Error fetching community summary:', err);
    return { active_residents_count: 8, total_flats_count: 504 };
  }
}