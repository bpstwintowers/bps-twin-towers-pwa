import { supabase } from './client';

export type FacilityCategory =
  | 'Sports'
  | 'Recreation'
  | 'Community'
  | 'Fitness'
  | 'Kids'
  | 'Event'
  | 'Other';

export type FacilityStatus =
  | 'Active'
  | 'Inactive'
  | 'Maintenance'
  | 'Temporarily Closed'
  | 'Archived';

export type BookingStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Rejected'
  | 'Cancelled'
  | 'Completed';

export interface FacilityItem {
  id: string;
  name: string;
  description: string | null;
  category: FacilityCategory;
  location: string | null;
  capacity: number;
  status: FacilityStatus;
  booking_required: boolean;
  approval_required: boolean;
  opening_time: string;
  closing_time: string;
  slot_duration_minutes: number;
  advance_booking_days: number;
  rules_terms: string | null;
  created_at: string;
  updated_at: string;
}

export interface FacilityBookingItem {
  id: string;
  facility_id: string;
  booked_by: string;
  flat_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  participant_count: number;
  purpose: string | null;
  status: BookingStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  facility?: FacilityItem;
  flat?: {
    id: string;
    flat_number: string;
    block?: {
      name: string;
      code: string;
    } | null;
  };
  booker?: {
    full_name: string | null;
    email: string | null;
  };
}

export interface FacilityBlockItem {
  id: string;
  facility_id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  reason: string;
  status: 'Active' | 'Cancelled';
  created_by: string | null;
  created_at: string;
  facility?: FacilityItem;
}

export interface CreateFacilityBookingPayload {
  facility_id: string;
  flat_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  participant_count: number;
  purpose?: string;
}

export interface CreateFacilityPayload {
  name: string;
  description?: string;
  category: FacilityCategory;
  location?: string;
  capacity: number;
  booking_required?: boolean;
  approval_required?: boolean;
  opening_time: string;
  closing_time: string;
  slot_duration_minutes?: number;
  advance_booking_days?: number;
  rules_terms?: string;
}

export interface CreateBlockPayload {
  facility_id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  reason: string;
}

export interface SlotAvailability {
  start_time: string;
  end_time: string;
  label: string;
  is_available: boolean;
  reason?: string;
}

// ---------- RESIDENT FACILITY QUERIES ----------

export async function fetchActiveFacilities(category?: string): Promise<FacilityItem[]> {
  let query = supabase
    .from('facilities')
    .select('*')
    .eq('status', 'Active')
    .order('name', { ascending: true });

  if (category && category !== 'ALL') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as FacilityItem[];
}

export async function fetchFacilityById(id: string): Promise<FacilityItem | null> {
  const { data, error } = await supabase
    .from('facilities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as FacilityItem;
}

export async function fetchFacilityAvailability(
  facilityId: string,
  date: string
): Promise<SlotAvailability[]> {
  const facility = await fetchFacilityById(facilityId);
  if (!facility) throw new Error('Facility not found.');

  // Fetch confirmed/pending bookings for this date
  const { data: bookings } = await supabase
    .from('facility_bookings')
    .select('start_time, end_time, status')
    .eq('facility_id', facilityId)
    .eq('booking_date', date)
    .in('status', ['Confirmed', 'Pending']);

  // Fetch maintenance blocks for this date
  const { data: blocks } = await supabase
    .from('facility_blocks')
    .select('start_time, end_time, reason')
    .eq('facility_id', facilityId)
    .eq('block_date', date)
    .eq('status', 'Active');

  const slots: SlotAvailability[] = [];
  const duration = facility.slot_duration_minutes || 60;

  const [openHour, openMin] = facility.opening_time.split(':').map(Number);
  const [closeHour, closeMin] = facility.closing_time.split(':').map(Number);

  let currentMinutes = openHour * 60 + openMin;
  const endMinutes = closeHour * 60 + closeMin;

  while (currentMinutes + duration <= endMinutes) {
    const slotStartHour = Math.floor(currentMinutes / 60);
    const slotStartMin = currentMinutes % 60;
    const slotEndHour = Math.floor((currentMinutes + duration) / 60);
    const slotEndMin = (currentMinutes + duration) % 60;

    const startStr = `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}:00`;
    const endStr = `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}:00`;

    // Check if overlaps booking
    const isBooked = (bookings || []).some((b) => {
      return (
        (startStr < b.end_time && endStr > b.start_time)
      );
    });

    // Check if overlaps maintenance block
    const isBlocked = (blocks || []).some((blk) => {
      return (
        (startStr < blk.end_time && endStr > blk.start_time)
      );
    });

    const formatTime = (h: number, m: number) => {
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 || 12;
      return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
    };

    const label = `${formatTime(slotStartHour, slotStartMin)} – ${formatTime(slotEndHour, slotEndMin)}`;

    let isAvail = true;
    let reason = undefined;

    if (isBlocked) {
      isAvail = false;
      reason = 'Maintenance Block';
    } else if (isBooked) {
      isAvail = false;
      reason = 'Booked';
    }

    slots.push({
      start_time: startStr,
      end_time: endStr,
      label,
      is_available: isAvail,
      reason,
    });

    currentMinutes += duration;
  }

  return slots;
}

export async function bookFacility(payload: CreateFacilityBookingPayload): Promise<any> {
  const { data, error } = await supabase.rpc('book_facility', {
    p_facility_id: payload.facility_id,
    p_flat_id: payload.flat_id,
    p_booking_date: payload.booking_date,
    p_start_time: payload.start_time,
    p_end_time: payload.end_time,
    p_participant_count: payload.participant_count,
    p_purpose: payload.purpose || '',
  });

  if (error) throw error;
  return data;
}

export async function fetchResidentFacilityBookings(): Promise<FacilityBookingItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data, error } = await supabase
    .from('facility_bookings')
    .select(`
      *,
      facility:facilities ( * ),
      flat:flats ( id, flat_number, block:blocks(name, code) )
    `)
    .order('booking_date', { ascending: false })
    .order('start_time', { ascending: false });

  if (error) throw error;
  return (data || []) as FacilityBookingItem[];
}

