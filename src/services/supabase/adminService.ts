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
  parking_details?: string | null;
  parking_document_url?: string | null;
  rental_agreement_url?: string | null;
  family_members?: any;
  vehicles?: any;
  dob_month_year?: string | null;
  age?: number | null;
  blood_group?: string | null;
  occupancy_status?: string | null;
  tenant_name?: string | null;
  tenant_email?: string | null;
  tenant_mobile?: string | null;
  lease_start_date?: string | null;
  lease_end_date?: string | null;
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
  parking_details?: string | null;
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
  try {
    const { data, error } = await supabase.rpc('is_admin');
    if (!error && Boolean(data)) {
      return true;
    }

    // Check if user has Event Admin or any management role in user_roles
    const roles = await fetchUserRoles();
    return roles.some((r) => {
      const lower = r.toLowerCase();
      return (
        lower.includes('admin') ||
        lower.includes('event') ||
        lower.includes('finance') ||
        lower.includes('facility') ||
        lower.includes('helpdesk') ||
        lower.includes('sponsor') ||
        lower.includes('volunteer') ||
        lower.includes('communication')
      );
    });
  } catch (err) {
    console.error('Error checking admin status:', err);
    return false;
  }
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
  const [{ data, error }, { data: docRows }] = await Promise.all([
    supabase
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
      .order('created_at', { ascending: false }),
    supabase
      .from('parking_documents')
      .select('registration_id, file_path, file_name'),
  ]);

  if (error) throw error;

  const docMap: Record<string, string> = {};
  (docRows || []).forEach((d: any) => {
    if (d.registration_id && d.file_path) {
      const { data: pubData } = supabase.storage
        .from('parking-documents')
        .getPublicUrl(d.file_path);
      docMap[d.registration_id] = pubData?.publicUrl || d.file_path;
    }
  });

  return (data || []).map((row: any) => {
    let resolvedName = row.profiles?.full_name;
    if (row.remarks && typeof row.remarks === 'string') {
      const match = row.remarks.match(/Applicant:\s*([^,\n;\r]+)/i);
      if (match && match[1].trim()) {
        resolvedName = match[1].trim();
      }
    }
    if (!resolvedName || resolvedName === 'Unnamed') {
      resolvedName = row.tenant_name || row.profiles?.full_name || 'Resident';
    }

    return {
      ...row,
      applicant_name: resolvedName,
      applicant_email: row.profiles?.email || '',
      applicant_photo: row.profiles?.photo_url || '',
      flat_number: row.flats?.flat_number || '',
      bhk: row.flats?.bhk || '',
      block_name: row.flats?.blocks?.name || '',
      parking_document_url: row.parking_document_url || docMap[row.id] || null,
    };
  });
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

