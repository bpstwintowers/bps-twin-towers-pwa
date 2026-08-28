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

  if (existingOwners && existingOwners.length > 0) {
    throw new Error('This flat already has an active registered owner. If any mismatch, please contact bpstwintowers.society@gmail.com');
  }

  // Resolve block_id from flat if not directly provided
  let resolvedBlockId = payload.block_id;
  if (!resolvedBlockId && payload.flat_id) {
    const { data: flatData } = await supabase
      .from('flats')
      .select('block_id')
      .eq('id', payload.flat_id)
      .maybeSingle();
    resolvedBlockId = flatData?.block_id || undefined;
  }

  const { data, error } = await supabase
    .from('registration_requests')
    .insert({
      user_id: user.id,
      flat_id: payload.flat_id,
      block_id: resolvedBlockId || null,
      requested_membership_type: payload.requested_membership_type,
      relationship: payload.relationship,
      occupancy_status: payload.occupancy_status || 'Self Occupied',
      mobile: payload.mobile || null,
      resident_type: payload.resident_type || null,
      resident_since: payload.resident_since || null,
      dob_month_year: payload.dob_month_year || null,
      age: payload.age || null,
      blood_group: payload.blood_group || null,
      family_members: payload.family_members ? JSON.stringify(payload.family_members) : null,
      parking_details: payload.parking_details || null,
      parking_document_url: payload.parking_document_url || null,
      vehicles: payload.vehicles ? JSON.stringify(payload.vehicles) : null,
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
  return data as { id: string };
}

export async function uploadParkingDocumentFile(file: File, flatNumber: string): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'pdf';
  const cleanFlat = flatNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `parking_${cleanFlat}_${Date.now()}.${fileExt}`;
  const filePath = `parking/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('registration-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('registration-documents')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function uploadRentalAgreementFile(file: File, flatNumber: string): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'pdf';
  const cleanFlat = flatNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `agreement_${cleanFlat}_${Date.now()}.${fileExt}`;
  const filePath = `agreements/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('registration-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('registration-documents')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function updateCorrectionRequest(
  registrationId: string,
  payload: Partial<RegistrationPayload>
): Promise<void> {
  const { error } = await supabase
    .from('registration_requests')
    .update({
      ...(payload.mobile !== undefined && { mobile: payload.mobile }),
      ...(payload.relationship !== undefined && { relationship: payload.relationship }),
      ...(payload.resident_type !== undefined && { resident_type: payload.resident_type }),
      ...(payload.resident_since !== undefined && { resident_since: payload.resident_since }),
      ...(payload.remarks !== undefined && { remarks: payload.remarks }),
      status: 'Pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', registrationId);

  if (error) throw error;
}

// ---------- Flat Residents Lookup (For Smart Flat Login) ----------

export interface FlatResidentInfo {
  id: string;
  user_id: string;
  full_name: string;
  resident_type: string;
  masked_email: string;
  status?: 'active' | 'pending';
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return 'm***@gmail.com';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 1)}***@${domain}`;
}

export async function getFlatResidents(flatId: string): Promise<FlatResidentInfo[]> {
  try {
    // 1. Call secure RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_flat_residents', {
      p_flat_id: flatId,
    });

    if (!rpcError && rpcData && rpcData.length > 0) {
      return rpcData.map((row: any) => {
        let displayRole = 'Resident';
        if (row.membership_type === 'Primary Resident' || row.resident_type === 'Owner') {
          displayRole = 'Owner';
        } else if (row.relationship && row.relationship !== 'Self') {
          displayRole = row.relationship;
        } else if (row.membership_type) {
          displayRole = row.membership_type;
        }

        return {
          id: row.id,
          user_id: row.user_id || '',
          full_name: row.full_name || 'Verified Resident',
          resident_type: displayRole,
          masked_email: row.masked_email || 'm***@gmail.com',
          status: row.status || 'active',
        };
      });
    }

    // 2. Fallback check on flat owner info RPC
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