export async function cancelFacilityBooking(bookingId: string, reason?: string): Promise<any> {
  const { data, error } = await supabase.rpc('cancel_facility_booking', {
    p_booking_id: bookingId,
    p_reason: reason?.trim() || 'Cancelled by resident',
  });

  if (error) throw error;
  return data;
}

// ---------- ADMIN FACILITY OPERATIONS ----------

export async function fetchAdminFacilities(): Promise<FacilityItem[]> {
  const { data, error } = await supabase
    .from('facilities')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []) as FacilityItem[];
}

export async function createAdminFacility(payload: CreateFacilityPayload): Promise<FacilityItem> {
  const { data, error } = await supabase
    .from('facilities')
    .insert({
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      category: payload.category,
      location: payload.location?.trim() || null,
      capacity: payload.capacity,
      booking_required: payload.booking_required ?? true,
      approval_required: payload.approval_required ?? false,
      opening_time: payload.opening_time,
      closing_time: payload.closing_time,
      slot_duration_minutes: payload.slot_duration_minutes || 60,
      advance_booking_days: payload.advance_booking_days || 7,
      rules_terms: payload.rules_terms?.trim() || null,
      status: 'Active',
    })
    .select()
    .single();

  if (error) throw error;
  return data as FacilityItem;
}

export async function updateAdminFacility(
  id: string,
  payload: Partial<CreateFacilityPayload> & { status?: FacilityStatus }
): Promise<FacilityItem> {
  const { data, error } = await supabase
    .from('facilities')
    .update({
      ...(payload.name && { name: payload.name.trim() }),
      ...(payload.description !== undefined && { description: payload.description?.trim() || null }),
      ...(payload.category && { category: payload.category }),
      ...(payload.location !== undefined && { location: payload.location?.trim() || null }),
      ...(payload.capacity && { capacity: payload.capacity }),
      ...(payload.status && { status: payload.status }),
      ...(payload.booking_required !== undefined && { booking_required: payload.booking_required }),
      ...(payload.approval_required !== undefined && { approval_required: payload.approval_required }),
      ...(payload.opening_time && { opening_time: payload.opening_time }),
      ...(payload.closing_time && { closing_time: payload.closing_time }),
      ...(payload.slot_duration_minutes && { slot_duration_minutes: payload.slot_duration_minutes }),
      ...(payload.advance_booking_days && { advance_booking_days: payload.advance_booking_days }),
      ...(payload.rules_terms !== undefined && { rules_terms: payload.rules_terms?.trim() || null }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as FacilityItem;
}

export async function fetchAdminFacilityBookings(
  statusFilter?: string,
  facilityId?: string
): Promise<FacilityBookingItem[]> {
  let query = supabase
    .from('facility_bookings')
    .select(`
      *,
      facility:facilities ( * ),
      flat:flats ( id, flat_number, block:blocks(name, code) ),
      booker:profiles!facility_bookings_booked_by_fkey ( full_name, email )
    `)
    .order('booking_date', { ascending: false })
    .order('start_time', { ascending: false });

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.eq('status', statusFilter);
  }

  if (facilityId && facilityId !== 'ALL') {
    query = query.eq('facility_id', facilityId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as FacilityBookingItem[];
}

export async function adminRespondFacilityBooking(
  bookingId: string,
  action: 'Approved' | 'Rejected',
  reason?: string
): Promise<any> {
  const { data, error } = await supabase.rpc('admin_respond_facility_booking', {
    p_booking_id: bookingId,
    p_action: action,
    p_reason: reason?.trim() || '',
  });

  if (error) throw error;
  return data;
}

export async function fetchFacilityBlocks(): Promise<FacilityBlockItem[]> {
  const { data, error } = await supabase
    .from('facility_blocks')
    .select(`
      *,
      facility:facilities ( name, location )
    `)
    .order('block_date', { ascending: false });

  if (error) throw error;
  return (data || []) as FacilityBlockItem[];
}

export async function createFacilityBlock(payload: CreateBlockPayload): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('facility_blocks')
    .insert({
      facility_id: payload.facility_id,
      block_date: payload.block_date,
      start_time: payload.start_time,
      end_time: payload.end_time,
      reason: payload.reason.trim(),
      created_by: user?.id,
      status: 'Active',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
