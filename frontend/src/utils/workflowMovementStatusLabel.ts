import { formatStatusTitleForDisplay } from "./userFacingWorkflowCopy";

type RoleLike = { description?: string | null; name?: string | null } | null | undefined;

const FORWARD_STATUS_KEYS = new Set(["forwarded", "submitted", "resubmitted"]);
const RETURN_STATUS_KEYS = new Set(["rejected", "reverted", "resubmit", "returned"]);

const formatRoleLabel = (role?: RoleLike): string | null => {
  const raw = String(role?.description || role?.name || "").trim();
  if (!raw) return null;
  if (raw.includes("_")) {
    return raw.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return raw;
};

const labelsFromRoles = (roles: RoleLike[]): string | null => {
  const labels = [...new Set(roles.map(formatRoleLabel).filter(Boolean) as string[])];
  return labels.length ? labels.join(" / ") : null;
};

/** Allowed role(s) on a workflow step, e.g. "DRCS/ARCS District". */
const stepRoleLabel = (step: any): string | null => {
  if (!step) return null;
  const roles: RoleLike[] = Array.isArray(step.allowedRoles) && step.allowedRoles.length
    ? step.allowedRoles
    : step.allowedRole
      ? [step.allowedRole]
      : [];
  return labelsFromRoles(roles);
};

/** Role the current step assigns the file to, when that differs from the allowed role. */
const stepAssignedRoleLabel = (step: any): string | null => {
  if (!step) return null;
  const roles: RoleLike[] = Array.isArray(step.assignedToRoles) && step.assignedToRoles.length
    ? step.assignedToRoles
    : step.assignedToRole
      ? [step.assignedToRole]
      : [];
  return labelsFromRoles(roles);
};

const historyActorRoles = (record: any, types: string[]): string[] => {
  const history = Array.isArray(record?.history) ? record.history : [];
  return history
    .filter((item: any) => types.includes(String(item?.type || "").toLowerCase()))
    .map((item: any) => formatRoleLabel(item?.createdByUser?.role))
    .filter((role: string | null): role is string => !!role);
};

const readStatusKey = (record: any, workflowStatus: any, override?: string | null) =>
  String(
    override ??
      record?.statusDetails?.key ??
      record?.status?.key ??
      record?.statusObj?.key ??
      record?.appealStatus?.key ??
      record?.statusInfo?.key ??
      workflowStatus?.currentStatus?.key ??
      "",
  )
    .trim()
    .toLowerCase();

const readStatusTitle = (record: any, workflowStatus: any, statusKey: string, override?: string | null) => {
  const raw =
    override ??
    record?.statusDetails?.title ??
    record?.status?.title ??
    record?.statusObj?.title ??
    record?.appealStatus?.title ??
    record?.statusInfo?.title ??
    workflowStatus?.currentStatus?.title ??
    statusKey;
  return formatStatusTitleForDisplay(raw) || String(raw || "");
};

/**
 * Details-page status label.
 * Forwarded: the current step sends the file onward — "JT RCS forwarded to RCS".
 * Returned: the next step sent it back — "JT RCS returned to DRCS/ARCS HQ".
 * The first officer step, just after the applicant submits, shows "Submitted".
 * Other states show only the status title.
 */
export const getWorkflowMovementStatusLabel = (
  record: any,
  options?: {
    statusKey?: string | null;
    statusTitle?: string | null;
    workflowStatus?: any;
  },
): string => {
  const workflowStatus = options?.workflowStatus ?? record?.workflowStatus;
  const statusKey = readStatusKey(record, workflowStatus, options?.statusKey);
  const statusTitle = readStatusTitle(record, workflowStatus, statusKey, options?.statusTitle);
  if (!statusTitle) return "";

  const currentRole = stepRoleLabel(workflowStatus?.current);
  const previousRole = stepRoleLabel(workflowStatus?.previous);
  const nextRole = stepRoleLabel(workflowStatus?.next);
  const isForward = FORWARD_STATUS_KEYS.has(statusKey);
  const isReturn = RETURN_STATUS_KEYS.has(statusKey);

  if (!isForward && !isReturn) return statusTitle;

  const sameRole = (left?: string | null, right?: string | null) =>
    !!left && !!right && left.toLowerCase() === right.toLowerCase();

  const otherThanCurrent = (role?: string | null) =>
    role && !sameRole(role, currentRole) ? role : null;

  const isApplicantRole = (role?: string | null) =>
    !!role && role.trim().toLowerCase() === "applicant";

  const stepIsApplicant = (step: any, roleLabel?: string | null) => {
    const roleName = String(
      step?.allowedRole?.name || step?.allowedRoles?.[0]?.name || "",
    ).toLowerCase();
    return isApplicantRole(roleLabel) || roleName === "applicant";
  };

  const previousStepIsApplicant = stepIsApplicant(workflowStatus?.previous, previousRole);
  const currentStepIsApplicant = stepIsApplicant(workflowStatus?.current, currentRole);

  // A file the applicant just submitted is "Submitted". Never "Applicant forwarded to …"
  // and never "DRCS/ARCS District: Forwarded" on that first officer step.
  const roleWithStatus = (role?: string | null) =>
    role && !isApplicantRole(role) ? `${role}: ${statusTitle}` : statusTitle;
  const submittedLabel = () => {
    if (statusKey === "resubmitted") return statusTitle || "Resubmitted";
    return (
      formatStatusTitleForDisplay(
        workflowStatus?.previous?.approvalStatus?.title ||
          workflowStatus?.previous?.approvalStatus?.key ||
          workflowStatus?.current?.approvalStatus?.title ||
          workflowStatus?.current?.approvalStatus?.key ||
          "Submitted",
      ) || "Submitted"
    );
  };

  if (isForward) {
    if (previousStepIsApplicant || currentStepIsApplicant) return submittedLabel();
    const forwardedTo =
      otherThanCurrent(nextRole) ||
      otherThanCurrent(stepAssignedRoleLabel(workflowStatus?.current));
    if (currentRole && forwardedTo && !isApplicantRole(currentRole)) {
      return `${currentRole} forwarded to ${forwardedTo}`;
    }
    return roleWithStatus(currentRole);
  }

  const assignedHolderRole = formatRoleLabel(workflowStatus?.assignedUser?.role);

  // After a return the file sits with the assigned officer. That role can differ
  // from the workflow step (for example DRCS/ARCS District holds it while the
  // step role is still JICS/SICS District).
  const returnedByActor = historyActorRoles(record, ["rejection", "back", "return"])[0] || null;
  const returnedBy =
    (returnedByActor &&
    otherThanCurrent(returnedByActor) &&
    !sameRole(returnedByActor, nextRole)
      ? returnedByActor
      : null) || otherThanCurrent(nextRole);
  const returnedTo =
    (assignedHolderRole &&
    !isApplicantRole(assignedHolderRole) &&
    !sameRole(assignedHolderRole, returnedBy)
      ? assignedHolderRole
      : null) || currentRole;
  if (isApplicantRole(returnedBy) || (previousStepIsApplicant && !returnedBy)) {
    return roleWithStatus(returnedTo);
  }
  // A return to the applicant is only "Returned". The badge never names Applicant.
  if (
    currentStepIsApplicant ||
    isApplicantRole(returnedBy) ||
    isApplicantRole(returnedTo)
  ) {
    return statusTitle;
  }
  if (returnedBy && returnedTo && !sameRole(returnedBy, returnedTo)) {
    return `${returnedBy} returned to ${returnedTo}`;
  }
  return roleWithStatus(returnedTo);
};
