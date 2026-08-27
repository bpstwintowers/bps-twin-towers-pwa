import { supabase } from './client';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type ComplaintStatus =
  | 'Open'
  | 'Acknowledged'
  | 'Assigned'
  | 'In Progress'
  | 'Waiting for Resident'
  | 'Resolved'
  | 'Closed'
  | 'Reopened'
  | 'Rejected'
  | 'Cancelled';

export type LocationType = 'My Flat' | 'Common Area' | 'Facility' | 'Parking' | 'Other';

export interface ComplaintCategoryItem {
  id: string;
  name: string;
  default_sla_hours: number;
  default_team: string;
  icon: string | null;
  is_active: boolean;
}

export interface ComplaintAttachmentItem {
  id: string;
  complaint_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
}

export interface ComplaintCommentItem {
  id: string;
  complaint_id: string;
  author_id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
  author?: {
    full_name: string | null;
    email: string | null;
  };
}

export interface ComplaintItem {
  id: string;
  complaint_number: string;
  created_by: string;
  flat_id: string | null;
  category: string;
  title: string;
  description: string;
  priority: ComplaintPriority;
  location_type: LocationType;
  location_detail: string | null;
  facility_id: string | null;
  assigned_team: string | null;
  assigned_to: string | null;
  status: ComplaintStatus;
  due_at: string;
  resolved_at: string | null;
  resolution_summary: string | null;
  closed_at: string | null;
  reopened_at: string | null;
  reopen_reason: string | null;
  reopen_count: number;
  created_at: string;
  updated_at: string;
  flat?: {
    id: string;
    flat_number: string;
    block?: {
      name: string;
      code: string;
    } | null;
  } | null;
  creator?: {
    full_name: string | null;
    email: string | null;
  };
  assignee?: {
    full_name: string | null;
  } | null;
  facility?: {
    name: string;
  } | null;
  comments?: ComplaintCommentItem[];
  attachments?: ComplaintAttachmentItem[];
}

export interface CreateComplaintPayload {
  flat_id?: string;
  category: string;
  title: string;
  description: string;
  priority: ComplaintPriority;
  location_type: LocationType;
  location_detail?: string;
  facility_id?: string;
}

export interface FacilityAndComplaintSummary {
  active_facilities: number;
  today_bookings: number;
  pending_bookings: number;
  open_complaints: number;
  urgent_complaints: number;
  overdue_complaints: number;
  resolved_today: number;
}

// ---------- RESIDENT COMPLAINTS OPERATIONS ----------

export async function fetchComplaintCategories(): Promise<ComplaintCategoryItem[]> {
  const { data, error } = await supabase
    .from('complaint_categories')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []) as ComplaintCategoryItem[];
}

export async function fetchResidentComplaints(statusGroup?: 'open' | 'resolved' | 'all'): Promise<ComplaintItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  let query = supabase
    .from('complaints')
    .select(`
      *,
      flat:flats ( id, flat_number, block:blocks(name, code) ),
      creator:profiles!complaints_created_by_fkey ( full_name, email )
    `)
    .order('created_at', { ascending: false });

  if (statusGroup === 'open') {
    query = query.in('status', ['Open', 'Acknowledged', 'Assigned', 'In Progress', 'Waiting for Resident', 'Reopened']);
  } else if (statusGroup === 'resolved') {
    query = query.in('status', ['Resolved', 'Closed', 'Rejected', 'Cancelled']);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ComplaintItem[];
}

export async function fetchComplaintDetails(complaintId: string): Promise<ComplaintItem | null> {
  const { data: complaint, error: compErr } = await supabase
    .from('complaints')
    .select(`
      *,
      flat:flats ( id, flat_number, block:blocks(name, code) ),
      creator:profiles!complaints_created_by_fkey ( full_name, email ),
      assignee:profiles!complaints_assigned_to_fkey ( full_name ),
      facility:facilities ( name )
    `)
    .eq('id', complaintId)
    .single();

  if (compErr) return null;

  // Fetch comments
  const { data: comments } = await supabase
    .from('complaint_comments')
    .select(`
      *,
      author:profiles ( full_name, email )
    `)
    .eq('complaint_id', complaintId)
    .order('created_at', { ascending: true });

  // Fetch attachments
  const { data: attachments } = await supabase
    .from('complaint_attachments')
    .select('*')
    .eq('complaint_id', complaintId)
    .order('created_at', { ascending: true });

  return {
    ...(complaint as ComplaintItem),
    comments: (comments || []) as ComplaintCommentItem[],
    attachments: (attachments || []) as ComplaintAttachmentItem[],
  };
}

