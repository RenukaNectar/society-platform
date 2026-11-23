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

/** Forwarded and returned appeals show the officer role with the status. */
export const getAppealStatusLabel = (appeal: any) => {
  const statusKey = String(appeal?.appealStatus?.key || "").toLowerCase();
  const statusTitle =
    formatStatusTitleForDisplay(
      appeal?.appealStatus?.title || appeal?.appealStatus?.key || "",
    ) || "-";
  const workflowStatus = appeal?.workflowStatus;

  if (statusKey === "rejected" || statusKey === "reverted" || statusKey === "returned") {
    const role = formatWorkflowRole(
      roleDescription(workflowStatus?.next?.assignedToRole) ||
        roleDescription(workflowStatus?.next?.allowedRole) ||
        roleDescription(workflowStatus?.current?.allowedRole),
    );
    return role ? `${role}: ${statusTitle}` : statusTitle;
  }

  if (statusKey !== "forwarded") return statusTitle;

  const holderRole = formatWorkflowRole(
    roleDescription(workflowStatus?.current?.allowedRole) ||
      roleDescription(workflowStatus?.assignedToRole),
  );
  return holderRole ? `${holderRole}: ${statusTitle}` : statusTitle;
};
