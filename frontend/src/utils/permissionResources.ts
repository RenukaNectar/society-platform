/**
 * Maps sidebar module keys to permission.resource values stored in the DB.
 * Seeders use mixed naming (e.g. audit-request vs audit); sidebar uses short keys.
 */
export const MODULE_RESOURCE_ALIASES: Record<string, string[]> = {
  dashboard: ["dashboard"],
  users: ["users", "user"],
  societies: ["societies", "society", "registration"],
  renewals: ["renewals", "society-renewal", "renewal"],
  conversion: ["conversion", "society-conversion"],
  "annual-filing": ["annual-filing", "annual-return"],
  amendment: ["amendment"],
  audit: ["audit", "audit-request"],
  election: ["election", "election-request"],
  liquidation: ["liquidation"],
  inspection: ["inspection", "inquiry-inspection", "enquiry-request"],
  appeal: ["appeal"],
  agm: ["agm", "annual-general-meeting"],
  sgbm: ["sgbm", "special-general-meeting"],
  bod: ["bod", "board-of-directors"],
  auditors: ["auditors", "auditor"],
  "my-society": ["my-society", "society"],
  modules: ["modules", "module"],
};

export const normalizePermissionAction = (action: string): string => {
  const a = String(action || "").toLowerCase();
  if (a === "edit") return "update";
  if (a === "add") return "create";
  if (a === "read") return "view";
  return a;
};

export const resolveResourceAliases = (module: string): string[] => {
  const key = String(module || "").toLowerCase();
  return MODULE_RESOURCE_ALIASES[key] ?? [key];
};

export const permissionMatches = (
  permissions: Array<{ resource?: string; action?: string }>,
  module: string,
  action: string,
): boolean => {
  if (!Array.isArray(permissions) || permissions.length === 0) return false;

  const normalizedAction = normalizePermissionAction(action);
  const aliases = resolveResourceAliases(module);

  return permissions.some((p) => {
    const res = String(p?.resource || "").toLowerCase();
    const act = normalizePermissionAction(String(p?.action || ""));
    return aliases.includes(res) && act === normalizedAction;
  });
};

export const isAdminRole = (role?: string | null): boolean => {
  const r = String(role || "").toLowerCase();
  return r === "admin" || r === "system_admin" || r === "superadmin";
};
