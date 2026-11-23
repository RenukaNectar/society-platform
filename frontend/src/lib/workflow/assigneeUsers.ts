import toast from 'react-hot-toast';
import {
  excludeUserFromAssignmentList,
  fetchUsersByRoleForAssignment,
} from '../data/users/api';
import { resolveEffectiveAssignedToUserId } from '../../utils/workflowReassign';

const HQ_ASSIGNMENT_ROLES = new Set([
  'jics_sics_hq',
  'drcs_arcs_hq',
  'jt_rcs_hq',
  'rcs_hq',
]);

const stepRoleNames = (step: any): string[] => {
  const names: string[] = [];
  const push = (role: any) => {
    const name = typeof role === 'string' ? role : role?.name;
    if (name) names.push(String(name).toLowerCase());
  };
  push(step?.allowedRole);
  (Array.isArray(step?.allowedRoles) ? step.allowedRoles : []).forEach(push);
  return names;
};

/**
 * True when a returned file is on the applicant step, or the workflow was cleared back to them.
 * An officer-to-officer return keeps the file on an officer step.
 */
export const isReturnedFileWithApplicant = (record: any): boolean => {
  const current = record?.workflowStatus?.current;
  if (current) return stepRoleNames(current).includes('applicant');
  const workflowId = record?.workflow_status ?? record?.workflowStatusId;
  return !workflowId;
};

export const getWorkflowActionStep = (workflowStatus: any) =>
  workflowStatus?.next ?? null;

/**
 * @deprecated Use getWorkflowActionStep — forward actions use `next`.
 */
export const getPendingWorkflowActionStep = (workflowStatus: any) =>
  workflowStatus?.next ?? null;

const normalizeWorkflowIdList = (value: unknown): string[] => {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((id) => String(id));
  }
  return [String(value)];
};

const buildStepRoleIdToNameMap = (step: any): Map<string, string> => {
  const catalog: { id?: string; name?: string }[] = [
    ...(step?.assignedToRoles || []),
    ...(step?.assigneeRoles || []),
    ...(step?.allowedRoles || []),
    ...(step?.rejectRoles || []),
  ];
  if (step?.assignedToRole) catalog.push(step.assignedToRole);
  if (step?.allowedRole) catalog.push(step.allowedRole);
  if (step?.rejectRole) catalog.push(step.rejectRole);

  const map = new Map<string, string>();
  catalog.forEach((role) => {
    if (role?.id && role?.name) {
      map.set(String(role.id), role.name);
    }
  });
  return map;
};

const mapSingleRoleId = (
  step: any,
  roleId: string,
  idToName: Map<string, string>,
): string | null => {
  const mapped = idToName.get(roleId);
  if (mapped) return mapped;
  if (
    step?.assignedToRole?.id &&
    String(step.assignedToRole.id) === String(roleId)
  ) {
    return step.assignedToRole.name ?? null;
  }
  return null;
};

const mapRoleIdsToNames = (
  step: any,
  roleIds: string[],
  idToName: Map<string, string>,
): string[] => {
  const roleNames: string[] = [];
  const addRole = (name?: string | null) => {
    if (name && !roleNames.includes(name)) roleNames.push(name);
  };
  roleIds.forEach((id) => addRole(mapSingleRoleId(step, id, idToName)));
  return roleNames;
};

/** Forward target role name(s) from `assigneeRoleIds` or `assigned_to` on the step. */
export const collectAssigneeRoleNamesFromStep = (step: any): string[] => {
  if (!step) return [];

  const idToName = buildStepRoleIdToNameMap(step);
  const assigneeRoleIds = normalizeWorkflowIdList(step?.assigneeRoleIds);
  const assignToIds = normalizeWorkflowIdList(step?.assigned_to);

  const sourceIds =
    assigneeRoleIds.length > 0
      ? assigneeRoleIds
      : assignToIds.length > 0
        ? assignToIds
        : [];

  if (sourceIds.length > 0) {
    const names = mapRoleIdsToNames(step, sourceIds, idToName);
    if (names.length) return names;
  }

  if (step?.assignedToRole?.name) return [step.assignedToRole.name];

  return [];
};

