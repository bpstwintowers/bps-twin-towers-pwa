import { supabase } from './client';

export type VisitorType =
  | 'Guest'
  | 'Delivery'
  | 'Cab'
  | 'Service Provider'
  | 'Vendor'
  | 'Domestic Help'
  | 'Other';

export type VehicleType =
  | '2-Wheeler'
  | '4-Wheeler'
  | 'Auto/3-Wheeler'
  | 'Commercial/Van'
  | 'None';

export type GateType = 'Main' | 'Service' | 'Pedestrian' | 'Emergency';

export type GateStatus = 'Active' | 'Inactive' | 'Maintenance';

export type InvitationStatus =
  | 'Pending'
  | 'Approved'
  | 'Declined'
  | 'Checked In'
  | 'Checked Out'
  | 'Expired'
  | 'Cancelled';

export type VisitStatus = 'Inside' | 'Completed' | 'Overstayed';

export interface GateItem {
  id: string;
  name: string;
  code: string;
  location: string | null;
  gate_type: GateType;
  status: GateStatus;
  created_at: string;
  updated_at: string;
}

export interface VisitorItem {
  id: string;
  name: string;
  phone: string;
  visitor_type: VisitorType;
  company: string | null;
  vehicle_number: string | null;
  vehicle_type: VehicleType | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitorInvitationItem {
  id: string;
  visitor_id: string;
  host_flat_id: string;
  invited_by: string | null;
  pass_code: string;
  expected_date: string;
  expected_time: string | null;
  valid_until: string;
  purpose: string | null;
  status: InvitationStatus;
  created_at: string;
  updated_at: string;
  visitor?: VisitorItem;
  flat?: {
    id: string;
    flat_number: string;
    block?: {
      name: string;
      code: string;
    } | null;
  };
  inviter?: {
    full_name: string | null;
  };
}

export interface VisitItem {
  id: string;
  visitor_id: string;
  flat_id: string;
  invitation_id: string | null;
  entry_gate_id: string;
  exit_gate_id: string | null;
  entry_time: string;
  exit_time: string | null;
  entry_by: string | null;
  exit_by: string | null;
  status: VisitStatus;
  purpose: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  visitor?: VisitorItem;
  flat?: {
    id: string;
    flat_number: string;
    block?: {
      name: string;
      code: string;
    } | null;
  };
  entry_gate?: GateItem;
  exit_gate?: GateItem;
  guard?: {
    full_name: string | null;
  };
}

export interface GateSummary {
  currently_inside: number;
  expected_today: number;
  waiting_approval: number;
  today_total_entries: number;
  today_total_exits: number;
}

export interface CreateInvitePayload {
  flat_id: string;
  name: string;
  phone: string;
  visitor_type: VisitorType;
  company?: string;
  vehicle_number?: string;
  vehicle_type?: VehicleType;
  expected_date?: string;
  expected_time?: string;
  purpose?: string;
}

export interface WalkinEntryPayload {
  flat_id: string;
  gate_id: string;
  name: string;
  phone: string;
  visitor_type: VisitorType;
  company?: string;
  vehicle_number?: string;
  purpose?: string;
}

export interface CreateGatePayload {
  name: string;
  code: string;
  location?: string;
  gate_type: GateType;
}

// ---------- SECURITY ROLE DETECTION ----------

export async function checkIsSecurityStaff(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_security_or_admin');
  if (error) return false;
  return Boolean(data);
}

// ---------- RESIDENT VISITOR OPERATIONS ----------

export async function fetchResidentInvitations(): Promise<VisitorInvitationItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data, error } = await supabase
    .from('visitor_invitations')
    .select(`
      *,
      visitor:visitors ( * ),
      flat:flats ( id, flat_number, block:blocks(name, code) ),
      inviter:profiles!visitor_invitations_invited_by_fkey ( full_name )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as VisitorInvitationItem[];
}

export async function fetchResidentVisits(): Promise<VisitItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data, error } = await supabase
    .from('visits')
    .select(`
      *,
      visitor:visitors ( * ),
      flat:flats ( id, flat_number, block:blocks(name, code) ),
      entry_gate:gates!visits_entry_gate_id_fkey ( name, code ),
      exit_gate:gates!visits_exit_gate_id_fkey ( name, code )
    `)
    .order('entry_time', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data || []) as VisitItem[];
}

export async function createVisitorInvite(payload: CreateInvitePayload): Promise<any> {
  const { data, error } = await supabase.rpc('create_visitor_invitation', {
    p_flat_id: payload.flat_id,
    p_name: payload.name.trim(),
    p_phone: payload.phone.trim(),
    p_visitor_type: payload.visitor_type,
    p_company: payload.company?.trim() || '',
    p_vehicle_number: payload.vehicle_number?.trim() || '',
    p_vehicle_type: payload.vehicle_type || 'None',
    p_expected_date: payload.expected_date || new Date().toISOString().split('T')[0],
    p_expected_time: payload.expected_time || null,
    p_purpose: payload.purpose?.trim() || '',
  });

  if (error) throw error;
  return data;
}

export async function cancelVisitorInvite(invitationId: string): Promise<any> {
  const { data, error } = await supabase.rpc('cancel_visitor_invitation', {
    p_invitation_id: invitationId,
  });

  if (error) throw error;
  return data;
}

export async function respondToGateRequest(
  invitationId: string,
  response: 'Approved' | 'Declined',
  reason?: string
): Promise<any> {
  const { data, error } = await supabase.rpc('resident_respond_visitor_request', {
    p_invitation_id: invitationId,
    p_response: response,
    p_reason: reason?.trim() || '',
  });

  if (error) throw error;
  return data;
}

// ---------- SECURITY GATE CONSOLE OPERATIONS ----------

export async function fetchActiveGates(): Promise<GateItem[]> {
  const { data, error } = await supabase
    .from('gates')
    .select('*')
    .eq('status', 'Active')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []) as GateItem[];
}

export async function fetchGateSummary(): Promise<GateSummary> {
  const { data, error } = await supabase.rpc('get_gate_summary');
  if (error) throw error;
  return data as GateSummary;
}

export async function fetchExpectedVisitorsToday(): Promise<VisitorInvitationItem[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('visitor_invitations')
    .select(`
      *,
      visitor:visitors ( * ),
      flat:flats ( id, flat_number, block:blocks(name, code) )
    `)
    .eq('expected_date', today)
    .eq('status', 'Approved')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as VisitorInvitationItem[];
}

export async function fetchPendingGateRequests(): Promise<VisitorInvitationItem[]> {
  const { data, error } = await supabase
    .from('visitor_invitations')
    .select(`
      *,
      visitor:visitors ( * ),
      flat:flats ( id, flat_number, block:blocks(name, code) )
    `)
    .eq('status', 'Pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as VisitorInvitationItem[];
}

export async function fetchCurrentlyInsideVisits(): Promise<VisitItem[]> {
  const { data, error } = await supabase
    .from('visits')
    .select(`
      *,
      visitor:visitors ( * ),
      flat:flats ( id, flat_number, block:blocks(name, code) ),
      entry_gate:gates!visits_entry_gate_id_fkey ( name, code )
    `)
    .eq('status', 'Inside')
    .order('entry_time', { ascending: false });

  if (error) throw error;
  return (data || []) as VisitItem[];
}

export async function searchSecurityVisitors(query: string): Promise<{
  invitations: VisitorInvitationItem[];
  insideVisits: VisitItem[];
}> {
  const trimmed = query.trim().toUpperCase();
  if (!trimmed) return { invitations: [], insideVisits: [] };

  // 1. Search invitations by pass code, name, phone, or vehicle
  const { data: invData } = await supabase
    .from('visitor_invitations')
    .select(`
      *,
      visitor:visitors!inner ( * ),
      flat:flats!inner ( id, flat_number, block:blocks!inner(name, code) )
    `)
    .or(
      `pass_code.ilike.%${trimmed}%,visitor.name.ilike.%${trimmed}%,visitor.phone.ilike.%${trimmed}%,visitor.vehicle_number.ilike.%${trimmed}%,flat.flat_number.ilike.%${trimmed}%`
    )
    .in('status', ['Approved', 'Pending'])
    .limit(20);

  // 2. Search currently inside visits
  const { data: visData } = await supabase
    .from('visits')
    .select(`
      *,
      visitor:visitors!inner ( * ),
      flat:flats!inner ( id, flat_number, block:blocks!inner(name, code) ),
      entry_gate:gates!visits_entry_gate_id_fkey ( name, code )
    `)
    .eq('status', 'Inside')
    .or(
      `visitor.name.ilike.%${trimmed}%,visitor.phone.ilike.%${trimmed}%,visitor.vehicle_number.ilike.%${trimmed}%,flat.flat_number.ilike.%${trimmed}%`
    )
    .limit(20);

  return {
    invitations: (invData || []) as VisitorInvitationItem[],
    insideVisits: (visData || []) as VisitItem[],
  };
}

export async function gateCheckIn(
  invitationId: string,
  gateId: string,
  notes?: string
): Promise<any> {
  const { data, error } = await supabase.rpc('gate_check_in_visitor', {
    p_invitation_id: invitationId,
    p_gate_id: gateId,
    p_notes: notes?.trim() || '',
  });

  if (error) throw error;
  return data;
}

export async function gateCheckOut(
  visitId: string,
  gateId: string,
  notes?: string
): Promise<any> {
  const { data, error } = await supabase.rpc('gate_check_out_visitor', {
    p_visit_id: visitId,
    p_gate_id: gateId,
    p_notes: notes?.trim() || '',
  });

  if (error) throw error;
  return data;
}

export async function gateRequestWalkIn(payload: WalkinEntryPayload): Promise<any> {
  const { data, error } = await supabase.rpc('gate_request_walkin_entry', {
    p_flat_id: payload.flat_id,
    p_gate_id: payload.gate_id,
    p_name: payload.name.trim(),
    p_phone: payload.phone.trim(),
    p_visitor_type: payload.visitor_type,
    p_company: payload.company?.trim() || '',
    p_vehicle_number: payload.vehicle_number?.trim() || '',
    p_purpose: payload.purpose?.trim() || '',
  });

  if (error) throw error;
  return data;
}

// ---------- ADMIN OPERATIONS ----------

export async function fetchAdminGates(): Promise<GateItem[]> {
  const { data, error } = await supabase
    .from('gates')
    .select('*')
    .order('code', { ascending: true });

  if (error) throw error;
  return (data || []) as GateItem[];
}

export async function createAdminGate(payload: CreateGatePayload): Promise<GateItem> {
  const { data, error } = await supabase
    .from('gates')
    .insert({
      name: payload.name.trim(),
      code: payload.code.trim().toUpperCase(),
      location: payload.location?.trim() || null,
      gate_type: payload.gate_type,
      status: 'Active',
    })
    .select()
    .single();

  if (error) throw error;
  return data as GateItem;
}

export async function updateAdminGate(
  id: string,
  payload: Partial<CreateGatePayload> & { status?: GateStatus }
): Promise<GateItem> {
  const { data, error } = await supabase
    .from('gates')
    .update({
      ...(payload.name && { name: payload.name.trim() }),
      ...(payload.code && { code: payload.code.trim().toUpperCase() }),
      ...(payload.location !== undefined && { location: payload.location?.trim() || null }),
      ...(payload.gate_type && { gate_type: payload.gate_type }),
      ...(payload.status && { status: payload.status }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as GateItem;
}

export async function fetchAdminVisits(
  statusFilter?: string,
  limit: number = 50
): Promise<VisitItem[]> {
  let query = supabase
    .from('visits')
    .select(`
      *,
      visitor:visitors ( * ),
      flat:flats ( id, flat_number, block:blocks(name, code) ),
      entry_gate:gates!visits_entry_gate_id_fkey ( name, code ),
      exit_gate:gates!visits_exit_gate_id_fkey ( name, code )
    `)
    .order('entry_time', { ascending: false })
    .limit(limit);

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as VisitItem[];
}
