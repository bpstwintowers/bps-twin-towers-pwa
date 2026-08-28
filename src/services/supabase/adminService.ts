import { supabase } from './client';

export interface AdminRegistrationItem {
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
  rejection_reason: string | null;
  correction_message: string | null;
  reviewed_at: string | null;
  created_at: string;
  // Joined fields
  applicant_name?: string;
  applicant_email?: string;
  applicant_photo?: string;
  flat_number?: string;
  block_name?: string;
  bhk?: string;
}

export interface AdminResidentItem {
  id: string;
  flat_id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  relationship: string;
  membership_type: string;
  resident_type: string | null;
  status: string;
  joined_at: string;
  flat_number?: string;
  block_name?: string;
}

export interface AdminFlatItem {
  id: string;
  flat_number: string;
  bhk: string | null;
  floor_number: number;
  status: string;
  block_name: string;
  occupant_count?: number;
  primary_owner?: string | null;
}

export interface AdminStats {
  pendingCount: number;
  correctionCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalFlats: number;
  occupiedFlats: number;
  totalResidents: number;
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
  return Boolean(data);
}

export async function fetchUserRoles(): Promise<string[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return ['Resident'];

    // Try RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_roles');
    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      const roles = rpcData.map((r: any) => typeof r === 'string' ? r : r.role_name).filter(Boolean);
      if (roles.length > 0) return roles;
    }

    // Direct query fallback with explicit foreign key join
    const { data, error } = await supabase
      .from('user_roles')
      .select('roles!user_roles_role_id_fkey(name)')
      .eq('user_id', user.id);

    if (error || !data || data.length === 0) {
      return ['Resident'];
    }

    const roleNames = data
      .map((r: any) => r.roles?.name)
      .filter(Boolean);

    return roleNames.length > 0 ? roleNames : ['Resident'];
  } catch (err) {
    console.error('Error fetching user roles:', err);
    return ['Resident'];
  }
}

export async function fetchAdminRegistrations(): Promise<AdminRegistrationItem[]> {
  const { data, error } = await supabase
    .from('registration_requests')
    .select(`
      *,
      profiles!registration_requests_user_id_fkey (
        full_name,
        email,
        photo_url
      ),
      flats!registration_requests_flat_id_fkey (
        flat_number,
        bhk,
        blocks!flats_block_id_fkey ( name )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    applicant_name: row.profiles?.full_name || 'Unnamed',
    applicant_email: row.profiles?.email || '',
    applicant_photo: row.profiles?.photo_url || '',
    flat_number: row.flats?.flat_number || '',
    bhk: row.flats?.bhk || '',
    block_name: row.flats?.blocks?.name || '',
  }));
}

export async function approveRegistrationRequest(registrationId: string): Promise<any> {
  const { data, error } = await supabase.rpc('admin_approve_registration', {
    p_registration_id: registrationId,
  });
  if (error) throw error;
  return data;
}

export async function rejectRegistrationRequest(registrationId: string, reason: string): Promise<any> {
  if (!reason || reason.trim() === '') {
    throw new Error('Rejection reason is required.');
  }
  const { data, error } = await supabase.rpc('admin_reject_registration', {
    p_registration_id: registrationId,
    p_reason: reason.trim(),
  });
  if (error) throw error;
  return data;
}

export async function requestRegistrationCorrection(registrationId: string, message: string): Promise<any> {
  if (!message || message.trim() === '') {
    throw new Error('Correction message is required.');
  }
  const { data, error } = await supabase.rpc('admin_request_correction', {
    p_registration_id: registrationId,
    p_message: message.trim(),
  });
  if (error) throw error;
  return data;
}

export async function fetchAdminResidents(): Promise<AdminResidentItem[]> {
  const { data, error } = await supabase
    .from('flat_members')
    .select(`
      *,
      flats!flat_members_flat_id_fkey (
        flat_number,
        blocks!flats_block_id_fkey ( name )
      ),
      profiles!flat_members_user_id_fkey (
        full_name,
        email,
        mobile
      )
    `)
    .order('joined_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    full_name: row.full_name || row.profiles?.full_name || 'Resident',
    email: row.email || row.profiles?.email || '',
    mobile: row.mobile || row.profiles?.mobile || '',
    flat_number: row.flats?.flat_number || '',
    block_name: row.flats?.blocks?.name || '',
  }));
}

export async function fetchAdminFlats(): Promise<AdminFlatItem[]> {
  const { data, error } = await supabase
    .from('flats')
    .select(`
      id,
      flat_number,
      bhk,
      floor_number,
      status,
      blocks!flats_block_id_fkey ( name ),
      flat_members ( id, full_name, membership_type, status )
    `)
    .order('flat_number', { ascending: true });

  if (error) throw error;

  return (data || []).map((row: any) => {
    const activeMembers = (row.flat_members || []).filter((m: any) => m.status === 'Active');
    const primary = activeMembers.find((m: any) => m.membership_type === 'Primary Resident');
    return {
      id: row.id,
      flat_number: row.flat_number,
      bhk: row.bhk,
      floor_number: row.floor_number,
      status: row.status,
      block_name: row.blocks?.name || '',
      occupant_count: activeMembers.length,
      primary_owner: primary?.full_name || null,
    };
  });
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const [registrations, flats, members] = await Promise.all([
    supabase.from('registration_requests').select('status'),
    supabase.from('flats').select('id, status'),
    supabase.from('flat_members').select('id, status'),
  ]);

  const regRows = registrations.data || [];
  const flatRows = flats.data || [];
  const memberRows = members.data || [];

  return {
    pendingCount: regRows.filter(r => r.status === 'Pending').length,
    correctionCount: regRows.filter(r => r.status === 'Correction Required').length,
    approvedCount: regRows.filter(r => r.status === 'Approved').length,
    rejectedCount: regRows.filter(r => r.status === 'Rejected').length,
    totalFlats: flatRows.length,
    occupiedFlats: memberRows.filter(m => m.status === 'Active').length,
    totalResidents: memberRows.filter(m => m.status === 'Active').length,
  };
}
