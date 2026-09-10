import { supabase } from './supabase/client';

/**
 * Menu Visibility Service
 * Allows Society Super Admins to configure and control which menu items are exposed to residents.
 * Defaults are set according to society privacy/feature access policies.
 */

export interface MenuVisibilityConfig {
  dashboard: boolean;
  events: boolean;
  facilities: boolean;     // Amenities & Bookings (hidden by default for residents)
  complaints: boolean;     // Maintenance & Complaints (hidden by default for residents)
  visitors: boolean;       // Visitor Passes (hidden by default for residents)
  household: boolean;      // My Household (hidden by default for residents)
  donations: boolean;      // My Contributions
  volunteers: boolean;     // Volunteer Ops
  announcements: boolean;  // Announcements
  notifications: boolean;  // Notifications
  profile: boolean;        // My Profile
}

export const DEFAULT_MENU_VISIBILITY: MenuVisibilityConfig = {
  dashboard: true,
  events: true,
  facilities: false,    // Hidden for residents as requested
  complaints: false,    // Hidden for residents as requested
  visitors: false,      // Hidden for residents as requested
  household: false,     // Hidden for residents as requested
  donations: true,
  volunteers: true,
  announcements: true,
  notifications: true,
  profile: true,
};

export const MENU_ITEM_METADATA: Record<
  keyof MenuVisibilityConfig,
  { label: string; description: string; path: string; iconName: string }
> = {
  dashboard: {
    label: 'Dashboard',
    description: 'Main resident dashboard and overview',
    path: '/',
    iconName: 'Home',
  },
  events: {
    label: 'Events & Festivals',
    description: 'Community festival calendar, puja booking, and schedules',
    path: '/events',
    iconName: 'Calendar',
  },
  facilities: {
    label: 'Amenities & Bookings',
    description: 'Clubhouse, badminton court, gym, and party hall reservations',
    path: '/facilities',
    iconName: 'Building2',
  },
  complaints: {
    label: 'Maintenance & Complaints',
    description: 'Helpdesk ticketing for electrical, plumbing, and common area fixes',
    path: '/complaints',
    iconName: 'Wrench',
  },
  visitors: {
    label: 'Visitor Passes',
    description: 'Digital visitor invites and gate security verification passes',
    path: '/my-visitors',
    iconName: 'Users',
  },
  household: {
    label: 'My Household',
    description: 'Flat co-occupants, family members, and tenant management',
    path: '#household',
    iconName: 'User',
  },
  donations: {
    label: 'My Contributions',
    description: 'Voluntary festival funds, receipts, and contribution ledger',
    path: '/donations',
    iconName: 'CreditCard',
  },
  volunteers: {
    label: 'Volunteer Ops',
    description: 'Community volunteering opportunities and task assignments',
    path: '/volunteers',
    iconName: 'HeartHandshake',
  },
  announcements: {
    label: 'Announcements',
    description: 'Society notice board bulletins and circulars',
    path: '/announcements',
    iconName: 'Megaphone',
  },
  notifications: {
    label: 'Notifications',
    description: 'Personal alerts and society announcements',
    path: '/notifications',
    iconName: 'Bell',
  },
  profile: {
    label: 'My Profile',
    description: 'Personal resident profile and vehicle parking details',
    path: '/profile',
    iconName: 'UserCheck',
  },
};

const STORAGE_KEY = 'bps_resident_menu_visibility';
const EVENT_NAME = 'bps_menu_visibility_changed';

/**
 * Synchronous local retrieval
 */
export function getMenuVisibility(): MenuVisibilityConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return { ...DEFAULT_MENU_VISIBILITY };
    }
    const parsed = JSON.parse(saved);
    return {
      ...DEFAULT_MENU_VISIBILITY,
      ...parsed,
    };
  } catch (err) {
    console.error('Error reading menu visibility config:', err);
    return { ...DEFAULT_MENU_VISIBILITY };
  }
}

/**
 * Async fetch from Supabase (synchronizes database settings with local state)
 */
export async function fetchRemoteMenuVisibility(): Promise<MenuVisibilityConfig> {
  try {
    const { data, error } = await supabase
      .from('societies')
      .select('settings')
      .limit(1)
      .maybeSingle();

    if (!error && data?.settings?.menu_visibility) {
      const merged = {
        ...DEFAULT_MENU_VISIBILITY,
        ...data.settings.menu_visibility,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: merged }));
      return merged;
    }
  } catch (err) {
    console.warn('Could not load remote menu visibility:', err);
  }
  return getMenuVisibility();
}

/**
 * Saves menu visibility to localStorage, Supabase database, and broadcasts event.
 */
export async function saveMenuVisibility(config: MenuVisibilityConfig): Promise<void> {
  try {
    // 1. Save locally for instant reactivity
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: config }));

    // 2. Persist to Supabase societies table
    const { data: societies } = await supabase
      .from('societies')
      .select('id, settings')
      .limit(1);

    if (societies && societies.length > 0) {
      const currentSettings = societies[0].settings || {};
      await supabase
        .from('societies')
        .update({
          settings: {
            ...currentSettings,
            menu_visibility: config,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', societies[0].id);
    }
  } catch (err) {
    console.error('Error saving menu visibility config:', err);
  }
}

/**
 * Resets the menu visibility to default society settings.
 */
export async function resetMenuVisibility(): Promise<MenuVisibilityConfig> {
  await saveMenuVisibility(DEFAULT_MENU_VISIBILITY);
  return { ...DEFAULT_MENU_VISIBILITY };
}

/**
 * Subscribes to menu visibility changes.
 */
export function subscribeToMenuVisibility(
  callback: (config: MenuVisibilityConfig) => void
): () => void {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<MenuVisibilityConfig>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getMenuVisibility());
    }
  };

  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      callback(getMenuVisibility());
    }
  });

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
  };
}
