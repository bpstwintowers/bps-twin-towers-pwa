/**
 * Role-Based Access Control (RBAC) Utilities
 * Provides helpers to evaluate user roles, permissions, and menu visibility.
 */

// Super-admin role names that have unrestricted access across all modules
const SUPER_ADMIN_ROLES = [
  'admin',
  'super_admin',
  'super admin',
  'society admin',
  'management committee',
  'president',
  'secretary',
];

export const SUPER_ADMIN_EMAILS = [
  'bpstwintowers.society@gmail.com',
];

/**
 * Normalizes a role string to lowercase and trimmed format
 */
export function normalizeRole(role: string): string {
  return (role || '').toLowerCase().trim();
}

/**
 * Checks if any of the user's assigned roles or email qualifies as Super / Society Admin
 */
export function isSuperAdmin(userRoles: string[] = [], email?: string): boolean {
  if (email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim())) {
    return true;
  }
  return userRoles.some((role) => {
    const r = normalizeRole(role);
    return (
      r === 'admin' ||
      r === 'super_admin' ||
      r === 'super admin' ||
      r === 'society admin' ||
      r === 'management committee' ||
      r === 'president' ||
      r === 'secretary'
    );
  });
}

/**
 * Evaluates whether a user possessing `userRoles` meets any of the `requiredRoles`
 * Super Admins automatically satisfy any management role requirement.
 */
export function hasRequiredRole(userRoles: string[] = [], requiredRoles?: string[], email?: string): boolean {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true; // No special role required; open to all authenticated users
  }

  // Super / Society Admin has clearance for everything
  if (isSuperAdmin(userRoles, email)) {
    return true;
  }

  const normalizedUser = userRoles.map(normalizeRole);

  return requiredRoles.some((req) => {
    const normalizedReq = normalizeRole(req);
    return normalizedUser.some((uRole) => {
      // If the requirement is pure 'admin' / 'society admin', only pure super admin roles qualify (not domain-specific admins like 'event admin')
      if (
        normalizedReq === 'admin' ||
        normalizedReq === 'super_admin' ||
        normalizedReq === 'super admin' ||
        normalizedReq === 'society admin'
      ) {
        return (
          uRole === 'admin' ||
          uRole === 'super_admin' ||
          uRole === 'super admin' ||
          uRole === 'society admin'
        );
      }

      // Exact match or domain keyword match (e.g. 'event' matches 'event admin')
      return uRole === normalizedReq || uRole.includes(normalizedReq);
    });
  });
}

/**
 * Returns whether the user has at least one administrative / management role
 */
export function hasAnyAdminRole(userRoles: string[] = [], email?: string): boolean {
  if (isSuperAdmin(userRoles, email)) return true;

  const adminKeywords = [
    'admin',
    'event',
    'festival',
    'finance',
    'treasurer',
    'facility',
    'helpdesk',
    'maintenance',
    'volunteer',
    'sponsor',
    'communication',
    'security',
    'gate',
  ];

  return userRoles.some((r) => {
    const lower = normalizeRole(r);
    return adminKeywords.some((kw) => lower.includes(kw));
  });
}