/** Forward target role name(s) from `next` only. */
export const getForwardAssigneeRoleNames = (workflowStatus: any): string[] => {
  const next = workflowStatus?.next;
  if (!next) return [];

  const fromNext = collectAssigneeRoleNamesFromStep(next);
  if (fromNext.length) return fromNext;

  // Fallback: root assigneeRoleIds describe the current holder, not the forward
  // target — only use when the next step has no assignee metadata.
  const rootAssigneeIds = normalizeWorkflowIdList(workflowStatus?.assigneeRoleIds);
  if (!rootAssigneeIds.length) return [];

  const idToName = buildStepRoleIdToNameMap({
    ...next,
    assignedToRoles: [
      ...(next.assignedToRoles || []),
      ...(workflowStatus?.assigneeRoles || []),
    ],
  });
  return mapRoleIdsToNames(next, rootAssigneeIds, idToName);
};

/** @deprecated Use getForwardAssigneeRoleNames — returns first role only. */
export const getForwardAssigneeRoleName = (workflowStatus: any): string | null =>
  getForwardAssigneeRoleNames(workflowStatus)[0] ?? null;

export const collectForwardAssigneeRoleNames = (workflowStatus: any): string[] =>
  getForwardAssigneeRoleNames(workflowStatus);

/**
 * Forward picker is_hq (default for registration, liquidation, renewal, etc.):
 * - 2+ role names → is_hq=1
 * - 1 HQ role name → is_hq=1
 * - 1 district role → omit is_hq
 */
const FORWARD_BYPASS_ROLE_NAMES = new Set([
  "drcs_arcs_district",
  "jics_sics_hq",
  "drcs_arcs_hq",
]);

const REVERSE_BYPASS_ROLE_NAMES = new Set([
  "rcs_district",
  "rcs_hq",
  "jt_rcs_district",
  "jt_rcs_hq",
  "drcs_arcs_hq",
]);

/** Skip is only offered to the officer roles that are allowed to bypass that direction. */
export const canCurrentUserBypassWorkflow = (
  roleName: string | null | undefined,
  direction: "forward" | "reverse",
) => {
  const name = String(roleName || "").trim().toLowerCase();
  if (!name) return false;
  const allowed =
    direction === "forward" ? FORWARD_BYPASS_ROLE_NAMES : REVERSE_BYPASS_ROLE_NAMES;
  return allowed.has(name);
};

export const workflowStepRoleLabel = (step: any): string => {
  const roles = [
    ...(Array.isArray(step?.allowedRoles) ? step.allowedRoles : []),
    ...(step?.allowedRole ? [step.allowedRole] : []),
  ];
  const labels: string[] = [];
  roles.forEach((role) => {
    const label = role?.description || role?.name;
    if (label && !labels.includes(label)) labels.push(label);
  });
  return labels.join(" / ");
};

/** Users who can act on a bypass landing step (its allowed role, not its later forward target). */
export const loadUsersForWorkflowStep = async (
  step: any,
  currentUserId?: string | null,
): Promise<any[]> => {
  const names = (Array.isArray(step?.allowedRoles) ? step.allowedRoles : [])
    .map((role: { name?: string }) => role?.name)
    .filter(Boolean) as string[];
  if (!names.length && step?.allowedRole?.name) {
    names.push(step.allowedRole.name);
  }
  if (!names.length) return [];
  return fetchUsersByRoleForAssignment(
    names.length === 1 ? names[0] : names,
    resolveForwardAssignmentIsHq(names),
    currentUserId,
  );
};

export const resolveForwardAssignmentIsHq = (
  roleNames: string | string[],
): boolean | undefined => {
  const names = (Array.isArray(roleNames) ? roleNames : [roleNames]).filter(
    Boolean,
  );
  if (names.length > 1) return true;
  if (names.length === 1 && HQ_ASSIGNMENT_ROLES.has(names[0])) return true;
  return undefined;
};

