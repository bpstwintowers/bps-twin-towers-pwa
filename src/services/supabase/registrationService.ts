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

export interface RegistrationPayload {
  flat_id: string;
  requested_membership_type: 'Primary Resident' | 'Family Member' | 'Tenant' | 'Staff';
  relationship: string;
  mobile?: string;
  resident_type?: string;
  resident_since?: string;
  remarks?: string;
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

// ---------- Blocks ----------

export async function getBlocks(): Promise<BlockInfo[]> {
  const { data, error } = await supabase
    .from('blocks')
    .select('id, name, status')
    .eq('status', 'Active')
    .order('name');
  if (error) throw error;
  return (data as BlockInfo[]) || [];
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

  const { data, error } = await supabase
    .from('registration_requests')
    .insert({
      user_id: user.id,
      flat_id: payload.flat_id,
      requested_membership_type: payload.requested_membership_type,
      relationship: payload.relationship,
      mobile: payload.mobile || null,
      resident_type: payload.resident_type || null,
      resident_since: payload.resident_since || null,
      remarks: payload.remarks || null,
      status: 'Pending',
    })
    .select('id')
    .single();

  if (error) throw error;
  return data as { id: string };
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
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return 'm***@gmail.com';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 1)}***@${domain}`;
}

export async function getFlatResidents(flatId: string): Promise<FlatResidentInfo[]> {
  try {
    const { data, error } = await supabase
      .from('flat_members')
      .select(`
        id,
        user_id,
        relationship,
        membership_type,
        resident_type,
        full_name,
        email,
        status,
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq('flat_id', flatId)
      .eq('status', 'Active');

    if (error || !data || data.length === 0) {
      // Fallback check on flat owner info RPC
      const ownerInfo = await getFlatOwnerInfo(flatId);
      if (ownerInfo.owner_registered && ownerInfo.owner_email) {
        return [{
          id: flatId,
          user_id: '',
          full_name: 'Flat Owner',
          resident_type: 'Owner',
          masked_email: maskEmail(ownerInfo.owner_email),
        }];
      }
      return [];
    }

    return data.map((row: any) => {
      const name = row.profiles?.full_name || row.full_name || 'Verified Resident';
      const email = row.profiles?.email || row.email || '';
      let displayRole = 'Resident';
      if (row.membership_type === 'Primary Resident' || row.resident_type === 'Owner') {
        displayRole = 'Owner';
      } else if (row.relationship && row.relationship !== 'Self') {
        displayRole = `${row.relationship}`;
      } else if (row.membership_type) {
        displayRole = row.membership_type;
      }

      return {
        id: row.id,
        user_id: row.user_id || '',
        full_name: name,
        resident_type: displayRole,
        masked_email: maskEmail(email),
      };
    });
  } catch (err) {
    console.warn('getFlatResidents lookup:', err);
    return [];
  }
}

