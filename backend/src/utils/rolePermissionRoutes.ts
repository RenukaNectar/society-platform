/**
 * Hardcoded route-to-permission mapping aligned with frontend navigation.
 * Use for RBAC: resolving permission for a path or listing allowed routes by permission.
 */

export interface NavRoutePermission {
  name: string;
  path: string;
  /** Frontend permission key (e.g. canViewDashboard). Use "open" for routes that require no permission. */
  permission: string;
  /** Optional resource/module for backend permission check (e.g. liquidation). */
  module?: string;
  /** Optional action for backend permission check (e.g. view). */
  action?: string;
}

/** Paths only admin sees (Users, Modules). */
export const USERS_ROUTE_PATH = '/users';
export const MODULES_ROUTE_PATH = '/modules';

/** Path only applicant sees (My Society). */
export const MY_SOCIETY_ROUTE_PATH = '/my-society';

/** Admin-only nav paths – hidden from applicant and other roles. */
export const ADMIN_ONLY_ROUTE_PATHS = [USERS_ROUTE_PATH, MODULES_ROUTE_PATH];

/** Applicant-only nav paths – hidden from other roles (but admin sees all). */
export const APPLICANT_ONLY_ROUTE_PATHS = [MY_SOCIETY_ROUTE_PATH];

/** All nav routes with their required permission keys. */
export const NAV_ROUTE_PERMISSIONS: NavRoutePermission[] = [
  { name: 'Dashboard', path: '/', permission: 'canViewDashboard' },
  { name: 'Users', path: USERS_ROUTE_PATH, permission: 'canViewUser' },
  { name: 'Societies', path: '/registrations', permission: 'canViewSocieties' },
  { name: 'Conversion Society', path: '/conversion-society', permission: 'canViewConversionSociety' },
  { name: 'Annual Filings', path: '/annual-filings', permission: 'canViewAnnualReturn' },
  { name: 'Amendments', path: '/amendments', permission: 'canViewAmendment' },
  { name: 'Audit Requests', path: '/audit-requests', permission: 'canViewAuditRequest' },
  { name: 'Election Requests', path: '/election-requests', permission: 'canViewElectionRequest' },
  {
    name: 'Liquidation',
    path: '/liquidation',
    permission: 'canViewLiquidation',
    module: 'liquidation',
    action: 'view',
  },
  { name: 'Inquiries / Inspections', path: '/inquiries', permission: 'canViewInquiryInspection' },
  { name: 'Appeals', path: '/appeals', permission: 'canViewAppeal' },
  { name: 'AGM', path: '/annual-general-meeting', permission: 'canViewAnnualGeneralMeeting' },
  { name: 'SGBM', path: '/special-annual-general-meeting', permission: 'canViewSpecialAnnualGeneralMeeting' },
  { name: 'Board of Directors', path: '/board-of-directors', permission: 'canViewBoardOfDirectors' },
  { name: 'Auditors', path: '/auditors', permission: 'canViewAuditor' },
  { name: 'My Society', path: MY_SOCIETY_ROUTE_PATH, permission: 'canViewSociety' },
  { name: 'Renewals', path: '/renewals', permission: 'open' },
  { name: 'Profile', path: '/profile', permission: 'open' },
  { name: 'Modules', path: MODULES_ROUTE_PATH, permission: 'canViewModules' },
];

/** Permission keys that require a role check (excludes "open"). */
export const ROUTE_PERMISSION_KEYS = [
  ...new Set(NAV_ROUTE_PERMISSIONS.map((r) => r.permission).filter((p) => p !== 'open')),
] as const;

export type RoutePermissionKey = (typeof ROUTE_PERMISSION_KEYS)[number];

/** Open routes – no permission required (e.g. Profile, Renewals). */
export const OPEN_ROUTE_PATHS = NAV_ROUTE_PERMISSIONS.filter((r) => r.permission === 'open').map(
  (r) => r.path
);

const pathToRoute = new Map<string, NavRoutePermission>(
  NAV_ROUTE_PERMISSIONS.map((r) => [r.path, r])
);

/**
 * Get the permission config for a frontend path.
 */
export function getPermissionForPath(path: string): NavRoutePermission | undefined {
  return pathToRoute.get(path);
}

/**
 * Get the permission key string for a path (e.g. "canViewDashboard" or "open").
 */
export function getPermissionKeyForPath(path: string): string | undefined {
  return pathToRoute.get(path)?.permission;
}

/**
 * Whether the route is an "open" route (no permission required).
 */
export function isOpenRoute(path: string): boolean {
  const key = pathToRoute.get(path)?.permission;
  return key === 'open';
}