/** Inspection-only: district IO pool must not send is_hq=1; other pools use default rule. */
const resolveInspectionForwardAssignmentIsHq = (
  roleNames: string | string[],
): boolean | undefined => {
  const names = (Array.isArray(roleNames) ? roleNames : [roleNames]).filter(
    Boolean,
  );
  const districtOnly =
    names.length > 0 &&
    names.every((name) => !HQ_ASSIGNMENT_ROLES.has(name));
  if (districtOnly) return undefined;
  return resolveForwardAssignmentIsHq(roleNames);
};

export const resolveAssignmentIsHq = (
  roleNames: string | string[],
  stepIsHq?: boolean,
  userIsHq?: boolean,
) => {
  const names = Array.isArray(roleNames) ? roleNames : [roleNames];
  return (
    Boolean(stepIsHq) ||
    names.some((name) => HQ_ASSIGNMENT_ROLES.has(name)) ||
    Boolean(userIsHq)
  );
};

export const isApplicantWorkflowRole = (userRoleName?: string | null) =>
  String(userRoleName || '').toLowerCase() === 'applicant';

export const canActOnWorkflowStep = (
  step: any,
  userRoleId?: string,
  userRoleName?: string,
) => {
  if (!step) return false;
  const allowedIds =
    step.allowedRoleIds || (step.allowedRole?.id ? [step.allowedRole.id] : []);
  const allowedNames = (step.allowedRoles || [])
    .map((role: { name?: string }) => role?.name)
    .filter(Boolean);
  if (step.allowedRole?.name && !allowedNames.includes(step.allowedRole.name)) {
    allowedNames.push(step.allowedRole.name);
  }
  if (userRoleId && allowedIds.includes(userRoleId)) return true;
  if (userRoleName && allowedNames.includes(userRoleName)) return true;
  return false;
};

const addReturnRolesFromStep = (
  step: any,
  addRole: (name?: string) => void,
  source: 'holder' | 'reject',
) => {
  if (!step) return;
  if (source === 'reject') {
    const rejectIds = normalizeWorkflowIdList(step?.reject_role_id);
    const idToName = buildStepRoleIdToNameMap(step);
    if (rejectIds.length === 1) {
      addRole(idToName.get(rejectIds[0]) ?? step?.rejectRole?.name);
    } else if (rejectIds.length > 1) {
      addRole(step?.rejectRole?.name ?? idToName.get(rejectIds[0]));
    } else {
      addRole(step?.rejectRole?.name);
    }
    return;
  }

  const allowedIds = normalizeWorkflowIdList(step?.allowed_role_id);
  const idToName = buildStepRoleIdToNameMap(step);
  if (allowedIds.length === 1) {
    const name = idToName.get(allowedIds[0]);
    if (name) addRole(name);
    return;
  }
  if (allowedIds.length > 1) {
    addRole(step?.allowedRole?.name ?? idToName.get(allowedIds[0]));
    return;
  }
  addRole(step?.allowedRole?.name);
};

/** Whether the acting officer is on `next` (not `current`) for this workflow state. */
export const isActingOnNextWorkflowStep = (
  workflowStatus: any,
  userRoleId?: string,
  userRoleName?: string,
) => {
  if (!userRoleId && !userRoleName) return false;
  const onNext = canActOnWorkflowStep(
    workflowStatus?.next,
    userRoleId,
    userRoleName,
  );
  const onCurrent = canActOnWorkflowStep(
    workflowStatus?.current,
    userRoleId,
    userRoleName,
  );
  return onNext && !onCurrent;
};

/**
 * Step the logged-in officer is completing.
 * After a forward, `current` is their step and `next` is the following officer
 * (e.g. JT RCS current + RCS next). Using `next` for the button label would
 * show APPROVE on JT RCS because RCS's status is `approved`.
 */
export const getActingWorkflowStep = (
  workflowStatus: any,
  userRoleId?: string,
  userRoleName?: string,
) => {
  if (isActingOnNextWorkflowStep(workflowStatus, userRoleId, userRoleName)) {
    return workflowStatus?.next ?? null;
  }
  if (canActOnWorkflowStep(workflowStatus?.current, userRoleId, userRoleName)) {
    return workflowStatus?.current ?? null;
  }
  // Prefer current when the file is already on this step; `next` is the
  // following officer (RCS) and must not drive JT RCS button labels.
  return workflowStatus?.current ?? workflowStatus?.next ?? null;
};