export function generateRegistrationEmail(
  action: 'approve' | 'reject' | 'correction',
  item: AdminRegistrationItem,
  customNote?: string
): { to: string; subject: string; body: string; gmailUrl: string; mailtoUrl: string; from: string } {
  const to = item.applicant_email || '';
  const flat = item.flat_number || 'your unit';
  const block = item.block_name ? ` (${item.block_name})` : '';

  // Extract applicant name from item or application remarks
  let name = item.applicant_name;
  if (item.remarks && typeof item.remarks === 'string') {
    const match = item.remarks.match(/Applicant:\s*([^,\n;\r]+)/i);
    if (match && match[1].trim()) {
      name = match[1].trim();
    }
  }
  if (!name || name === 'Unnamed') {
    name = item.tenant_name || 'Resident';
  }

  let subject = '';
  let body = '';

  if (action === 'approve') {
    subject = `BPS Twin Towers — Resident Registration Approved for Flat ${flat}`;
    body = `Dear ${name},\n\nCongratulations! Your resident registration application for Flat ${flat}${block} at BPS Twin Towers has been verified and approved by the Management Committee.\n\nYou now have active household access. You can log in to the portal to view society announcements, register visitors, book community facilities, and participate in society activities.\n\nPortal link: https://bpstwintowers.in\n\nWarm regards,\nBPS Twin Towers Management Committee\nbpstwintowers.society@gmail.com`;
  } else if (action === 'correction') {
    subject = `Action Required: Registration Correction for Flat ${flat} — BPS Twin Towers`;
    body = `Dear ${name},\n\nThe Management Committee has reviewed your registration application for Flat ${flat}${block} and requires the following update or clarification:\n\n"${customNote || 'Please update your submitted details.'}"\n\nPlease log in to the resident portal to make the necessary corrections and re-submit for review:\nhttps://bpstwintowers.in/registration-status\n\nIf you have any questions, feel free to reply to this email.\n\nWarm regards,\nBPS Twin Towers Management Committee\nbpstwintowers.society@gmail.com`;
  } else {
    subject = `Update Regarding Registration for Flat ${flat} — BPS Twin Towers`;
    body = `Dear ${name},\n\nYour resident registration application for Flat ${flat}${block} could not be approved at this time.\n\nReason: ${customNote || 'Application details could not be verified by administration.'}\n\nIf you believe this is an error or would like to provide updated documentation, please contact the Management Committee at bpstwintowers.society@gmail.com.\n\nWarm regards,\nBPS Twin Towers Management Committee`;
  }

  // Direct web Gmail compose URL targeted specifically to the society's official Gmail account
  const fromEmail = 'bpstwintowers.society@gmail.com';
  const gmailUrl = `https://mail.google.com/mail/u/${encodeURIComponent(fromEmail)}/?authuser=${encodeURIComponent(fromEmail)}&view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { to, subject, body, gmailUrl, mailtoUrl, from: fromEmail };
}

export async function sendRegistrationNotification(
  userId: string,
  type: 'APPROVED' | 'REJECTED' | 'CORRECTION',
  flatNumber: string,
  details?: string
): Promise<void> {
  try {
    const titles = {
      APPROVED: `Flat ${flatNumber} Registration Approved 🎉`,
      REJECTED: `Flat ${flatNumber} Registration Rejected`,
      CORRECTION: `Action Required: Flat ${flatNumber} Registration Update`,
    };

    const messages = {
      APPROVED: `Congratulations! Your registration for Flat ${flatNumber} has been verified and approved. You now have full access to society amenities and resident services.`,
      REJECTED: `Your registration for Flat ${flatNumber} was not approved.${details ? ` Reason: ${details}` : ''}`,
      CORRECTION: `Admin requested updates for your Flat ${flatNumber} registration: "${details || 'Please update your details'}".`,
    };

    const actionUrls = {
      APPROVED: '/profile',
      REJECTED: '/registration-status',
      CORRECTION: '/registration-status',
    };

    await supabase.from('notifications').insert({
      recipient: userId,
      notification_type: type,
      category: 'REGISTRATION',
      priority: type === 'CORRECTION' ? 'HIGH' : 'NORMAL',
      title: titles[type],
      message: messages[type],
      action_url: actionUrls[type],
      reference_type: 'registration_request',
      is_read: false,
    });
  } catch (e) {
    console.warn('Could not insert in-app notification:', e);
  }
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
        mobile,
        parking_details
      )
    `)
    .order('joined_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    full_name: row.full_name || row.profiles?.full_name || 'Resident',
    email: row.email || row.profiles?.email || '',
    mobile: row.mobile || row.profiles?.mobile || '',
    parking_details: row.parking_details || row.profiles?.parking_details || null,
    flat_number: row.flats?.flat_number || '',
    block_name: row.flats?.blocks?.name || '',
  }));
}

export async function deleteAdminResident(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('flat_members')
    .delete()
    .eq('id', memberId);
  if (error) throw error;
}

export async function updateAdminResidentParking(memberId: string, parkingDetails: string): Promise<void> {
  const { error } = await supabase
    .from('flat_members')
    .update({ parking_details: parkingDetails })
    .eq('id', memberId);
  if (error) throw error;
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

  const isStatus = (status: string | null | undefined, target: string) => {
    const s = (status || '').toLowerCase().trim();
    if (target === 'pending') return s.includes('pending');
    if (target === 'correction') return s.includes('correction');
    if (target === 'approved') return s.includes('approved');
    if (target === 'rejected') return s.includes('rejected');
    return false;
  };

  return {
    pendingCount: regRows.filter(r => isStatus(r.status, 'pending')).length,
    correctionCount: regRows.filter(r => isStatus(r.status, 'correction')).length,
    approvedCount: regRows.filter(r => isStatus(r.status, 'approved')).length,
    rejectedCount: regRows.filter(r => isStatus(r.status, 'rejected')).length,
    totalFlats: flatRows.length,
    occupiedFlats: memberRows.filter(m => (m.status || '').toLowerCase() === 'active').length,
    totalResidents: memberRows.filter(m => (m.status || '').toLowerCase() === 'active').length,
  };
}

export interface AdminPermissionItem {
  id: string; // user_role id
  user_id: string;
  role_id: string;
  user_name: string;
  email: string;
  photo_url?: string;
  role_name: string;
  modules: string;
  status: 'Active' | 'Inactive';
  created_at?: string;
}

export interface RoleItem {
  id: string;
  name: string;
  description?: string | null;
}

