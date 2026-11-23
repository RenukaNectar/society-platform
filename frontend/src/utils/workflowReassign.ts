const TERMINAL_REASSIGN_STATUS_KEYS = new Set(['rejected', 'approved', 'cancelled']);

/** Return / final approval closes the file. Reassign is not allowed after that. */
export function isTerminalReassignStatus(
  workflowStatus?: { currentStatus?: { key?: string | null } | null } | null,
  entity?: {
    appealStatus?: { key?: string | null } | null;
    statusObj?: { key?: string | null } | null;
    statusDetails?: { key?: string | null } | null;
    status?: { key?: string | null } | string | null;
  } | null,
): boolean {
  const entityStatus =
    entity?.status && typeof entity.status === 'object' ? entity.status.key : null;
  const key = String(
    workflowStatus?.currentStatus?.key ||
      entity?.appealStatus?.key ||
      entity?.statusObj?.key ||
      entity?.statusDetails?.key ||
      entityStatus ||
      '',
  )
    .trim()
    .toLowerCase();
  return TERMINAL_REASSIGN_STATUS_KEYS.has(key);
}

/** True when user payload explicitly marks them unavailable (on leave). */
export function isUserExplicitlyUnavailable(
  user?: { is_available?: boolean | null } | null,
): boolean {
  return user?.is_available === false;
}

/**
 * pendingReassign stays on while the officer who went on leave is still unavailable.
 * After that return, assignedUser is the original assigner (available). That must not
 * clear the flag. Clear it only when the officer on leave is available again.
 */
export function resolveEffectivePendingReassign(workflowStatus?: {
  pendingReassign?: boolean;
  unavailableAssignee?: { is_available?: boolean | null } | null;
  assignedUser?: { is_available?: boolean | null } | null;
} | null): boolean {
  if (!workflowStatus?.pendingReassign || !workflowStatus.unavailableAssignee) {
    return false;
  }
  if (workflowStatus.unavailableAssignee.is_available === true) {
    return false;
  }
  // API already flagged a return-on-unavailable. Keep reassign on until
  // the officer who went on leave is explicitly available again.
  return true;
}

/** Who holds the desk for workflow actions. */
export function resolveEffectiveAssignedToUserId(
  workflowStatus?: {
    assignedToUserId?: string | null;
    assignedUser?: { id?: string; is_available?: boolean | null } | null;
    pendingReassign?: boolean;
    unavailableAssignee?: { id?: string; is_available?: boolean | null } | null;
  } | null,
  entity?: {
    assigned_to_user_id?: string | null;
    status_changed_by?: string | null;
  } | null,
): string | null {
  const workflowAssigneeId =
    workflowStatus?.assignedToUserId ?? workflowStatus?.assignedUser?.id ?? null;
  const entityAssigneeId = entity?.assigned_to_user_id ?? null;
  const statusChangedBy = entity?.status_changed_by ?? null;
  const pendingReassign = resolveEffectivePendingReassign(workflowStatus);

  const returnedToAssignerInbox =
    entityAssigneeId &&
    statusChangedBy &&
    String(entityAssigneeId) === String(statusChangedBy) &&
    workflowAssigneeId &&
    String(entityAssigneeId) !== String(workflowAssigneeId);

  const restoredOfficerId = workflowStatus?.unavailableAssignee?.id
    ? String(workflowStatus.unavailableAssignee.id)
    : null;

  // Stale return: still on assigner inbox, but the officer who went on leave is available again
  if (
    (returnedToAssignerInbox || workflowStatus?.pendingReassign) &&
    !pendingReassign &&
    restoredOfficerId
  ) {
    return restoredOfficerId;
  }

  // Legit return to original forwarder (assignee unavailable / pending reassign active)
  if (returnedToAssignerInbox || (pendingReassign && entityAssigneeId)) {
    return String(entityAssigneeId);
  }

  const holder = workflowStatus?.assignedUser;
  if (holder?.is_available === true && workflowAssigneeId) {
    return String(workflowAssigneeId);
  }

  return entityAssigneeId ?? workflowAssigneeId ?? null;
}

/**
 * Whether the current user may reassign this application to another user.
 * Rules (must match backend):
 * - Caller is the original assigner (status_changed_by)
 * - Assignee is unavailable OR application was returned to assigner inbox (pendingReassign)
 */
export function canReassignApplication(params: {
  currentUserId?: string;
  statusChangedBy?: string | null;
  assignedToUserId?: string | null;
  assigneeIsAvailable?: boolean | null;
  pendingReassign?: boolean;
  isReturnedToAssigner?: boolean;
}): boolean {
  const {
    currentUserId,
    statusChangedBy,
    assignedToUserId,
    assigneeIsAvailable,
    pendingReassign,
    isReturnedToAssigner,
  } = params;

  if (!currentUserId) {
    return false;
  }

  const isAssigner =
    !!statusChangedBy && String(currentUserId) === String(statusChangedBy);
  const holdsReturnedDesk =
    !!assignedToUserId && String(assignedToUserId) === String(currentUserId);

  // File is back on the officer who forwarded it (typical after assignee
  // marked unavailable). Show Reassign even if pendingReassign was omitted.
  if (isAssigner && holdsReturnedDesk) {
    return true;
  }

  // File came back to the previous officer after assignee went on leave
  if (pendingReassign && (isAssigner || holdsReturnedDesk || isReturnedToAssigner)) {
    return true;
  }

  // Still on unavailable assignee's desk — only the original assigner can reassign
  if (isAssigner && assigneeIsAvailable === false) {
    return true;
  }

  return false;
}

export function isOriginalAssigner(params: {
  currentUserId?: string;
  statusChangedBy?: string | null;
}): boolean {
  const { currentUserId, statusChangedBy } = params;
  if (!currentUserId || !statusChangedBy) return false;
  return String(currentUserId) === String(statusChangedBy);
}

/** Role name for reassign user list — matches unavailable assignee's role, not workflow step. */
export function getReassignRoleName(workflowStatus?: {
  unavailableAssignee?: { role?: { name?: string } | null } | null;
  assignedUser?: { role?: { name?: string } | null } | null;
} | null): string | null {
  if (!workflowStatus) return null;
  const fromUnavailable = workflowStatus.unavailableAssignee?.role?.name;
  if (fromUnavailable) return fromUnavailable;
  return workflowStatus.assignedUser?.role?.name ?? null;
}

export function formatAssigneeName(user?: {
  first_name?: string;
  last_name?: string;
  email?: string;
  full_name?: string;
} | null): string {
  if (!user) return "—";
  if (user.full_name?.trim()) return user.full_name.trim();
  const name = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  return name || user.email || "—";
}
