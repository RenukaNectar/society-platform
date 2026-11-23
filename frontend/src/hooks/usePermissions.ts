import { useSelector } from "react-redux";
import { RootState } from "../store";
import {
  isAdminRole,
  permissionMatches,
  resolveResourceAliases,
} from "../utils/permissionResources";

type Permission = {
  resource: string;
  action: string;
};

export const usePermissions = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = useSelector(
    (state: RootState) => state.permissions.permissions
  ) as Permission[];

  const isAdmin = (): boolean => isAdminRole(user?.role);

  const canPerformAction = (
    resource: string,
    action: string
  ): boolean => {
    if (isAdmin()) return true;
    if (!Array.isArray(permissions)) return false;
    return permissionMatches(permissions, resource, action);
  };

  const canAccessModule = (module: string): boolean =>
    canPerformAction(module, "view");

  const getModulePermissions = (module: string): Permission[] => {
    if (!Array.isArray(permissions)) return [];
    const aliases = resolveResourceAliases(module);
    return permissions.filter((p) =>
      aliases.includes(String(p.resource || "").toLowerCase())
    );
  };

  const hasAnyPermission = (
    checks: { resource: string; action: string }[]
  ): boolean => {
    return checks.some((c) =>
      canPerformAction(c.resource, c.action)
    );
  };

  const hasAllPermissions = (
    checks: { resource: string; action: string }[]
  ): boolean => {
    return checks.every((c) =>
      canPerformAction(c.resource, c.action)
    );
  };

  const isSuperAdmin = (): boolean =>
    user?.role === "superAdmin" || user?.role === "system_admin";

  const getUserRole = (): string => user?.role || "";

  return {
    user,
    permissions,

    canPerformAction,
    canAccessModule,
    getModulePermissions,

    hasAnyPermission,
    hasAllPermissions,

    isSuperAdmin,
    isAdmin,
    getUserRole,
  };
};