export const isWorkflowFinalApprovalStep = (
  workflowStatus: any,
  userRoleId?: string,
  userRoleName?: string,
) => {
  const key = String(
    getActingWorkflowStep(workflowStatus, userRoleId, userRoleName)?.approvalStatus
      ?.key || '',
  )
    .trim()
    .toLowerCase();
  return key === 'approved' || key === 'certificate_issued';
};

/** Step whose `is_hq` applies when loading RETURN assignee users — always `previous`. */
export const getRejectTargetStep = (
  workflowStatus: any,
  _userRoleId?: string,
  _userRoleName?: string,
) => workflowStatus?.previous ?? null;

/** Step that defines whether RETURN requires picking a user. */
export const getRejectActionStep = (
  workflowStatus: any,
  userRoleId?: string,
  userRoleName?: string,
) => {
  const actingOnNext = isActingOnNextWorkflowStep(
    workflowStatus,
    userRoleId,
    userRoleName,
  );
  return actingOnNext
    ? workflowStatus?.next ?? null
    : workflowStatus?.current ?? null;
};

const collectRejectRoleNameFromStep = (step: any): string | null => {
  if (!step) return null;
  const rejectIds = normalizeWorkflowIdList(step?.reject_role_id);
  const idToName = buildStepRoleIdToNameMap(step);
  if (rejectIds.length === 1) {
    return idToName.get(rejectIds[0]) ?? step?.rejectRole?.name ?? null;
  }
  if (rejectIds.length > 1) {
    return step?.rejectRole?.name ?? idToName.get(rejectIds[0]) ?? null;
  }
  return step?.rejectRole?.name ?? null;
};

/** Single return/reject target role from the acting workflow step. */
export const getRejectAssigneeRoleName = (
  workflowStatus: any,
  userRoleId?: string,
  userRoleName?: string,
): string | null => {
  const actionStep = getRejectActionStep(
    workflowStatus,
    userRoleId,
    userRoleName,
  );
  const fromActionStep = collectRejectRoleNameFromStep(actionStep);
  if (fromActionStep) return fromActionStep;
  const legacy = collectRejectAssigneeRoleNames(
    workflowStatus,
    userRoleId,
    userRoleName,
  );
  return legacy[0] ?? null;
};

export const collectRejectAssigneeRoleNames = (
  workflowStatus: any,
  userRoleId?: string,
  userRoleName?: string,
): string[] => {
  const roleNames: string[] = [];
  const addRole = (name?: string) => {
    if (name && !roleNames.includes(name)) roleNames.push(name);
  };

  const previous = workflowStatus?.previous;
  const current = workflowStatus?.current;
  const next = workflowStatus?.next;
  const actingOnNext = isActingOnNextWorkflowStep(
    workflowStatus,
    userRoleId,
    userRoleName,
  );

  if (actingOnNext) {
    // Officer on next step → return to current step holder (or next.rejectRole)
    addReturnRolesFromStep(next, addRole, 'reject');
    if (!roleNames.length) addReturnRolesFromStep(current, addRole, 'holder');
  } else {
    // Officer on current step → return to previous step holder
    addReturnRolesFromStep(previous, addRole, 'holder');
    if (!roleNames.length) addReturnRolesFromStep(current, addRole, 'reject');
  }

  if (!roleNames.length) {
    addReturnRolesFromStep(next, addRole, 'reject');
  }

  return roleNames;
};

const canActOnAssignedToRoles = (
  step: any,
  userRoleId?: string,
  userRoleName?: string,
) => {
  const roles: { id?: string; name?: string }[] = step?.assignedToRoles || [];
  if (step?.assignedToRole) roles.push(step.assignedToRole);

  const allowedIds = roles.map((r) => r?.id).filter(Boolean);
  const allowedNames = roles.map((r) => r?.name).filter(Boolean);

  if (userRoleId && allowedIds.includes(userRoleId)) return true;
  if (userRoleName && allowedNames.includes(userRoleName)) return true;
  return false;
};

