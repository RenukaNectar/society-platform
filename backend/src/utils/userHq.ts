export const ROLES_ALWAYS_IS_HQ = ['jt_rcs_district', 'rcs_district'] as const;

/** Roles whose users are HQ-type but workflow steps stay is_hq: false — do not filter list by is_hq. */
export const ROLES_IGNORE_IS_HQ_IN_ROLE_QUERY = [
  ...ROLES_ALWAYS_IS_HQ,
  'jics_sics_liquidator',
  'jics_sics_auditor',
] as const;

export const ROLES_IGNORE_DISTRICT_IN_ROLE_QUERY = [
  'drcs_arcs_hq',
  'jics_sics_hq',
  'drcs_arcs_auditor',
  'jics_sics_auditor',
  'jics_sics_liquidator',
  'jt_rcs_district',
  'rcs_district',
  'inspecting_officer_hq',
] as const;

export const isAlwaysHqRole = (roleName?: string | null): boolean =>
  !!roleName && (ROLES_ALWAYS_IS_HQ as readonly string[]).includes(String(roleName).trim());

export const isIgnoreIsHqRoleForRoleQuery = (roleName?: string | null): boolean =>
  !!roleName &&
  (ROLES_IGNORE_IS_HQ_IN_ROLE_QUERY as readonly string[]).includes(String(roleName).trim());

export const isDistrictAgnosticRoleForRoleQuery = (roleName?: string | null): boolean =>
  !!roleName &&
  (ROLES_IGNORE_DISTRICT_IN_ROLE_QUERY as readonly string[]).includes(
    String(roleName).trim()
  );

/**
 * Skip is_hq only when the request asks exclusively for roles that ignore is_hq
 * (jt_rcs_district / rcs_district / liquidator / auditor).
 * Mixed queries (e.g. jt_rcs_district + drcs_arcs_district) still apply is_hq normally.
 */
export const shouldIgnoreIsHqForRoleQuery = (roleNames: string[]): boolean => {
  const normalized = roleNames.map((name) => String(name).trim()).filter(Boolean);
  if (normalized.length === 0) return false;
  return normalized.every((name) => isIgnoreIsHqRoleForRoleQuery(name));
};

/**
 * Skip district filter when the query asks exclusively for district-agnostic roles.
 * Mixed queries (e.g. drcs_arcs_hq + drcs_arcs_district) still apply district normally.
 */
export const shouldIgnoreDistrictForRoleQuery = (roleNames: string[]): boolean => {
  const normalized = roleNames.map((name) => String(name).trim()).filter(Boolean);
  if (normalized.length === 0) return false;
  return normalized.every((name) => isDistrictAgnosticRoleForRoleQuery(name));
};

/** Effective HQ flag: jt_rcs_district / rcs_district are always HQ regardless of users.is_hq. */
export const resolveUserIsHq = (
  user?: {
    is_hq?: boolean | number | null;
    role?: string | { name?: string | null } | null;
  } | null
): boolean => {
  if (!user) return false;

  const roleName =
    typeof user.role === 'string' ? user.role : user.role?.name ?? undefined;

  if (isAlwaysHqRole(roleName)) {
    return true;
  }

  return Boolean(user.is_hq);
};