export async function createComplaint(payload: CreateComplaintPayload): Promise<any> {
  const { data, error } = await supabase.rpc('create_complaint', {
    p_flat_id: payload.flat_id || null,
    p_category: payload.category,
    p_title: payload.title.trim(),
    p_description: payload.description.trim(),
    p_priority: payload.priority,
    p_location_type: payload.location_type,
    p_location_detail: payload.location_detail?.trim() || '',
    p_facility_id: payload.facility_id || null,
  });

  if (error) throw error;
  return data;
}

export async function addComplaintComment(
  complaintId: string,
  comment: string,
  isInternal: boolean = false
): Promise<ComplaintCommentItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data, error } = await supabase
    .from('complaint_comments')
    .insert({
      complaint_id: complaintId,
      author_id: user.id,
      comment: comment.trim(),
      is_internal: isInternal,
    })
    .select(`
      *,
      author:profiles ( full_name, email )
    `)
    .single();

  if (error) throw error;
  return data as ComplaintCommentItem;
}

export async function uploadComplaintAttachment(
  complaintId: string,
  file: File
): Promise<ComplaintAttachmentItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const fileExt = file.name.split('.').pop();
  const filePath = `complaints/${complaintId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  // 1. Upload to private bucket
  const { error: uploadError } = await supabase.storage
    .from('complaint-attachments')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  // 2. Insert metadata record
  const { data, error: dbError } = await supabase
    .from('complaint_attachments')
    .insert({
      complaint_id: complaintId,
      uploaded_by: user.id,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type || 'image/jpeg',
      file_size: file.size,
    })
    .select()
    .single();

  if (dbError) throw dbError;
  return data as ComplaintAttachmentItem;
}

export async function getAttachmentSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('complaint-attachments')
    .createSignedUrl(filePath, 3600); // 1 hour expiration

  if (error || !data) throw new Error('Failed to generate attachment link.');
  return data.signedUrl;
}

export async function respondToComplaintResolution(
  complaintId: string,
  action: 'Close' | 'Reopen',
  reason?: string
): Promise<any> {
  const { data, error } = await supabase.rpc('resident_respond_complaint_resolution', {
    p_complaint_id: complaintId,
    p_action: action,
    p_reason: reason?.trim() || '',
  });

  if (error) throw error;
  return data;
}

// ---------- ADMIN HELP DESK OPERATIONS ----------

export async function fetchAdminComplaints(
  statusFilter?: string,
  priorityFilter?: string,
  categoryFilter?: string
): Promise<ComplaintItem[]> {
  let query = supabase
    .from('complaints')
    .select(`
      *,
      flat:flats ( id, flat_number, block:blocks(name, code) ),
      creator:profiles!complaints_created_by_fkey ( full_name, email ),
      assignee:profiles!complaints_assigned_to_fkey ( full_name )
    `)
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'ALL') {
    if (statusFilter === 'OPEN_GROUP') {
      query = query.in('status', ['Open', 'Acknowledged', 'Assigned', 'In Progress', 'Reopened']);
    } else {
      query = query.eq('status', statusFilter);
    }
  }

  if (priorityFilter && priorityFilter !== 'ALL') {
    query = query.eq('priority', priorityFilter);
  }

  if (categoryFilter && categoryFilter !== 'ALL') {
    query = query.eq('category', categoryFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ComplaintItem[];
}

export async function updateAdminComplaintStatus(
  complaintId: string,
  status: ComplaintStatus,
  assignedTeam?: string,
  assignedTo?: string,
  resolutionSummary?: string
): Promise<any> {
  const { data, error } = await supabase.rpc('update_complaint_status', {
    p_complaint_id: complaintId,
    p_status: status,
    p_assigned_team: assignedTeam || null,
    p_assigned_to: assignedTo || null,
    p_resolution_summary: resolutionSummary?.trim() || null,
  });

  if (error) throw error;
  return data;
}

export async function fetchFacilityAndComplaintSummary(): Promise<FacilityAndComplaintSummary> {
  const { data, error } = await supabase.rpc('get_facility_and_complaint_summary');
  if (error) throw error;
  return data as FacilityAndComplaintSummary;
}
