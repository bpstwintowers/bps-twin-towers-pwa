import { supabase } from './client';

export type EventCategory =
  | 'Festival'
  | 'Cultural'
  | 'Sports'
  | 'Community'
  | 'Kids'
  | 'Religious'
  | 'Workshop'
  | 'Meeting'
  | 'Other';

export type EventStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Published'
  | 'Registration Open'
  | 'Registration Closed'
  | 'Completed'
  | 'Cancelled';

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  organizer: string | null;
  venue: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  banner_url: string | null;
  capacity: number;
  registration_required: boolean;
  registration_start: string | null;
  registration_end: string | null;
  status: EventStatus;
  cancellation_reason: string | null;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  confirmed_count?: number;
  is_registered?: boolean;
}

export interface EventRegistrationItem {
  id: string;
  event_id: string;
  user_id: string;
  flat_id: string | null;
  flat_member_id: string | null;
  participant_name: string;
  participant_email: string | null;
  participant_mobile: string | null;
  participant_type: string;
  quantity: number;
  status: string;
  notes: string | null;
  registered_at: string;
  event?: EventItem;
  flat_number?: string;
  block_name?: string;
}

export interface PoojaBookingItem {
  id: string;
  booking_ref: string;
  user_id: string;
  flat_id: string | null;
  ritual_name: string;
  booking_date: string;
  time_slot: string;
  amount: number;
  status: string;
  created_at: string;
  flat_number?: string;
  block_name?: string;
}

export interface RegisterEventPayload {
  event_id: string;
  flat_id?: string;
  flat_member_id?: string;
  participant_name: string;
  participant_email?: string;
  participant_mobile?: string;
  participant_type?: string;
  quantity?: number;
  notes?: string;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  category: EventCategory;
  organizer?: string;
  venue: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  banner_url?: string;
  capacity?: number;
  registration_required?: boolean;
  registration_start?: string;
  registration_end?: string;
}

// ---------- RESIDENT EVENT QUERIES ----------

