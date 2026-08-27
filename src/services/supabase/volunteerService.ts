import { supabase } from './client';

export type TeamCategory =
  | 'Festival'
  | 'Cultural'
  | 'Sports'
  | 'Security'
  | 'Maintenance'
  | 'Medical'
  | 'General';

export type TeamStatus = 'Active' | 'Inactive' | 'Archived';

export type OpportunityStatus =
  | 'Draft'
  | 'Published'
  | 'Open'
  | 'Full'
  | 'Closed'
  | 'Completed'
  | 'Cancelled';

export type AssignmentStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Waitlisted'
  | 'Cancelled';

export type AttendanceStatus = 'Pending' | 'Attended' | 'No Show';

export interface VolunteerTeamItem {
  id: string;
  name: string;
  description: string | null;
  category: TeamCategory;
  coordinator_id: string | null;
  status: TeamStatus;
  created_at: string;
  updated_at: string;
  coordinator?: {
    id: string;
    full_name: string | null;
    email: string | null;
    mobile: string | null;
  } | null;
  opportunities_count?: number;
  volunteers_count?: number;
}

export interface VolunteerOpportunityItem {
  id: string;
  event_id: string | null;
  team_id: string;
  title: string;
  description: string | null;
  role_name: string;
  required_volunteers: number;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  venue: string;
  status: OpportunityStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  team?: VolunteerTeamItem;
  event?: {
    id: string;
    title: string;
    category: string;
  } | null;
  confirmed_count?: number;
  is_user_registered?: boolean;
}

export interface VolunteerAssignmentItem {
  id: string;
  opportunity_id: string;
  user_id: string;
  flat_id: string | null;
  volunteer_name: string;
  volunteer_mobile: string | null;
  volunteer_email: string | null;
  status: AssignmentStatus;
  attendance: AttendanceStatus;
  notes: string | null;
  assigned_at: string;
  created_at: string;
  updated_at: string;
  opportunity?: VolunteerOpportunityItem;
  flat_number?: string;
  block_name?: string;
}

export interface VolunteerSummary {
  total_teams: number;
  active_opportunities: number;
  total_confirmed_volunteers: number;
  total_attended: number;
  today_shifts: number;
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  category: TeamCategory;
  coordinator_id?: string;
  status?: TeamStatus;
}

export interface CreateOpportunityPayload {
  event_id?: string;
  team_id: string;
  title: string;
  description?: string;
  role_name: string;
  required_volunteers: number;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  venue: string;
  status?: OpportunityStatus;
}

export interface SignupVolunteerPayload {
  opportunity_id: string;
  flat_id?: string;
  volunteer_name: string;
  volunteer_mobile?: string;
  volunteer_email?: string;
  notes?: string;
}

// ---------- RESIDENT QUERIES & SIGNUPS ----------

export async function fetchVolunteerTeams(): Promise<VolunteerTeamItem[]> {
  const { data, error } = await supabase
    .from('volunteer_teams')
    .select(`
      *,
      coordinator:profiles!volunteer_teams_coordinator_id_fkey(
        id, full_name, email, mobile
      )
    `)
    .order('name');

  if (error) throw error;
  return (data || []) as VolunteerTeamItem[];
}

