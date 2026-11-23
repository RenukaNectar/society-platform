import { useEffect, useMemo, useState } from "react";
import { getUserAvailability } from "../lib/data/users/availability";
import {
  canReassignApplication,
  formatAssigneeName,
  getReassignRoleName,
  isOriginalAssigner,
  isTerminalReassignStatus,
  isUserExplicitlyUnavailable,
  resolveEffectiveAssignedToUserId,
  resolveEffectivePendingReassign,
} from "../utils/workflowReassign";

export function useAssigneeAvailability(params: {
  workflowStatus: any;
  entity: {
    assigned_to_user_id?: string | null;
    status_changed_by?: string | null;
  } | null;
  currentUserId?: string;
}) {
  const { workflowStatus, entity, currentUserId } = params;
  const [assigneeIsAvailable, setAssigneeIsAvailable] = useState<boolean | null>(
    null
  );

  const unavailableAssignee = workflowStatus?.unavailableAssignee ?? null;
  const pendingReassign = resolveEffectivePendingReassign(workflowStatus);
  const assignedToUserId = resolveEffectiveAssignedToUserId(workflowStatus, entity);

  const assignedUser =
    pendingReassign
      ? unavailableAssignee
      : assignedToUserId &&
          unavailableAssignee?.id &&
          String(unavailableAssignee.id) === String(assignedToUserId)
        ? unavailableAssignee
        : workflowStatus?.assignedUser ?? null;
  const statusChangedBy = entity?.status_changed_by ?? null;

  const originalAssigner = useMemo(
    () => isOriginalAssigner({ currentUserId, statusChangedBy }),
    [currentUserId, statusChangedBy]
  );

  const isReturnedToAssigner = useMemo(
    () =>
      Boolean(
        originalAssigner &&
          currentUserId &&
          assignedToUserId &&
          String(assignedToUserId) === String(currentUserId)
      ),
    [originalAssigner, currentUserId, assignedToUserId]
  );

  useEffect(() => {
    if (pendingReassign && unavailableAssignee) {
      setAssigneeIsAvailable(!isUserExplicitlyUnavailable(unavailableAssignee));
      return;
    }

    if (!assignedToUserId || isReturnedToAssigner) {
      setAssigneeIsAvailable(null);
      return;
    }

    const holder = workflowStatus?.assignedUser;
    if (holder?.is_available === false) {
      setAssigneeIsAvailable(false);
      return;
    }
    if (holder?.is_available === true) {
      setAssigneeIsAvailable(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const summary = await getUserAvailability(assignedToUserId);
        if (!cancelled) {
          setAssigneeIsAvailable(summary ? summary.is_available !== false : null);
        }
      } catch {
        if (!cancelled) setAssigneeIsAvailable(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    assignedToUserId,
    workflowStatus?.assignedUser?.is_available,
    pendingReassign,
    unavailableAssignee,
    isReturnedToAssigner,
  ]);

  const hasActiveWorkflowStep = Boolean(
    workflowStatus?.current ??
      workflowStatus?.currentWorkflow ??
      workflowStatus?.next,
  );
  const reassignClosed = isTerminalReassignStatus(workflowStatus, entity);

  const showReassign = useMemo(
    () =>
      (hasActiveWorkflowStep || pendingReassign) &&
      !reassignClosed &&
      canReassignApplication({
        currentUserId,
        statusChangedBy,
        assignedToUserId,
        assigneeIsAvailable,
        pendingReassign,
        isReturnedToAssigner,
      }),
    [
      hasActiveWorkflowStep,
      reassignClosed,
      currentUserId,
      statusChangedBy,
      assignedToUserId,
      assigneeIsAvailable,
      pendingReassign,
      isReturnedToAssigner,
    ]
  );

  const showUnavailableNotice = Boolean(
    !reassignClosed &&
      originalAssigner &&
      (pendingReassign || (assignedToUserId && assigneeIsAvailable === false)),
  );

  const reassignRoleName = useMemo(() => {
    if (pendingReassign && unavailableAssignee?.role?.name) {
      return unavailableAssignee.role.name;
    }
    if (assigneeIsAvailable === false) {
      return (
        unavailableAssignee?.role?.name ||
        workflowStatus?.assignedUser?.role?.name ||
        getReassignRoleName(workflowStatus)
      );
    }
    return getReassignRoleName(workflowStatus);
  }, [
    pendingReassign,
    unavailableAssignee,
    assigneeIsAvailable,
    workflowStatus,
  ]);

  return {
    assignedUser,
    unavailableAssignee,
    assignedToUserId,
    statusChangedBy,
    originalAssigner,
    assigneeIsAvailable,
    pendingReassign,
    isReturnedToAssigner,
    showReassign,
    showUnavailableNotice,
    assigneeDisplayName: formatAssigneeName(
      pendingReassign ? unavailableAssignee : assignedUser
    ),
    reassignExcludeUserId: pendingReassign
      ? unavailableAssignee?.id
      : assignedToUserId,
    reassignRoleName,
  };
}