export async function fetchPublishedEvents(
  categoryFilter?: string,
  searchQuery?: string
): Promise<EventItem[]> {
  let query = supabase
    .from('events')
    .select(`
      *,
      event_registrations ( id, status, quantity, user_id )
    `)
    .in('status', ['Published', 'Registration Open', 'Registration Closed', 'Completed'])
    .order('start_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (categoryFilter && categoryFilter !== 'ALL') {
    query = query.eq('category', categoryFilter);
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    query = query.ilike('title', `%${searchQuery.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const { data: { user } } = await supabase.auth.getUser();

  return (data || []).map((row: any) => {
    const confirmedRegs = (row.event_registrations || []).filter(
      (r: any) => r.status === 'Confirmed'
    );
    const totalCount = confirmedRegs.reduce(
      (sum: number, r: any) => sum + (r.quantity || 1),
      0
    );
    const isRegistered = user
      ? confirmedRegs.some((r: any) => r.user_id === user.id)
      : false;

    return {
      ...row,
      confirmed_count: totalCount,
      is_registered: isRegistered,
    };
  });
}

export async function fetchEventDetails(eventId: string): Promise<EventItem | null> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_registrations ( id, status, quantity, user_id )
    `)
    .eq('id', eventId)
    .single();

  if (error) throw error;
  if (!data) return null;

  const { data: { user } } = await supabase.auth.getUser();
  const confirmedRegs = (data.event_registrations || []).filter(
    (r: any) => r.status === 'Confirmed'
  );
  const totalCount = confirmedRegs.reduce(
    (sum: number, r: any) => sum + (r.quantity || 1),
    0
  );
  const isRegistered = user
    ? confirmedRegs.some((r: any) => r.user_id === user.id)
    : false;

  return {
    ...data,
    confirmed_count: totalCount,
    is_registered: isRegistered,
  };
}

export async function fetchUserEventRegistrations(): Promise<EventRegistrationItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      events ( * ),
      flats (
        flat_number,
        blocks ( name )
      )
    `)
    .eq('user_id', user.id)
    .order('registered_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    event: row.events,
    flat_number: row.flats?.flat_number || '',
    block_name: row.flats?.blocks?.name || '',
  }));
}

export async function registerForEvent(payload: RegisterEventPayload): Promise<any> {
  const { data, error } = await supabase.rpc('register_for_event', {
    p_event_id: payload.event_id,
    p_flat_id: payload.flat_id || null,
    p_flat_member_id: payload.flat_member_id || null,
    p_participant_name: payload.participant_name,
    p_participant_email: payload.participant_email || null,
    p_participant_mobile: payload.participant_mobile || null,
    p_participant_type: payload.participant_type || 'Primary Resident',
    p_quantity: payload.quantity || 1,
    p_notes: payload.notes || null,
  });

  if (error) throw error;
  return data;
}

export async function cancelEventRegistration(registrationId: string): Promise<any> {
  const { data, error } = await supabase.rpc('cancel_event_registration', {
    p_registration_id: registrationId,
  });
  if (error) throw error;
  return data;
}

// ---------- FESTIVAL POOJA BOOKINGS ----------

export async function fetchPoojaBookings(): Promise<PoojaBookingItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('pooja_bookings')
    .select(`
      *,
      flats (
        flat_number,
        blocks ( name )
      )
    `)
    .eq('user_id', user.id)
    .order('booking_date', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    flat_number: row.flats?.flat_number || '',
    block_name: row.flats?.blocks?.name || '',
  }));
}

export async function createPoojaBooking(payload: {
  flat_id: string;
  ritual_name: string;
  booking_date: string;
  time_slot: string;
  amount: number;
}): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const bookingRef = `PB-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  const { data, error } = await supabase
    .from('pooja_bookings')
    .insert({
      booking_ref: bookingRef,
      user_id: user.id,
      flat_id: payload.flat_id,
      ritual_name: payload.ritual_name,
      booking_date: payload.booking_date,
      time_slot: payload.time_slot,
      amount: payload.amount,
      status: 'Confirmed',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---------- ADMIN EVENT OPERATIONS ----------

export async function fetchAdminEvents(
  statusFilter?: string,
  categoryFilter?: string,
  search?: string
): Promise<EventItem[]> {
  let query = supabase
    .from('events')
    .select(`
      *,
      event_registrations ( id, status, quantity )
    `)
    .order('start_date', { ascending: false });

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
    const confirmedRegs = (row.event_registrations || []).filter(
      (r: any) => r.status === 'Confirmed'
    );
    const totalCount = confirmedRegs.reduce(
      (sum: number, r: any) => sum + (r.quantity || 1),
      0
    );

    return {
      ...row,
      confirmed_count: totalCount,
    };
  });
}

export async function createAdminEvent(payload: CreateEventPayload): Promise<EventItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data, error } = await supabase
    .from('events')
    .insert({
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      category: payload.category,
      organizer: payload.organizer?.trim() || null,
      venue: payload.venue.trim(),
      start_date: payload.start_date,
      start_time: payload.start_time,
      end_date: payload.end_date,
      end_time: payload.end_time,
      banner_url: payload.banner_url || null,
      capacity: payload.capacity || 0,
      registration_required: payload.registration_required || false,
      registration_start: payload.registration_start || null,
      registration_end: payload.registration_end || null,
      status: 'Draft',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as EventItem;
}

export async function updateAdminEvent(
  id: string,
  payload: Partial<CreateEventPayload>
): Promise<EventItem> {
  const { data, error } = await supabase
    .from('events')
    .update({
      ...(payload.title && { title: payload.title.trim() }),
      ...(payload.description !== undefined && { description: payload.description?.trim() || null }),
      ...(payload.category && { category: payload.category }),
      ...(payload.organizer !== undefined && { organizer: payload.organizer?.trim() || null }),
      ...(payload.venue && { venue: payload.venue.trim() }),
      ...(payload.start_date && { start_date: payload.start_date }),
      ...(payload.start_time && { start_time: payload.start_time }),
      ...(payload.end_date && { end_date: payload.end_date }),
      ...(payload.end_time && { end_time: payload.end_time }),
      ...(payload.banner_url !== undefined && { banner_url: payload.banner_url || null }),
      ...(payload.capacity !== undefined && { capacity: payload.capacity }),
      ...(payload.registration_required !== undefined && { registration_required: payload.registration_required }),
      ...(payload.registration_start !== undefined && { registration_start: payload.registration_start || null }),
      ...(payload.registration_end !== undefined && { registration_end: payload.registration_end || null }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as EventItem;
}

export async function approveAdminEvent(eventId: string): Promise<any> {
  const { data, error } = await supabase.rpc('admin_approve_event', {
    p_event_id: eventId,
  });
  if (error) throw error;
  return data;
}

export async function publishAdminEvent(eventId: string): Promise<any> {
  const { data, error } = await supabase.rpc('admin_publish_event', {
    p_event_id: eventId,
  });
  if (error) throw error;
  return data;
}

export async function cancelAdminEvent(eventId: string, reason: string): Promise<any> {
  const { data, error } = await supabase.rpc('admin_cancel_event', {
    p_event_id: eventId,
    p_reason: reason.trim(),
  });
  if (error) throw error;
  return data;
}

export async function fetchEventParticipants(eventId: string): Promise<EventRegistrationItem[]> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      flats (
        flat_number,
        blocks ( name )
      ),
      profiles (
        full_name,
        email,
        mobile
      )
    `)
    .eq('event_id', eventId)
    .order('registered_at', { ascending: true });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    flat_number: row.flats?.flat_number || '',
    block_name: row.flats?.blocks?.name || '',
  }));
}
