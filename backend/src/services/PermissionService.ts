import Permission from '../models/Permission';
import RolePermission from '../models/RolePermission';
import { findUserById } from './UserService';

/** Roles that skip DB permission checks (optional env: RBAC_BYPASS_ROLE_NAMES=system_admin,superAdmin) */
const BYPASS_ROLES = new Set(
  (process.env['RBAC_BYPASS_ROLE_NAMES'] || 'system_admin,superAdmin')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

/** Equivalent resource strings (middleware / frontend / seed naming). */
const RESOURCE_GROUPS: string[][] = [
  ['user', 'users'],
  ['society', 'societies', 'registration'],
  ['annual-return', 'annual-filing'],
  ['audit-request', 'audit'],
  ['election-request', 'election'],
  ['enquiry-request', 'inspection', 'inquiry-inspection', 'inquiry'],
  ['liquidation'],
  ['appeal'],
  ['amendment'],
  ['conversion', 'society-conversion'],
  ['dashboard'],
  ['settings', 'setting'],
  ['hearing'],
  ['role', 'roles'],
  ['permission', 'permissions'],
  ['module', 'modules'],
  ['profile'],
  ['my-society'],
  ['agm', 'annual-general-meeting'],
  ['sgbm', 'special-annual-general-meeting'],
  ['bod', 'board-of-directors'],
  ['auditors'],
  ['renewals', 'renewal'],
];

export function expandResourceAliases(resource: string): string[] {
  const r = resource.toLowerCase().trim();
  for (const group of RESOURCE_GROUPS) {
    if (group.includes(r)) {
      return [...new Set(group)];
    }
  }
  return [r];
}

/** Align with frontend usePermissions: edit↔update, add↔create, read↔view */
export function normalizeActionVariants(action: string): string[] {
  const a = action.toLowerCase().trim();
  const s = new Set<string>([a]);
  if (a === 'edit' || a === 'update') {
    s.add('edit');
    s.add('update');
  }
  if (a === 'create' || a === 'add') {
    s.add('create');
    s.add('add');
  }
  if (a === 'view' || a === 'read') {
    s.add('view');
    s.add('read');
  }
  return [...s];
}

function permissionMatches(
  granted: Array<{ resource: string; action: string }>,
  resource: string,
  action: string
): boolean {
  const resAliases = expandResourceAliases(resource);
  const actVariants = normalizeActionVariants(action);
  return granted.some(
    (p) =>
      resAliases.includes(p.resource.toLowerCase()) &&
      actVariants.includes(p.action.toLowerCase())
  );
}

export async function fetchPermissionsForRole(
  roleId: string
): Promise<Array<{ resource: string; action: string }>> {
  const rows = await RolePermission.findAll({
    where: { role_id: roleId },
    include: [
      {
        model: Permission,
        as: 'permission',
        where: { is_active: true },
        required: true,
      },
    ],
  });

  const out: Array<{ resource: string; action: string }> = [];
  for (const rp of rows) {
    const perm = (rp as any).permission as Permission | undefined;
    if (perm?.resource && perm?.action) {
      out.push({ resource: String(perm.resource), action: String(perm.action) });
    }
  }
  return out;
}

export async function userHasPermission(
  user: { role_id?: string | null; role?: { name?: string } | null; is_active?: boolean },
  resource: string,
  action: string
): Promise<boolean> {
  if (!user.role_id) return false;
  const roleName = user.role?.name;
  if (roleName && BYPASS_ROLES.has(roleName)) return true;

  const tuples = await fetchPermissionsForRole(user.role_id);
  return permissionMatches(tuples, resource, action);
}

/** Returns true if the user has the given permission (DB role_permissions + permissions). */
export async function checkPermission(
  resource: string,
  action: string,
  userId: string
): Promise<boolean> {
  const user = await findUserById(userId);
  if (!user || !user.is_active) return false;
  return userHasPermission(user as any, resource, action);
}