export const canShowWorkflowActions = (
  entity: { assigned_to_user_id?: string | null } | null | undefined,
  workflowStatus: any,
  currentUserId?: string | null,
  userRoleId?: string,
  userRoleName?: string,
) => {
  if (isApplicantWorkflowRole(userRoleName)) {
    return false;
  }
  const effectiveAssignedToUserId = resolveEffectiveAssignedToUserId(
    workflowStatus,
    entity,
  );
  if (effectiveAssignedToUserId) {
    return String(effectiveAssignedToUserId) === String(currentUserId);
  }

  // No single assignee: the officer who can act is the current step's allowed
  // role (for example RCS on Auditor Appointed). assigned_to is who they
  // forward to, not who may act now.
  if (canActOnWorkflowStep(workflowStatus?.current, userRoleId, userRoleName)) {
    return true;
  }
  return isActingOnNextWorkflowStep(workflowStatus, userRoleId, userRoleName);
};

/** Same as canShowWorkflowActions but only for the pending (current) workflow step. */
export const canShowPendingWorkflowActions = (
  entity: { assigned_to_user_id?: string | null } | null | undefined,
  workflowStatus: any,
  currentUserId?: string | null,
  userRoleId?: string,
  userRoleName?: string,
) => {
  if (isApplicantWorkflowRole(userRoleName)) {
    return false;
  }
  if (entity?.assigned_to_user_id) {
    return entity.assigned_to_user_id === currentUserId;
  }
  return canActOnWorkflowStep(
    getPendingWorkflowActionStep(workflowStatus),
    userRoleId,
    userRoleName,
  );
};

type FetchAssigneeOptions = {
  workflowStatus: any;
  currentUserId?: string | null;
  userRoleId?: string;
  userRoleName?: string;
  userIsHq?: boolean;
  showErrorToast?: boolean;
};

export const fetchForwardAssigneeUsers = async ({
  workflowStatus,
  currentUserId,
  showErrorToast = true,
}: FetchAssigneeOptions): Promise<any[]> => {
  const roleNames = getForwardAssigneeRoleNames(workflowStatus);
  if (!roleNames.length) return [];

  const expectedRoles = new Set(roleNames);

  if (
    Array.isArray(workflowStatus?.assigneeUsers) &&
    workflowStatus.assigneeUsers.length > 0
  ) {
    const matchedUsers = workflowStatus.assigneeUsers.filter(
      (assignee: any) =>
        assignee?.id &&
        assignee?.role?.name &&
        expectedRoles.has(assignee.role.name),
    );
    const rolesCovered = new Set(
      matchedUsers.map((assignee: any) => assignee.role?.name).filter(Boolean),
    );
    const coversAllRoles = roleNames.every((role) => rolesCovered.has(role));
    if (matchedUsers.length > 0 && coversAllRoles) {
      const fromCache = excludeUserFromAssignmentList(
        matchedUsers,
        currentUserId,
      );
      if (fromCache.length > 0) return fromCache;
    }
  }

  try {
    return await fetchUsersByRoleForAssignment(
      roleNames.length === 1 ? roleNames[0] : roleNames,
      resolveForwardAssignmentIsHq(roleNames),
      currentUserId,
    );
  } catch {
    if (showErrorToast) {
      toast.error('Failed to fetch users');
    }
    return [];
  }
};

export const fetchRejectAssigneeUsers = async ({
  workflowStatus,
  currentUserId,
  userRoleId,
  userRoleName,
  showErrorToast = true,
}: FetchAssigneeOptions): Promise<any[]> => {
  const rejectTargetStep = getRejectTargetStep(
    workflowStatus,
    userRoleId,
    userRoleName,
  );
  const roleName = getRejectAssigneeRoleName(
    workflowStatus,
    userRoleId,
    userRoleName,
  );
  if (!roleName) return [];

  try {
    return await fetchUsersByRoleForAssignment(
      roleName,
      HQ_ASSIGNMENT_ROLES.has(roleName) && rejectTargetStep?.is_hq === true
        ? true
        : undefined,
      currentUserId,
    );
  } catch {
    if (showErrorToast) {
      toast.error('Failed to fetch users');
    }
    return [];
  }
};