/**
 * Get all routes that require a given permission key.
 */
export function getPathsByPermission(permission: string): string[] {
  return NAV_ROUTE_PERMISSIONS.filter((r) => r.permission === permission).map((r) => r.path);
}

/**
 * Filter nav items to only those allowed by the given set of permission keys.
 * Use after resolving user's permissions from role.
 */
export function filterRoutesByPermissions(userPermissions: Set<string>): NavRoutePermission[] {
  return NAV_ROUTE_PERMISSIONS.filter(
    (r) => r.permission === 'open' || userPermissions.has(r.permission)
  );
}

/**
 * Maps DB permission name (resource.action) to frontend route permission key(s).
 * Used to derive allowed routes from role.permissions on login.
 *
 * A single DB permission can unlock multiple frontend nav keys (e.g. `society.view`
 * unlocks both "My Society" and "Conversion Society" for applicants who only carry
 * the base society permission).
 */
const DB_PERMISSION_NAME_TO_FRONTEND_KEY: Record<string, string | string[]> = {
  'dashboard.view': 'canViewDashboard',
  'user.view': 'canViewUser',
  'registration.view': 'canViewSocieties',
  'societies.view': 'canViewSocieties',
  'society.view': ['canViewSociety', 'canViewConversionSociety'],
  'society-conversion.view': 'canViewConversionSociety',
  'annual-return.view': 'canViewAnnualReturn',
  'amendment.view': 'canViewAmendment',
  'audit-request.view': 'canViewAuditRequest',
  'election-request.view': 'canViewElectionRequest',
  'liquidation.view': 'canViewLiquidation',
  'enquiry-request.view': 'canViewInquiryInspection',
  'inquiry-inspection.view': 'canViewInquiryInspection',
  'appeal.view': 'canViewAppeal',
  'annual-general-meeting.view': 'canViewAnnualGeneralMeeting',
  'special-general-meeting.view': 'canViewSpecialAnnualGeneralMeeting',
  'board-of-directors.view': 'canViewBoardOfDirectors',
  'auditor.view': 'canViewAuditor',
  'module.view': 'canViewModules',
  'modules.view': 'canViewModules',
};

/**
 * Convert role permissions (from DB) to frontend permission keys.
 * Use with filterRoutesByPermissions to get allowed nav routes for login.
 */
export function getFrontendPermissionKeysFromRolePermissions(
  permissions: Array<{ name: string }>
): Set<string> {
  const keys = new Set<string>();
  keys.add('open'); // open routes (Profile, Renewals) always allowed
  for (const p of permissions || []) {
    const frontendKey = DB_PERMISSION_NAME_TO_FRONTEND_KEY[p.name];
    if (!frontendKey) continue;
    if (Array.isArray(frontendKey)) {
      for (const k of frontendKey) keys.add(k);
    } else {
      keys.add(frontendKey);
    }
  }
  return keys;
}

/**
 * Get allowed nav routes for login response from role permissions.
 * Returns array of { name, path, permission } (no icons).
 */
export function getAllowedRoutesForLogin(
  permissions: Array<{ name: string }>
): NavRoutePermission[] {
  const userKeys = getFrontendPermissionKeysFromRolePermissions(permissions);
  return filterRoutesByPermissions(userKeys);
}

/** Role name that gets full nav (including Users). */
export const ADMIN_ROLE_NAME = 'admin';

/** Role name that gets nav only from its permissions. */
export const APPLICANT_ROLE_NAME = 'applicant';

/**
 * Get allowed nav by role:
 * - admin → full nav except My Society (sabhi routes including Users, Modules, but NOT My Society)
 * - applicant → nav from role permissions only (includes My Society if has society.view)
 * - all other roles → full nav except Users, Modules, and My Society
 */
export function getAllowedRoutesForRole(
  roleName: string,
  permissions: Array<{ name: string }>
): NavRoutePermission[] {
  if (roleName === ADMIN_ROLE_NAME) {
    // Admin: all routes except My Society (applicant-only)
    return NAV_ROUTE_PERMISSIONS.filter((r) => !APPLICANT_ONLY_ROUTE_PATHS.includes(r.path));
  }
  if (roleName === APPLICANT_ROLE_NAME) {
    return getAllowedRoutesForLogin(permissions);
  }
  // Others: all routes except Users, Modules (admin-only) and My Society (applicant-only)
  return NAV_ROUTE_PERMISSIONS.filter(
    (r) => !ADMIN_ONLY_ROUTE_PATHS.includes(r.path) && !APPLICANT_ONLY_ROUTE_PATHS.includes(r.path)
  );
}
