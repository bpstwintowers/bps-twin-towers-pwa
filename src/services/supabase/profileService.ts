import { supabase } from './client';

export interface UserProfileData {
  id: string;
  full_name: string;
  email: string;
  mobile: string | null;
  photo_url: string | null;
  resident_since: string | null;
  parking_details: string | null;
  blood_group: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProfilePayload {
  full_name: string;
  mobile?: string | null;
  photo_url?: string | null;
  resident_since?: string | null;
  parking_details?: string | null;
  blood_group?: string | null;
}

/**
 * Fetches the current user's profile from 'profiles' table
 */
export async function getCurrentUserProfile(): Promise<UserProfileData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching current user profile:', error);
    throw error;
  }

  if (data) {
    return {
      id: data.id,
      full_name: data.full_name || '',
      email: data.email || user.email || '',
      mobile: data.mobile || null,
      photo_url: data.photo_url || null,
      resident_since: data.resident_since || null,
      parking_details: data.parking_details || null,
      blood_group: data.blood_group || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  // Fallback initial profile if not yet created in table
  return {
    id: user.id,
    full_name: (user.user_metadata?.full_name as string) || '',
    email: user.email || '',
    mobile: null,
    photo_url: null,
    resident_since: null,
    parking_details: null,
    blood_group: null,
  };
}

/**
 * Updates the user's profile and synchronizes relevant fields to flat_members
 */
export async function updateUserProfile(payload: UpdateProfilePayload): Promise<UserProfileData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const updateData = {
    full_name: payload.full_name.trim(),
    mobile: payload.mobile ? payload.mobile.trim() : null,
    photo_url: payload.photo_url ? payload.photo_url.trim() : null,
    resident_since: payload.resident_since || null,
    parking_details: payload.parking_details ? payload.parking_details.trim() : null,
    blood_group: payload.blood_group || null,
    updated_at: new Date().toISOString(),
  };

  // Upsert into profiles
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email,
      ...updateData,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  // Also sync full_name, mobile, parking_details to flat_members for this user
  try {
    await supabase
      .from('flat_members')
      .update({
        full_name: updateData.full_name,
        mobile: updateData.mobile,
        parking_details: updateData.parking_details,
      })
      .eq('user_id', user.id);
  } catch (syncErr) {
    console.warn('Could not sync to flat_members:', syncErr);
  }

  return {
    id: data.id,
    full_name: data.full_name || '',
    email: data.email || user.email || '',
    mobile: data.mobile || null,
    photo_url: data.photo_url || null,
    resident_since: data.resident_since || null,
    parking_details: data.parking_details || null,
    blood_group: data.blood_group || null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export interface FamilyMemberItem {
  id: string;
  full_name: string;
  relationship: string;
  membership_type?: string;
  email?: string | null;
  mobile?: string | null;
  blood_group?: string | null;
  date_of_birth?: string | null;
  age?: number | null;
  is_registered?: boolean;
}

export interface TenantInfo {
  occupancy_status: string;
  tenant_name?: string | null;
  tenant_email?: string | null;
  tenant_mobile?: string | null;
  lease_start_date?: string | null;
  lease_end_date?: string | null;
  rental_agreement_url?: string | null;
}

export interface VehicleInfo {
  slot_number?: string;
  vehicle_type?: string;
  make_model?: string;
  reg_number?: string;
  colour?: string;
}

export interface UserNotificationPrefs {
  email_notifications: boolean;
  sms_notifications: boolean;
  event_updates: boolean;
  contribution_updates: boolean;
  announcement_updates: boolean;
}

/**
 * Fetches all family members linked to the active flat
 */
export async function getHouseholdFamilyMembers(flatId?: string): Promise<FamilyMemberItem[]> {
  if (!flatId) return [];

  const members: FamilyMemberItem[] = [];
  const seenNames = new Set<string>();

  try {
    // 1. Fetch from flat_members table
    const { data: dbMembers } = await supabase
      .from('flat_members')
      .select(`
        id,
        user_id,
        full_name,
        relationship,
        membership_type,
        email,
        mobile,
        date_of_birth
      `)
      .eq('flat_id', flatId);

    if (dbMembers) {
      dbMembers.forEach((m) => {
        if (m.relationship !== 'Self' && m.membership_type !== 'Primary Resident') {
          seenNames.add((m.full_name || '').toLowerCase().trim());
          members.push({
            id: m.id,
            full_name: m.full_name || 'Family Member',
            relationship: m.relationship || 'Family Member',
            membership_type: m.membership_type || 'Family Member',
            email: m.email || null,
            mobile: m.mobile || null,
            date_of_birth: m.date_of_birth || null,
            is_registered: Boolean(m.user_id),
          });
        }
      });
    }

    // 2. Fetch from registration_requests.family_members jsonb
    const { data: regRequests } = await supabase
      .from('registration_requests')
      .select('family_members')
      .eq('flat_id', flatId)
      .not('family_members', 'is', null);

    if (regRequests) {
      regRequests.forEach((req) => {
        if (Array.isArray(req.family_members)) {
          req.family_members.forEach((fm: any, idx: number) => {
            const nameLower = (fm.full_name || '').toLowerCase().trim();
            if (nameLower && !seenNames.has(nameLower)) {
              seenNames.add(nameLower);
              members.push({
                id: `reg-fm-${idx}-${Date.now()}`,
                full_name: fm.full_name,
                relationship: fm.relationship || 'Family Member',
                email: fm.email || null,
                mobile: fm.mobile || null,
                blood_group: fm.blood_group || null,
                age: fm.age || null,
                date_of_birth: fm.dob_month_year || null,
                is_registered: false,
              });
            }
          });
        }
      });
    }
  } catch (err) {
    console.error('Error fetching household family members:', err);
  }

  return members;
}

/**
 * Fetches tenant and lease details for the flat
 */
export async function getFlatTenantAndOccupancy(flatId?: string): Promise<TenantInfo> {
  const defaultInfo: TenantInfo = {
    occupancy_status: 'Self Occupied',
    tenant_name: null,
    tenant_email: null,
    tenant_mobile: null,
    lease_start_date: null,
    lease_end_date: null,
    rental_agreement_url: null,
  };

  if (!flatId) return defaultInfo;

  try {
    const { data } = await supabase
      .from('registration_requests')
      .select(`
        occupancy_status,
        tenant_name,
        tenant_email,
        tenant_mobile,
        lease_start_date,
        lease_end_date,
        rental_agreement_url
      `)
      .eq('flat_id', flatId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      return {
        occupancy_status: data.occupancy_status || 'Self Occupied',
        tenant_name: data.tenant_name || null,
        tenant_email: data.tenant_email || null,
        tenant_mobile: data.tenant_mobile || null,
        lease_start_date: data.lease_start_date || null,
        lease_end_date: data.lease_end_date || null,
        rental_agreement_url: data.rental_agreement_url || null,
      };
    }
  } catch (err) {
    console.error('Error fetching tenant details:', err);
  }

  return defaultInfo;
}

/**
 * Fetches vehicles registered for the flat
 */
export async function getFlatVehicles(flatId?: string): Promise<VehicleInfo[]> {
  if (!flatId) return [];

  try {
    const { data } = await supabase
      .from('registration_requests')
      .select('vehicles')
      .eq('flat_id', flatId)
      .not('vehicles', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && Array.isArray(data.vehicles)) {
      return data.vehicles;
    }
  } catch (err) {
    console.error('Error fetching flat vehicles:', err);
  }

  return [];
}

/**
 * Fetches user's notification preferences
 */
export async function getUserNotificationPreferences(): Promise<UserNotificationPrefs> {
  const defaultPrefs: UserNotificationPrefs = {
    email_notifications: true,
    sms_notifications: true,
    event_updates: true,
    contribution_updates: false,
    announcement_updates: true,
  };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return defaultPrefs;

    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      return {
        email_notifications: data.push_enabled ?? true,
        sms_notifications: data.in_app_announcements ?? true,
        event_updates: data.in_app_events ?? true,
        contribution_updates: data.in_app_finance ?? false,
        announcement_updates: data.push_announcements ?? true,
      };
    }
  } catch (err) {
    console.error('Error fetching notification preferences:', err);
  }

  return defaultPrefs;
}

/**
 * Saves user notification preferences
 */
export async function updateUserNotificationPreferences(prefs: UserNotificationPrefs): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notification_preferences')
    .upsert({
      user_id: user.id,
      push_enabled: prefs.email_notifications,
      in_app_announcements: prefs.sms_notifications,
      in_app_events: prefs.event_updates,
      in_app_finance: prefs.contribution_updates,
      push_announcements: prefs.announcement_updates,
      updated_at: new Date().toISOString(),
    });
}

