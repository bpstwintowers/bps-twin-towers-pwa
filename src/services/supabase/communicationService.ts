import { supabase } from './client';

export type NotificationCategory =
  | 'ALL'
  | 'GENERAL'
  | 'SYSTEM'
  | 'REGISTRATION'
  | 'EVENT'
  | 'BOOKING'
  | 'FINANCE'
  | 'DONATION'
  | 'VOLUNTEER'
  | 'SPONSOR'
  | 'ANNOUNCEMENT'
  | 'SECURITY';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type AnnouncementCategory =
  | 'General'
  | 'Maintenance'
  | 'Festival'
  | 'Emergency'
  | 'Security'
  | 'Meeting'
  | 'Notice';

export type AnnouncementPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export type TargetAudience =
  | 'ALL'
  | 'BLOCK_A'
  | 'BLOCK_B'
  | 'OWNERS'
  | 'TENANTS'
  | 'EVENT_PARTICIPANTS'
  | 'VOLUNTEERS';

export type AnnouncementStatus = 'Draft' | 'Published' | 'Archived' | 'Cancelled';

export interface NotificationItem {
  id: string;
  recipient: string;
  notification_type: string;
  category: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  action_url: string | null;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  target_audience: TargetAudience;
  target_block: string | null;
  action_url: string | null;
  status: AnnouncementStatus;
  published_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: {
    full_name: string | null;
  } | null;
}

export interface NotificationPreferenceItem {
  id: string;
  user_id: string;
  in_app_events: boolean;
  in_app_finance: boolean;
  in_app_volunteers: boolean;
  in_app_sponsors: boolean;
  in_app_announcements: boolean;
  push_enabled: boolean;
  push_events: boolean;
  push_finance: boolean;
  push_volunteers: boolean;
  push_announcements: boolean;
  updated_at: string;
}

export interface CommunicationSummary {
  total_notifications: number;
  unread_notifications: number;
  active_announcements: number;
  urgent_announcements: number;
  today_broadcasts: number;
}

export interface CreateAnnouncementPayload {
  title: string;
  message: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  target_audience: TargetAudience;
  target_block?: string;
  action_url?: string;
  expires_at?: string;
}

// ---------- RESIDENT NOTIFICATION METHODS ----------

export async function fetchNotifications(
  categoryFilter?: string,
  unreadOnly?: boolean
): Promise<NotificationItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('recipient', user.id)
    .order('created_at', { ascending: false });

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  if (categoryFilter && categoryFilter !== 'ALL') {
    query = query.eq('category', categoryFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as NotificationItem[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<number> {
  const { data, error } = await supabase.rpc('mark_all_notifications_read');
  if (error) throw error;
  return (data as any)?.marked_count || 0;
}

export async function fetchUnreadCount(): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_notification_count');
  if (error) throw error;
  return typeof data === 'number' ? data : 0;
}

// ---------- RESIDENT ANNOUNCEMENTS & PREFERENCES ----------

export async function fetchActiveAnnouncements(): Promise<AnnouncementItem[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      creator:profiles ( full_name )
    `)
    .eq('status', 'Published')
    .order('published_at', { ascending: false });

  if (error) throw error;
  return (data || []) as AnnouncementItem[];
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferenceItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    // Insert defaults
    const { data: created, error: createErr } = await supabase
      .from('notification_preferences')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (createErr) throw createErr;
    return created as NotificationPreferenceItem;
  }

  return data as NotificationPreferenceItem;
}

export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreferenceItem>
): Promise<NotificationPreferenceItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data, error } = await supabase
    .from('notification_preferences')
    .update({
      ...prefs,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as NotificationPreferenceItem;
}

// ---------- ADMIN COMMUNICATION MANAGEMENT ----------

export async function fetchCommunicationSummary(): Promise<CommunicationSummary> {
  const { data, error } = await supabase.rpc('get_communication_summary');
  if (error) throw error;
  return data as CommunicationSummary;
}

export async function fetchAdminAnnouncements(statusFilter?: string): Promise<AnnouncementItem[]> {
  let query = supabase
    .from('announcements')
    .select(`
      *,
      creator:profiles ( full_name )
    `)
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as AnnouncementItem[];
}

export async function createAdminAnnouncement(
  payload: CreateAnnouncementPayload
): Promise<AnnouncementItem> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: payload.title.trim(),
      message: payload.message.trim(),
      category: payload.category,
      priority: payload.priority,
      target_audience: payload.target_audience,
      target_block: payload.target_block?.trim() || null,
      action_url: payload.action_url?.trim() || null,
      expires_at: payload.expires_at || null,
      status: 'Draft',
      created_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AnnouncementItem;
}

export async function updateAdminAnnouncement(
  id: string,
  payload: Partial<CreateAnnouncementPayload>
): Promise<AnnouncementItem> {
  const { data, error } = await supabase
    .from('announcements')
    .update({
      ...(payload.title && { title: payload.title.trim() }),
      ...(payload.message && { message: payload.message.trim() }),
      ...(payload.category && { category: payload.category }),
      ...(payload.priority && { priority: payload.priority }),
      ...(payload.target_audience && { target_audience: payload.target_audience }),
      ...(payload.target_block !== undefined && { target_block: payload.target_block?.trim() || null }),
      ...(payload.action_url !== undefined && { action_url: payload.action_url?.trim() || null }),
      ...(payload.expires_at !== undefined && { expires_at: payload.expires_at || null }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as AnnouncementItem;
}

export async function publishAdminAnnouncement(id: string): Promise<any> {
  const { data, error } = await supabase.rpc('publish_announcement', {
    p_announcement_id: id,
  });

  if (error) throw error;
  return data;
}

export async function cancelAdminAnnouncement(id: string): Promise<void> {
  const { error } = await supabase
    .from('announcements')
    .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function estimateAudienceCount(audience: TargetAudience): Promise<number> {
  if (audience === 'ALL') {
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    return count || 0;
  }

  if (audience === 'BLOCK_A') {
    const { count } = await supabase
      .from('flat_members')
      .select('profile_id, flat:flats!inner(block:blocks!inner(code))', { count: 'exact', head: true })
      .ilike('flat.block.code', '%A%');
    return count || 0;
  }

  if (audience === 'BLOCK_B') {
    const { count } = await supabase
      .from('flat_members')
      .select('profile_id, flat:flats!inner(block:blocks!inner(code))', { count: 'exact', head: true })
      .ilike('flat.block.code', '%B%');
    return count || 0;
  }

  if (audience === 'OWNERS') {
    const { count } = await supabase
      .from('flat_members')
      .select('*', { count: 'exact', head: true })
      .eq('member_type', 'Owner');
    return count || 0;
  }

  if (audience === 'TENANTS') {
    const { count } = await supabase
      .from('flat_members')
      .select('*', { count: 'exact', head: true })
      .eq('member_type', 'Tenant');
    return count || 0;
  }

  const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  return count || 0;
}

// ---------- PWA WEB PUSH HELPERS ----------

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

export function getPushPermissionState(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.permission;
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return await Notification.requestPermission();
}