const inspectionStepHasAssigneePool = (step: any): boolean =>
  Boolean(step?.assignedToRoles?.length || step?.assignedToRole);

/**
 * Inspection/enquiry action visibility: entity.workflow_status = `current`.
 * - Seq 1 handoff (`approval_send_to: all`): creator already submitted on create;
 *   only `assigned_to` role users forward (e.g. JICS creates → DRCS forwards).
 * - Later steps: acting officer is `allowed_role` on current.
 */
export const canShowInspectionWorkflowActions = (
  entity: { assigned_to_user_id?: string | null } | null | undefined,
  workflowStatus: any,
  currentUserId?: string | null,
  userRoleId?: string,
  userRoleName?: string,
) => {
  if (isApplicantWorkflowRole(userRoleName)) {
    return false;
  }
  if (entity?.assigned_to_user_id) {
    return entity.assigned_to_user_id === currentUserId;
  }

  const current = workflowStatus?.current;
  if (!current) return false;

  if (
    current.approval_send_to === 'all' &&
    inspectionStepHasAssigneePool(current)
  ) {
    return canActOnAssignedToRoles(current, userRoleId, userRoleName);
  }

  return canActOnWorkflowStep(current, userRoleId, userRoleName);
};

/** Inspection/enquiry forward picker: handoff steps use next level assignee pool. */
export const loadInspectionForwardAssignmentUsers = async ({
  workflowStatus,
  currentUserId,
  showErrorToast = true,
}: FetchAssigneeOptions) => {
  const current = workflowStatus?.current;
  if (!current) {
    return { users: [] as any[], isRequired: false };
  }

  const isHandoffToSingle =
    current.approval_send_to === 'all' &&
    workflowStatus?.next?.approval_send_to === 'single';

  const pickerStep = isHandoffToSingle
    ? workflowStatus.next
    : current.approval_send_to === 'single'
      ? current
      : null;

  if (!pickerStep) {
    return { users: [] as any[], isRequired: false };
  }

  const roleNames = collectAssigneeRoleNamesFromStep(pickerStep);
  if (!roleNames.length) {
    return { users: [] as any[], isRequired: false };
  }

  try {
    const users = await fetchUsersByRoleForAssignment(
      roleNames.length === 1 ? roleNames[0] : roleNames,
      resolveInspectionForwardAssignmentIsHq(roleNames) ??
        (pickerStep.is_hq === true ? true : undefined),
      currentUserId,
    );
    return { users, isRequired: true };
  } catch {
    if (showErrorToast) {
      toast.error('Failed to fetch users');
    }
    return { users: [], isRequired: true };
  }
};

/** Inspection/enquiry return: previous-step user is chosen on the server. No assignee picker. */
export const loadInspectionRejectAssignmentUsers = async (
  _options: FetchAssigneeOptions,
): Promise<{ users: any[]; isRequired: boolean }> => {
  return { users: [], isRequired: false };
};

export const loadForwardAssignmentUsers = async ({
  workflowStatus,
  currentUserId,
  userIsHq,
}: FetchAssigneeOptions) => {
  const nextStep = workflowStatus?.next;
  if (!nextStep || nextStep.approval_send_to !== 'single') {
    return { users: [] as any[], isRequired: false };
  }
  const users = await fetchForwardAssigneeUsers({
    workflowStatus,
    currentUserId,
    userIsHq,
  });
  return { users, isRequired: true };
};

export const loadRejectAssignmentUsers = async (
  _options: FetchAssigneeOptions,
): Promise<{ users: any[]; isRequired: boolean }> => {
  // RETURN (`back`): backend resolves the previous-step assignee from activity history.
  // No manual assignee picker — same behaviour as society registration.
  return { users: [], isRequired: false };
};
