import { formatStatusTitleForDisplay } from "./userFacingWorkflowCopy";

const formatWorkflowRole = (role?: string | null) => {
  if (!role) return null;
  const formatted = String(role)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  if (!formatted || formatted.toLowerCase() === "applicant") return null;
  return formatted;
};

const roleDescription = (role?: { description?: string; name?: string } | null) =>
  role?.description || role?.name || null;

/** Forwarded status shows only the role that now holds the file. */
export const getLiquidationStatusLabel = (liquidation: any) => {
  const statusKey = String(liquidation?.statusObj?.key || "").toLowerCase();
  const statusTitle = formatStatusTitleForDisplay(
    liquidation?.statusObj?.title || liquidation?.statusObj?.key || "",
  );
  const workflowStatus = liquidation?.workflowStatus;

  if (statusKey === "rejected" || statusKey === "reverted") {
    const role = formatWorkflowRole(
      roleDescription(workflowStatus?.next?.assignedToRole) ||
        roleDescription(workflowStatus?.next?.allowedRole),
    );
    return role ? `${role}: ${statusTitle}` : statusTitle;
  }

  if (statusKey !== "forwarded") return statusTitle;

  const nextRole = formatWorkflowRole(
    roleDescription(workflowStatus?.current?.allowedRole) ||
      roleDescription(workflowStatus?.next?.allowedRole),
  );
  return nextRole ? `${nextRole}: ${statusTitle}` : statusTitle;
};
