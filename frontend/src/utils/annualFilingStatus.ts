import { formatStatusTitleForDisplay } from './userFacingWorkflowCopy';

export const getAnnualFilingStatusKey = (filing: any) =>
  filing?.statusDetails?.key ||
  filing?.status?.key ||
  filing?.workflowStatus?.currentStatus?.key ||
  filing?.workflowStatus?.current?.approvalStatus?.key ||
  '';

export const getAnnualFilingStatusTitle = (filing: any) =>
  filing?.statusDetails?.title ||
  filing?.status?.title ||
  filing?.workflowStatus?.currentStatus?.title ||
  filing?.workflowStatus?.current?.approvalStatus?.title ||
  filing?.workflowStatus?.current?.approvalStatus?.name ||
  (typeof filing?.status === 'string' ? filing.status : '') ||
  '';

const RETURNED_STATUS_KEYS = new Set(['rejected', 'reverted']);

const formatWorkflowRole = (role?: string | null) => {
  if (!role) return null;
  const normalized = String(role).replace(/_/g, ' ').trim();
  if (!normalized || normalized.toLowerCase() === 'applicant') return null;
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

/** Role that now holds the filing. workflow_status is that step after a forward or return. */
const getCurrentHolderRole = (filing: any) =>
  filing?.workflowStatus?.current?.allowedRole?.description ||
  filing?.workflowStatus?.current?.allowedRole?.name ||
  filing?.workflowStatus?.assignedToRole?.description ||
  filing?.workflowStatus?.assignedToRole?.name ||
  null;

/** Role that performed the latest return. Current step is who received the file. */
const getReturningActorRole = (filing: any) => {
  const history = Array.isArray(filing?.history) ? filing.history : [];
  const returnedEntry = history.find((entry: any) => {
    const type = String(entry?.type || '').toLowerCase();
    return type === 'rejection' || type === 'back' || type === 'return';
  });
  const historyRole =
    returnedEntry?.createdByUser?.role?.description ||
    returnedEntry?.createdByUser?.role?.name;
  if (historyRole) return historyRole;

  return (
    filing?.statusChangedByUser?.role?.description ||
    filing?.statusChangedByUser?.role?.name ||
    null
  );
};

export const getAnnualFilingStatusLabel = (filing: any) => {
  const displayTitle = formatStatusTitleForDisplay(getAnnualFilingStatusTitle(filing));
  const statusKey = String(getAnnualFilingStatusKey(filing) || '').toLowerCase();
  const role = formatWorkflowRole(
    RETURNED_STATUS_KEYS.has(statusKey)
      ? getReturningActorRole(filing) || getCurrentHolderRole(filing)
      : getCurrentHolderRole(filing),
  );
  if (!role) return displayTitle;
  if (RETURNED_STATUS_KEYS.has(statusKey)) return `${role} Return`;
  return displayTitle;
};
