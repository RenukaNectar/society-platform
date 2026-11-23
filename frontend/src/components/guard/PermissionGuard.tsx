import { usePermissions } from "../../hooks/usePermissions";

export const PermissionGuard = ({
  children,
  permission,
  showAskPermission = false,
}: {
  children: React.ReactNode;
  permission: string;
  showAskPermission?: boolean;
}) => {
  const { permissions, user, isSuperAdmin, canPerformAction } = usePermissions();

  // special-case viewing routes which depend on role
  if (
    permission == "canViewSociety" ||
    permission == "canViewAnnualGeneralMeeting" ||
    permission == "canViewBoardOfDirectors" ||
    permission == "canViewSpecialAnnualGeneralMeeting" ||
    permission == "canViewAuditor" ||
    permission == "canViewConversionSociety" ||
    permission == "canViewModules"
  ) {
    if (permission === "canViewConversionSociety" || permission === "canViewModules") {
      const allowedRoles = [
        "admin",
        "registrar",
        "arcs",
        "field_inspector",
        "jics_jacs",
        "sics_sacs",
      ];
      return allowedRoles.includes(user?.role || "") ? <>{children}</> : <></>;
    }

    if (user?.role == "applicant" && permission != "canViewAuditor") {
      return <>{children}</>;
    } else if (user?.role == "admin" && permission == "canViewAuditor") {
      return <>{children}</>;
    } else {
      return <></>;
    }
  }

  if (permission == "open") return <>{children}</>;

  // Direct permission match
  if (permission && permissions?.[permission]) return <>{children}</>;

  // Support camelCase permission props like `canViewAnnualFiling` by parsing
  // them into action + resource and delegating to canPerformAction.
  const camelMatch = permission.match(/^can(View|Create|Update|Delete|Approve|Reject)(.+)$/);
  if (camelMatch) {
    const action = camelMatch[1].toLowerCase() as any;
    // Convert PascalCase resource to kebab-case resource used by backend (e.g., AnnualFiling -> annual-filing)
    const resourcePascal = camelMatch[2];
    const resourceKebab = resourcePascal
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
      .toLowerCase();

    if (canPerformAction(resourceKebab, action)) return <>{children}</>;
  }

  if (showAskPermission) {
    return (
      <div className="flex items-center justify-center h-full">
        <h2 className="text-2xl font-bold">You are not authorized to access this page</h2>
      </div>
    );
  }

  return <></>;
};
