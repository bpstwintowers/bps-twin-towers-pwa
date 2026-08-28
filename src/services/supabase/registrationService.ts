import { supabase } from './client';

export interface BlockSummary {
  block_id: string;
  block_name: string;
  total_flats: number;
}

export interface FlatSearchResult {
  flat_id: string;
  block_id: string;
  block_name: string;
  floor_number: number;
  flat_number: string;
  bhk: string;
  owner_registered: boolean;
}

export interface FlatResidentInfo {
  id: string;
  full_name: string;
  resident_type: string;
  masked_email: string;
  avatar_url?: string;
  status: string;
}

export interface AccessInfo {
  membership_id: string;
  flat_id: string;
  flat_number: string;
  block_name: string;
  role_name: string;
  relationship: string;
  membership_status: string;
  bhk?: string;
}

export interface RegistrationRequest {
  id: string;
  flat_id: string;
  flat_number?: string;
  block_name?: string;
  requested_membership_type: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Correction Required';
  correction_message?: string;
  created_at: string;
}

// In-Memory Database Caches (2-minute TTL for fast navigation)
let cachedBlocks: BlockSummary[] | null = null;
let blocksCacheTimestamp = 0;
let cachedCommunitySummary: any | null = null;
let summaryCacheTimestamp = 0;
const CACHE_TTL_MS = 120000;

export async function getBlocks(): Promise<BlockSummary[]> {
  const now = Date.now();
  if (cachedBlocks && now - blocksCacheTimestamp < CACHE_TTL_MS) {
    return cachedBlocks;
  }

  const { data, error } = await supabase
    .from('blocks')
    .select('id, block_name, total_flats')
    .order('block_name');

  if (error) {
    console.error('Error fetching blocks:', error);
    return [];
  }

  const result = (data || []).map((b: any) => ({
    block_id: b.id,
    block_name: b.block_name,
    total_flats: b.total_flats || 0,
  }));

  cachedBlocks = result;
  blocksCacheTimestamp = now;
  return result;
}

export async function getCommunitySummary() {
  const now = Date.now();
  if (cachedCommunitySummary && now - summaryCacheTimestamp < CACHE_TTL_MS) {
    return cachedCommunitySummary;
  }

  const { data, error } = await supabase.rpc('get_community_summary');
  if (error) {
    console.warn('get_community_summary RPC failed or not defined:', error);
    return {
      total_flats_count: 504,
      registered_flats_count: 368,
      active_residents_count: 240,
      verified_members_count: 240,
    };
  }

  cachedCommunitySummary = data;
  summaryCacheTimestamp = now;
  return data;
}

export async function searchFlats(query: string): Promise<FlatSearchResult[]> {
  if (!query || query.trim().length === 0) return [];

  const { data, error } = await supabase
    .from('flats')
    .select(`
      id,
      block_id,
      floor_number,
      flat_number,
      bhk,
      blocks:block_id ( block_name )
    `)
    .ilike('flat_number', `%${query.trim()}%`)
    .limit(8);

  if (error) {
    console.error('Error searching flats:', error);
    return [];
  }

  return (data || []).map((f: any) => ({
    flat_id: f.id,
    block_id: f.block_id,
    block_name: f.blocks?.block_name || '',
    floor_number: f.floor_number,
    flat_number: f.flat_number,
    bhk: f.bhk || '',
    owner_registered: true,
  }));
}

export async function getFlatResidents(flatId: string): Promise<FlatResidentInfo[]> {
  if (!flatId) return [];

  const { data, error } = await supabase
    .from('flat_memberships')
    .select(`
      id,
      status,
      membership_type,
      profile:user_id (
        id,
        full_name,
        email,
        photo_url
      )
    `)
    .eq('flat_id', flatId);

  if (error) {
    console.error('Error fetching flat residents:', error);
    return [];
  }

  return (data || []).map((m: any) => {
    const rawEmail = m.profile?.email || '';
    const masked = rawEmail
      ? rawEmail.replace(/^(.)(.*)(@.*)$/, (_: string, f: string, mid: string, end: string) =>
          f + '*'.repeat(Math.max(mid.length, 3)) + end
        )
      : 'resident@bpstowers.com';

    return {
      id: m.profile?.id || m.id,
      full_name: m.profile?.full_name || 'Resident',
      resident_type: m.membership_type || 'Resident',
      masked_email: masked,
      avatar_url: m.profile?.photo_url,
      status: m.status || 'active',
    };
  });
}

export async function resolveUserAccess(): Promise<AccessInfo[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('flat_memberships')
    .select(`
      id,
      status,
      membership_type,
      flats:flat_id (
        id,
        flat_number,
        bhk,
        blocks:block_id ( block_name )
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error resolving user access:', error);
    return [];
  }

  return (data || []).map((m: any) => ({
    membership_id: m.id,
    flat_id: m.flats?.id,
    flat_number: m.flats?.flat_number || '',
    block_name: m.flats?.blocks?.block_name || 'A',
    role_name: m.membership_type || 'Resident',
    relationship: 'Primary Member',
    membership_status: m.status === 'active' ? 'Active' : m.status || 'Active',
    bhk: m.flats?.bhk,
  }));
}

export async function getUserRegistrations(): Promise<RegistrationRequest[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('registration_requests')
    .select(`
      id,
      flat_id,
      status,
      membership_type,
      correction_message,
      created_at,
      flats:flat_id (
        flat_number,
        blocks:block_id ( block_name )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }

  return (data || []).map((r: any) => ({
    id: r.id,
    flat_id: r.flat_id,
    flat_number: r.flats?.flat_number,
    block_name: r.flats?.blocks?.block_name,
    requested_membership_type: r.membership_type || 'Resident',
    status: r.status as any,
    correction_message: r.correction_message,
    created_at: r.created_at,
  }));
}