export function getModulesForRole(roleName: string): string {
  const r = (roleName || '').toLowerCase();
  if (r === 'admin' || r.includes('society admin') || r.includes('super')) {
    return 'All';
  }
  if (r.includes('event') || r.includes('festival') || r.includes('culture')) {
    return 'Events & Festivals, Ticket/Budget Tracking, Event Communications';
  }
  if (r.includes('facility') || r.includes('helpdesk')) {
    return 'Facility Bookings Approval, Amenity Management, Complaints Resolution';
  }
  if (r.includes('finance') || r.includes('treasurer')) {
    return 'Donations & Finance, Sponsors & Partners, Campaign Verification';
  }
  if (r.includes('volunteer')) {
    return 'Volunteers & Teams, Opportunity Scheduling';
  }
  if (r.includes('communication') || r.includes('pr')) {
    return 'Notice Board & Announcements, Broadcast Dispatch';
  }
  if (r.includes('security') || r.includes('gate')) {
    return 'Security Console, Visitor Gate Passes & Check-in';
  }
  return 'Resident Community Portal';
}

export async function fetchUserPermissionsList(): Promise<AdminPermissionItem[]> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        id,
        user_id,
        role_id,
        created_at,
        profiles!user_roles_user_id_fkey (
          id,
          full_name,
          email,
          photo_url
        ),
        roles!user_roles_role_id_fkey (
          id,
          name,
          description
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => {
      const roleName = row.roles?.name || 'Resident';
      return {
        id: row.id,
        user_id: row.user_id,
        role_id: row.role_id,
        user_name: row.profiles?.full_name || 'Unnamed Resident',
        email: row.profiles?.email || 'No email',
        photo_url: row.profiles?.photo_url || '',
        role_name: roleName,
        modules: getModulesForRole(roleName),
        status: 'Active',
        created_at: row.created_at,
      };
    });
  } catch (err) {
    console.error('Error fetching user permissions:', err);
    return [];
  }
}

export async function fetchAllAvailableRoles(): Promise<RoleItem[]> {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('id, name, description')
      .order('name', { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) return data;

    // Fallback standard roles if table is empty
    return [
      { id: 'admin', name: 'Admin', description: 'Full access across all society modules' },
      { id: 'event-admin', name: 'Event Admin', description: 'Manage events, budget & registrations' },
      { id: 'facility-admin', name: 'Facility Admin', description: 'Manage amenities, bookings & complaints' },
      { id: 'finance-manager', name: 'Finance Manager', description: 'Manage contributions, donations & sponsors' },
      { id: 'volunteer-coordinator', name: 'Volunteer Coordinator', description: 'Manage opportunities & teams' },
      { id: 'communication-admin', name: 'Communication Admin', description: 'Manage notices & announcements' },
      { id: 'security-guard', name: 'Security Guard', description: 'Manage visitor gate check-ins' },
    ];
  } catch (err) {
    console.error('Error fetching available roles:', err);
    return [];
  }
}

export async function fetchAllUsersForPermissionDropdown(): Promise<Array<{ id: string; full_name: string; email: string; flat_number?: string }>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('full_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching users for permissions:', err);
    return [];
  }
}

export async function assignUserRole(userId: string, roleId: string, replaceUserRoleId?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  // If editing/replacing a specific user_role, delete the old one first
  if (replaceUserRoleId) {
    await supabase.from('user_roles').delete().eq('id', replaceUserRoleId);
  }

  // Check if roleId is a UUID or a name that needs lookup
  let finalRoleId = roleId;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roleId);
  
  if (!isUuid) {
    const { data: roleRow } = await supabase
      .from('roles')
      .select('id')
      .ilike('name', roleId.replace('-', ' '))
      .maybeSingle();
    if (roleRow) {
      finalRoleId = roleRow.id;
    } else {
      const { data: newRole, error: createError } = await supabase
        .from('roles')
        .insert({ name: roleId })
        .select('id')
        .single();
      if (!createError && newRole) {
        finalRoleId = newRole.id;
      }
    }
  }

  // Insert or upsert user role
  const { error } = await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      role_id: finalRoleId,
      assigned_by: user?.id || null,
    }, { onConflict: 'user_id,role_id' });

  if (error) throw error;
}

export interface UserAssignedRoleItem {
  id: string; // user_role id
  role_id: string;
  role_name: string;
  role_description?: string | null;
  created_at?: string;
}

export async function fetchRolesForUser(userId: string): Promise<UserAssignedRoleItem[]> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        id,
        role_id,
        created_at,
        roles!user_roles_role_id_fkey (
          id,
          name,
          description
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      role_id: row.role_id,
      role_name: row.roles?.name || 'Resident',
      role_description: row.roles?.description || null,
      created_at: row.created_at,
    }));
  } catch (err) {
    console.error('Error fetching user roles:', err);
    return [];
  }
}

export async function revokeUserRole(userRoleId: string): Promise<void> {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('id', userRoleId);

  if (error) throw error;
}