export async function fetchPublishedOpportunities(
  teamId?: string,
  search?: string
): Promise<VolunteerOpportunityItem[]> {
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from('volunteer_opportunities')
    .select(`
      *,
      team:volunteer_teams ( * ),
      event:events ( id, title, category ),
      assignments:volunteer_assignments ( id, user_id, status )
    `)
    .in('status', ['Open', 'Published', 'Full'])
    .gte('end_date', new Date().toISOString().split('T')[0])
    .order('start_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (teamId && teamId !== 'ALL') {
    query = query.eq('team_id', teamId);
  }

  if (search && search.trim().length > 0) {
    query = query.ilike('title', `%${search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row: any) => {
    const confirmed = (row.assignments || []).filter((a: any) => a.status === 'Confirmed');
    const isUserRegistered = user ? confirmed.some((a: any) => a.user_id === user.id) : false;

    return {
      ...row,
      confirmed_count: confirmed.length,
      is_user_registered: isUserRegistered,
    };
  });
}

export async function fetchUserVolunteerAssignments(): Promise<VolunteerAssignmentItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data, error } = await supabase
    .from('volunteer_assignments')
    .select(`
      *,
      opportunity:volunteer_opportunities (
        *,
        team:volunteer_teams ( * ),
        event:events ( id, title, category )
      ),
      flats (
        flat_number,
        blocks ( name )
      )
    `)
    .eq('user_id', user.id)
    .order('assigned_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    flat_number: row.flats?.flat_number || '',
    block_name: row.flats?.blocks?.name || '',
  }));
}

export async function signupVolunteer(payload: SignupVolunteerPayload): Promise<any> {
  const { data, error } = await supabase.rpc('signup_volunteer', {
    p_opportunity_id: payload.opportunity_id,
    p_flat_id: payload.flat_id || null,
    p_volunteer_name: payload.volunteer_name,
    p_volunteer_mobile: payload.volunteer_mobile || '',
    p_volunteer_email: payload.volunteer_email || '',
    p_notes: payload.notes || '',
  });

  if (error) throw error;
  return data;
}

export async function cancelVolunteerAssignment(assignmentId: string): Promise<any> {
  const { data, error } = await supabase.rpc('cancel_volunteer_assignment', {
    p_assignment_id: assignmentId,
  });

  if (error) throw error;
  return data;
}

// ---------- ADMIN & COORDINATOR OPERATIONS ----------

export async function fetchVolunteerSummary(): Promise<VolunteerSummary> {
  const { data, error } = await supabase.rpc('get_volunteer_summary');
  if (error) throw error;
  return data as VolunteerSummary;
}

export async function fetchAdminOpportunities(
  teamId?: string,
  statusFilter?: string,
  search?: string
): Promise<VolunteerOpportunityItem[]> {
  let query = supabase
    .from('volunteer_opportunities')
    .select(`
      *,
      team:volunteer_teams ( * ),
      event:events ( id, title, category ),
      assignments:volunteer_assignments ( id, status )
    `)
    .order('start_date', { ascending: false });

  if (teamId && teamId !== 'ALL') {
    query = query.eq('team_id', teamId);
  }

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.eq('status', statusFilter);
  }

  if (search && search.trim().length > 0) {
    query = query.ilike('title', `%${search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row: any) => {
    const confirmed = (row.assignments || []).filter((a: any) => a.status === 'Confirmed');
    return {
      ...row,
      confirmed_count: confirmed.length,
    };
  });
}

export async function createAdminOpportunity(payload: CreateOpportunityPayload): Promise<VolunteerOpportunityItem> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('volunteer_opportunities')
    .insert({
      event_id: payload.event_id || null,
      team_id: payload.team_id,
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      role_name: payload.role_name.trim() || 'Volunteer',
      required_volunteers: payload.required_volunteers,
      start_date: payload.start_date,
      start_time: payload.start_time,
      end_date: payload.end_date,
      end_time: payload.end_time,
      venue: payload.venue.trim(),
      status: payload.status || 'Open',
      created_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as VolunteerOpportunityItem;
}

export async function updateAdminOpportunity(
  id: string,
  payload: Partial<CreateOpportunityPayload>
): Promise<VolunteerOpportunityItem> {
  const { data, error } = await supabase
    .from('volunteer_opportunities')
    .update({
      ...(payload.title && { title: payload.title.trim() }),
      ...(payload.description !== undefined && { description: payload.description?.trim() || null }),
      ...(payload.role_name && { role_name: payload.role_name.trim() }),
      ...(payload.required_volunteers !== undefined && { required_volunteers: payload.required_volunteers }),
      ...(payload.start_date && { start_date: payload.start_date }),
      ...(payload.start_time && { start_time: payload.start_time }),
      ...(payload.end_date && { end_date: payload.end_date }),
      ...(payload.end_time && { end_time: payload.end_time }),
      ...(payload.venue && { venue: payload.venue.trim() }),
      ...(payload.status && { status: payload.status }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as VolunteerOpportunityItem;
}

export async function closeAdminOpportunity(id: string): Promise<void> {
  const { error } = await supabase
    .from('volunteer_opportunities')
    .update({ status: 'Closed', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function cancelAdminOpportunity(id: string): Promise<void> {
  const { error } = await supabase
    .from('volunteer_opportunities')
    .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function createAdminTeam(payload: CreateTeamPayload): Promise<VolunteerTeamItem> {
  const { data, error } = await supabase
    .from('volunteer_teams')
    .insert({
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      category: payload.category,
      coordinator_id: payload.coordinator_id || null,
      status: payload.status || 'Active',
    })
    .select()
    .single();

  if (error) throw error;
  return data as VolunteerTeamItem;
}

export async function updateAdminTeam(
  id: string,
  payload: Partial<CreateTeamPayload>
): Promise<VolunteerTeamItem> {
  const { data, error } = await supabase
    .from('volunteer_teams')
    .update({
      ...(payload.name && { name: payload.name.trim() }),
      ...(payload.description !== undefined && { description: payload.description?.trim() || null }),
      ...(payload.category && { category: payload.category }),
      ...(payload.coordinator_id !== undefined && { coordinator_id: payload.coordinator_id || null }),
      ...(payload.status && { status: payload.status }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as VolunteerTeamItem;
}

export async function fetchOpportunityAssignments(opportunityId: string): Promise<VolunteerAssignmentItem[]> {
  const { data, error } = await supabase
    .from('volunteer_assignments')
    .select(`
      *,
      flats (
        flat_number,
        blocks ( name )
      )
    `)
    .eq('opportunity_id', opportunityId)
    .order('assigned_at', { ascending: true });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    flat_number: row.flats?.flat_number || '',
    block_name: row.flats?.blocks?.name || '',
  }));
}

export async function markVolunteerAttendance(
  assignmentId: string,
  attendance: AttendanceStatus
): Promise<any> {
  const { data, error } = await supabase.rpc('admin_mark_volunteer_attendance', {
    p_assignment_id: assignmentId,
    p_attendance: attendance,
  });

  if (error) throw error;
  return data;
}
