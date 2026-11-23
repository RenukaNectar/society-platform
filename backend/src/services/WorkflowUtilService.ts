import { Op, Transaction } from 'sequelize';
import sequelize from '../config/sequelize';
import Module from '../models/Module';
import ModuleWorkflow from '../models/ModuleWorkflow';
import Status from '../models/Status';
import Role from '../models/Role';
import NotificationTemplate from '../models/NotificationTemplate';
import User from '../models/user';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { createHistory, logOperation } from './HistoryService';
import { sendNotification, getUsers } from './NotificationService';
import { findStatusByKey, findStatusById } from './StatusService';
import Activity from '../models/Activity';
import History from '../models/History';
import Media from '../models/Media';
import { createActivity } from './ActiviesService';
import { generateAndUploadSocietyCertificate } from './CertificateService';
import { issueAgmProceedingsDocument } from './AgmProceedingsDocumentService';
import {
  BYE_LAW_WORKFLOW_MODULE_CONFIG,
  issueLiquidationJtUploadsOnFinalApproval,
  issueModuleByeLawDocument,
  resolveModuleByeLawsMediaId,
  resolveModuleSocietyRegistrationId,
  stampAmendmentProposedByelawIfNeeded,
} from './ModuleByeLawDocumentService';
import {
  findRenewalCertificateMediaId,
  issueRenewalCertificateDocument,
} from './RenewalCertificateDocumentService';
import { extractDocumentMediaIds, getLatestCommentDocuments } from './WorkflowCommentService';

const LIQUIDATOR_APPOINTMENT_OBSERVATIONS_KEY = 'liquidator_appointment_observations';
const LIQUIDATOR_APPOINTMENT_OBSERVATIONS_STEPS: Record<string, { uploadSequence: number; stampSequence: number }> = {
  LIQUIDATION: { uploadSequence: 7, stampSequence: 8 },
  LIQUIDATION_RCS: { uploadSequence: 8, stampSequence: 9 },
};

const pickNamedWorkflowDocumentMediaId = (documents: unknown, key: string): string | null => {
  const match = extractDocumentMediaIds(documents).find((doc) => doc.key === key && doc.mediaId?.trim());
  return match?.mediaId?.trim() || null;
};

const SOCIETY_RENEWAL_FINAL_SEQUENCE = 4;
const SOCIETY_REGISTRATION_FINAL_SEQUENCE = 10;
import SectorOfOperation from '../models/SectorOfOperation';
import SocietyRegistration from '../models/SocietyRegistration';
import ApplicationAssignment from '../models/ApplicationAssignment';
import { ensureUserAvailability } from './UserService';
import { sendNotificationEmail } from '../utils/email';
import { upsertAgmMembersToBodMembersService } from './BodMemberService';
import {
  deactivateDeletedMeetingShareholders,
  upsertMeetingElectedMembersToMembers,
} from './meetingBodMemberService';

/** User profile for workflow UI (availability + role for reassign list). */
const loadAssigneeProfileForWorkflow = async (userId: string) => {
  const { user: basic, isAvailable } = await ensureUserAvailability(userId);
  const full = await User.findByPk(basic.id, {
    attributes: [
      'id',
      'first_name',
      'last_name',
      'email',
      'role_id',
      'unavailable_since',
      'unavailable_until',
      'unavailable_reason'
    ],
    include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description'] }]
  });
  if (!full) {
    throw new AppError('User not found', 404);
  }
  return {
    id: full.id,
    first_name: full.first_name,
    last_name: full.last_name,
    email: full.email,
    full_name: (full as any).getFullName ? (full as any).getFullName() : undefined,
    role_id: full.role_id,
    role: full.role
      ? { id: full.role.id, name: full.role.name, description: full.role.description }
      : null,
    is_available: isAvailable,
    unavailable_since: full.unavailable_since ?? null,
    unavailable_until: full.unavailable_until ?? null,
    unavailable_reason: full.unavailable_reason ?? null
  };
};

/** Module key → entity config: which table, how to find record, which field is status */
export interface IModuleEntityConfig {
  modelName: string;
  findField: string;
  statusField: string;
  referenceIdField: string;
  districtField?: string;
  stateField?: string;
  statusChangedByField?: string;
  statusChangedAtField?: string;
  /** When set, workflow update will persist assigned_to (userId) on the entity; getWorkflowStatus will return assignedUser. */
  assignedToUserField?: string;
  /** When set, entity uses dynamic workflow: current step is read/written from this field (e.g. workflow_status). If unset, current step is derived from status only. */
  workflowStatusField?: string;
  redirectPathPrefix?: string;
  /** Optional fallback: if find by findField fails and this is set, try finding by this field (e.g. 'id' for UUID lookup). */
  fallbackFindField?: string;
  /** When set, fallback lookup is only attempted when this predicate returns true (e.g. resourceId looks like UUID). If unset, fallback is tried whenever primary find fails. */
  fallbackWhen?: (resourceId: string) => boolean;
}

const MODULE_ENTITY_CONFIG: Record<string, IModuleEntityConfig> = {
  SOCIETY_REGISTRATION: {
    modelName: 'SocietyRegistration',
    findField: 'id',
    statusField: 'status',
    referenceIdField: 'id',
    districtField: 'district_id',
    stateField: 'state_id',
    statusChangedByField: 'status_changed_by',
    statusChangedAtField: 'status_changed_at',
    assignedToUserField: 'assigned_to_user_id',
    workflowStatusField: 'workflow_status',
    redirectPathPrefix: '/registrations' // resourceId = registration id (UUID), not society_id
  },
  SOCIETY_RENEWAL: {
    modelName: 'SocietyRenewal',
    findField: 'id',
    statusField: 'status',
    referenceIdField: 'id',
    statusChangedByField: 'status_changed_by',
    statusChangedAtField: 'status_changed_at',
    assignedToUserField: 'assigned_to_user_id',
    workflowStatusField: 'workflow_status',
    redirectPathPrefix: '/renewals' // redirect uses society_id in URL
  },
  SOCIETY_CONVERSION: {
    modelName: 'SocietyConversion',
    findField: 'id',
    statusField: 'status',
    referenceIdField: 'id',
    statusChangedByField: 'status_changed_by',
    statusChangedAtField: 'status_changed_at',
    assignedToUserField: 'assigned_to_user_id',
    workflowStatusField: 'workflow_status',
    redirectPathPrefix: '/conversion-society'
  },
  AUDIT_REQUEST: {
    modelName: 'AuditRequest',
    findField: 'id',
    statusField: 'status_id',
    referenceIdField: 'id',
    districtField: 'district_id',
    statusChangedByField: 'status_changed_by',
    statusChangedAtField: 'status_changed_at',
    assignedToUserField: 'assigned_to_user_id',
    workflowStatusField: 'workflow_status',
    redirectPathPrefix: '/audit-requests'
  },
  LIQUIDATION: {
    modelName: 'Liquidation',
    findField: 'id',
    statusField: 'status',
    referenceIdField: 'id',
    redirectPathPrefix: '/liquidations',
    statusChangedByField: 'status_changed_by',
    statusChangedAtField: 'status_changed_at',
    assignedToUserField: 'assigned_to_user_id',
    workflowStatusField: 'workflow_status',
  },
  LIQUIDATION_RCS: {
    modelName: 'Liquidation',
    findField: 'id',
    statusField: 'status',
    referenceIdField: 'id',
    redirectPathPrefix: '/liquidations',
    statusChangedByField: 'status_changed_by',
    statusChangedAtField: 'status_changed_at',
    assignedToUserField: 'assigned_to_user_id',
    workflowStatusField: 'workflow_status',
  },
  AGM: {
    modelName: 'GeneralBodyMeeting',
    findField: 'id',
    statusField: 'status',
    referenceIdField: 'id',
    statusChangedByField: 'status_changed_by',
    statusChangedAtField: 'status_changed_at',
    assignedToUserField: 'assigned_to_user_id',
    workflowStatusField: 'workflow_status',
    redirectPathPrefix: '/annual-general-meeting',
  },
  BOD: {
    modelName: 'GeneralBodyMeeting',
    findField: 'id',
    statusField: 'status',
    referenceIdField: 'id',
    statusChangedByField: 'status_changed_by',
    statusChangedAtField: 'status_changed_at',
    assignedToUserField: 'assigned_to_user_id',
    workflowStatusField: 'workflow_status',
    redirectPathPrefix: '/board-of-directors/meetings',
  },
  SGBM: {
    modelName: 'SpecialGeneralBoardMeeting',
    findField: 'id',
    statusField: 'status',
    referenceIdField: 'id',
    statusChangedByField: 'status_changed_by',
    statusChangedAtField: 'status_changed_at',
    assignedToUserField: 'assigned_to_user_id',
    workflowStatusField: 'workflow_status',
    redirectPathPrefix: '/special-annual-general-meeting',
  },
  APPEAL: {
    modelName: 'Appeal',
    findField: 'id',
    statusField: 'status',
    referenceIdField: 'id',
    districtField: 'district_id',
    statusChangedByField: 'status_changed_by',
    statusChangedAtField: 'status_changed_at',
    assignedToUserField: 'assigned_to_user_id',
    workflowStatusField: 'workflow_status',
    redirectPathPrefix: '/appeals'
  },
  ELECTION: {
    modelName: 'ElectionRequest',
    findField: 'id',
    statusField: 'status_id',
    referenceIdField: 'id',
    districtField: 'district_id',
    statusChangedByField: 'status_changed_by',
    statusChangedAtField: 'status_changed_at',
    assignedToUserField: 'assigned_to_user_id',
    workflowStatusField: 'workflow_status',
    redirectPathPrefix: '/election-requests'
  },
  AMENDMENT: {
    modelName: 'Amendment',
    findField: 'id',
    statusField: 'status_id',
    referenceIdField: 'id',
    statusChangedByField: 'status_changed_by',
    statusChangedAtField: 'status_changed_at',
    assignedToUserField: 'assigned_to_user_id',
    workflowStatusField: 'workflow_status',
    redirectPathPrefix: '/amendments'
  },
  BUSINESS_ACTIVITY: {
    modelName: 'BusinessActivity',
    findField: 'id',
    statusField: 'status_id',
    referenceIdField: 'id',
    statusChangedByField: 'status_changed_by',
    statusChangedAtField: 'status_changed_at',
    assignedToUserField: 'assigned_to_user_id',
    workflowStatusField: 'workflow_status',
    redirectPathPrefix: '/sector-of-operation',
  },
  ANNUAL_FILING: {
    modelName: 'AnnualForm',
    findField: 'id',
    statusField: 'status',
    referenceIdField: 'id',
    statusChangedByField: 'status_changed_by',
    statusChangedAtField: 'status_changed_at',
    assignedToUserField: 'assigned_to_user_id',
    workflowStatusField: 'workflow_status',
    redirectPathPrefix: '/annual-filings'
  },
  INSPECTION_INQUIRY: {
    modelName: 'Enquiry',
    findField: 'id',
    statusField: 'status',
    referenceIdField: 'id',
    districtField: 'district_id',
    statusChangedByField: 'status_changed_by',
    statusChangedAtField: 'status_changed_at',
    assignedToUserField: 'assigned_to_user_id',
    workflowStatusField: 'workflow_status',
    redirectPathPrefix: '/inquiries'
  },
  INSPECTION_INQUIRY_RCS: {
    modelName: 'Enquiry',
    findField: 'id',
    statusField: 'status',
    referenceIdField: 'id',
    districtField: 'district_id',
    statusChangedByField: 'status_changed_by',
    statusChangedAtField: 'status_changed_at',
    assignedToUserField: 'assigned_to_user_id',
    workflowStatusField: 'workflow_status',
    redirectPathPrefix: '/inquiries'
  }
};

export interface IWorkflowUpdateParams {
  /** For SOCIETY_REGISTRATION = society registration record id (UUID). For other modules = record id. Backward compat: societyId also accepted. */
  resourceId: string;
  moduleName: string;
  action: 'approve' | 'reject' | 'back';
  userId: string;
  comments?: string;
  districtId?: string;
  stateId?: string;
  isHq?: boolean;
  /** Specific user ID to assign notification to. If provided, notification goes to this user only. If null and sendTo='single', uses first user. If null and sendTo='all', sends to all users. */
  assigned_to?: string | string[] | null;
  /** Document data (JSON object) to store in activities table. Can contain media IDs, notes, or any other document-related information. */
  documents?: any | null;
  /** Skip exactly one step: forward lands on sequence+2, return on the step before the normal return target. */
  bypass?: boolean;
  /** @deprecated Use resourceId. Kept for backward compatibility when moduleName = SOCIETY_REGISTRATION */
  societyId?: string;
}

export interface IWorkflowUpdateResult {
  success: boolean;
  message: string;
  currentStatus: string;
  nextWorkflowId?: string | null;
  nextStatus?: string | null;
  notificationSent: boolean;
  historyRecordId?: string;
  activityRecordId?: string;
  /** Next step role (for frontend: "Assigned to this role") */
  assignedToRole?: { id: string; name: string } | null;
  /** User IDs notified / assigned for next action (for frontend: "Assigned to these users") */
  assignedToUserIds?: string[];
  /** Assigned user object (when assigned_to is provided) */
  assigned_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    full_name?: string;
  } | null;
}

/** Resolve entity by module + resourceId. Used by update and getStatus. */
async function getEntityByModule(
  moduleName: string,
  resourceId: string,
  transaction?: any
): Promise<{ entity: any; config: IModuleEntityConfig; districtId?: string; stateId?: string; referenceId: string }> {
  const normalizedModuleName = String(moduleName || '').trim().toUpperCase();
  const config = MODULE_ENTITY_CONFIG[normalizedModuleName];
  if (!config) {
    throw new AppError(`Workflow not configured for module: ${moduleName}`, 400);
  }
  const Model = sequelize.models[config.modelName] as any;
  if (!Model) {
    throw new AppError(`Model not found: ${config.modelName}`, 500);
  }

  let entity = await Model.findOne({ where: { [config.findField]: resourceId }, transaction });
  if (!entity && config.fallbackFindField && (!config.fallbackWhen || config.fallbackWhen(resourceId))) {
    entity = await Model.findOne({ where: { [config.fallbackFindField]: resourceId }, transaction });
    if (entity && config.findField in entity) {
      logger.info('Found entity by fallback field, using primary field for workflow', {
        moduleName,
        fallbackValue: resourceId,
        primaryValue: entity[config.findField]
      });
    }
  }

  if (!entity) {
    throw new AppError(`${moduleName} record not found`, 404);
  }
  const referenceId = entity[config.referenceIdField] || entity.id;
  const districtId = config.districtField ? (entity.get ? entity.get(config.districtField) : entity[config.districtField]) : undefined;
  const stateId = config.stateField ? (entity.get ? entity.get(config.stateField) : entity[config.stateField]) : undefined;
  return { entity, config, districtId, stateId, referenceId: String(referenceId) };
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeAssignedToUserIds = (assignedTo?: string | string[] | null): string[] => {
  if (!assignedTo) return [];
  if (Array.isArray(assignedTo)) {
    return assignedTo.map((v) => String(v || '').trim()).filter(Boolean);
  }
  return String(assignedTo)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};

/**
 * When the approver leaves no comment, History still needs a line. Prefer readable
 * society identifiers instead of raw registration UUID for SOCIETY_REGISTRATION.
 */
const buildWorkflowHistoryCommentFallback = (
  moduleName: string,
  action: string,
  resourceId: string,
  entity: any
): string => {
  const act = String(action || 'approve').trim().toLowerCase();
  const mod = String(moduleName || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
  const plain = entity?.get ? entity.get({ plain: true }) : entity;

  if (mod === 'SOCIETY_REGISTRATION' && plain) {
    const name =
      String(plain.cooperative_society_name || plain.local_langauge_society_name || '').trim() ||
      'Society';
    return `Workflow ${act} for ${moduleName}: ${name}`;
  }

  if (mod === 'SOCIETY_RENEWAL' && plain) {
    const sid = String(plain.society_id || '').trim();
    const tail = sid ? `registration linked to society ${sid}` : resourceId;
    return `Workflow ${act} for ${moduleName}: ${tail}`;
  }

  if (mod === 'SOCIETY_CONVERSION' && plain) {
    const sid = String(plain.society_id || '').trim();
    const tail = sid ? `society registration ${sid}` : resourceId;
    return `Workflow ${act} for ${moduleName}: ${tail}`;
  }

  if (mod === 'AMENDMENT' && plain) {
    const byelaw = String(plain.byelaw_number || '').trim();
    const reason = String(plain.amendment_reason || '').trim();
    const societyName =
      String(plain.society?.cooperative_society_name || plain.society?.local_langauge_society_name || '').trim() ||
      String(plain.cooperative_society_name || '').trim();
    const tail = byelaw
      ? `Byelaw ${byelaw}`
      : societyName
        ? societyName
        : reason
          ? reason.length > 100
            ? `${reason.slice(0, 100)}…`
            : reason
          : 'Amendment request';
    return `Workflow ${act} for ${moduleName}: ${tail}`;
  }

  if (mod === 'APPEAL' && plain) {
    const name = String(plain.name_of_appellant || '').trim() || 'Appeal';
    return `Workflow ${act} for ${moduleName}: ${name}`;
  }

  if (mod === 'ELECTION' && plain) {
    const venue = String(plain.proposed_venue || '').trim();
    const tail = venue || 'Election request';
    return `Workflow ${act} for ${moduleName}: ${tail}`;
  }

  if (mod === 'ANNUAL_FILING' && plain) {
    const fy = String(plain.financial_year || plain.year || '').trim();
    const tail = fy ? `Financial year ${fy}` : 'Annual filing';
    return `Workflow ${act} for ${moduleName}: ${tail}`;
  }

  if ((mod === 'LIQUIDATION' || mod === 'LIQUIDATION_RCS') && plain) {
    const societyName =
      String(plain.society_name || plain.cooperative_society_name || '').trim() || 'Society';
    return `Workflow ${act} for Liquidation: ${societyName}`;
  }

  const humanLabel = buildResourceDisplayLabel(entity, moduleName);
  if (humanLabel && humanLabel !== moduleName.replace(/_/g, ' ')) {
    return `Workflow ${act} for ${moduleName}: ${humanLabel}`;
  }

  return `Workflow ${act} for ${moduleName}`;
};

/** "Workflow approve for LIQUIDATION: Society Name" → "Workflow approve for Liquidation: Society Name". */
const formatLiquidationWorkflowComment = (comment: string | null | undefined): string | null => {
  const match = String(comment || '')
    .trim()
    .match(/^Workflow\s+(\w+)\s+for\s+LIQUIDATION(?:_RCS)?:\s*(.+)$/i);
  if (!match) return null;
  const societyName = match[2].trim();
  if (!societyName) return null;
  return `Workflow ${match[1].toLowerCase()} for Liquidation: ${societyName}`;
};

/** Returns true if comment is the auto-generated default (no real user comment). */
const isDefaultHistoryComment = (comment: string | null | undefined, moduleName: string, referenceId: string): boolean => {
  if (!comment || !comment.trim()) return true;
  const d = comment.trim();
  const mod = String(moduleName || '').trim();
  if (
    d === `Application approved for ${moduleName} ${referenceId}` ||
    d === `Application rejected for ${moduleName} ${referenceId}` ||
    d === `Application back for ${moduleName} ${referenceId}` ||
    d === `Workflow approve for ${moduleName} ${referenceId}` ||
    d === `Workflow reject for ${moduleName} ${referenceId}` ||
    d === `Workflow back for ${moduleName} ${referenceId}`
  ) {
    return true;
  }
  // Human-readable auto lines: "Workflow approve for SOCIETY_REGISTRATION: Society Name"
  if (new RegExp(`^Workflow\\s+\\w+\\s+for\\s+${escapeRegExp(mod)}:\\s+`, 'i').test(d)) {
    return true;
  }
  // Legacy auto line with raw resource UUID: "Workflow approve for AMENDMENT <uuid>"
  if (
    /^Workflow\s+\w+\s+for\s+[A-Z0-9_\s]+\s+[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\s*$/i.test(
      d
    )
  ) {
    return true;
  }
  return false;
};

/** Human label for activity / UI (avoid showing raw registration UUID when a society name exists). */
const buildResourceDisplayLabel = (entity: any, moduleName: string): string => {
  const humanModuleName = String(moduleName || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const plain = entity?.get ? entity.get({ plain: true }) : entity;
  if (!plain) return humanModuleName;
  const label =
    String(plain.cooperative_society_name || '').trim() ||
    String(plain.local_langauge_society_name || '').trim() ||
    String(plain.society_name || '').trim() ||
    String(plain.name_of_appellant || '').trim() ||
    String(plain.society_registration_no || '').trim() ||
    String(plain.byelaw_number || '').trim() ||
    String(plain.amendment_reason || '').trim();
  return label || humanModuleName;
};

/** Use readable history line when comment is empty, legacy default, or "Workflow … MODULE <uuid>" (common client auto-text). */
const resolveEffectiveWorkflowHistoryComment = (
  comments: unknown,
  moduleName: string,
  referenceId: string,
  resourceId: string,
  entity: any,
  action: string
): string => {
  const trimmed = comments && String(comments).trim() ? String(comments).trim() : '';
  const mod = String(moduleName || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
  const fallback = buildWorkflowHistoryCommentFallback(moduleName, action, resourceId, entity);
  if (!trimmed) return fallback;
  if (isDefaultHistoryComment(trimmed, moduleName, referenceId)) return fallback;
  const uuidAutoRe =
    /^Workflow\s+\w+\s+for\s+[A-Z0-9_\s]+\s+[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\s*$/i;
  if (uuidAutoRe.test(trimmed)) return fallback;
  return trimmed;
};

/**
 * Pick latest meaningful workflow comment from History for a resource.
 * Used as "Workflow previous comment" so next assignee can see what came from the previous step.
 * Includes approval/rejection/back history and skips auto-generated default messages.
 */
const getLatestWorkflowCommentFromHistory = async (
  referenceId: string,
  moduleName: string
): Promise<string | null> => {
  try {
    const rows = await History.findAll({
      where: {
        reference_id: referenceId,
        resource: moduleName,
        type: {
          [Op.in]: ['approval', 'rejection', 'status_change']
        },
        active: true
      },
      order: [['created_at', 'DESC']],
      limit: 40,
      attributes: ['comments']
    });
    const liquidationModule = ['LIQUIDATION', 'LIQUIDATION_RCS'].includes(
      String(moduleName || '').trim().toUpperCase().replace(/\s+/g, '_')
    );
    for (const row of rows) {
      const comments = row.comments ?? null;
      if (liquidationModule) {
        const liquidationLine = formatLiquidationWorkflowComment(comments);
        if (liquidationLine) return liquidationLine;
      }
      if (!isDefaultHistoryComment(comments, moduleName, referenceId)) {
        return comments!.trim();
      }
    }
    return null;
  } catch (err: any) {
    logger.warn('Could not fetch latest workflow comment from history', {
      referenceId,
      moduleName,
      error: err?.message
    });
    return null;
  }
};

const syncMeetingElectedMembersToBod = async (
  meetingEntity: any,
  userId: string,
  transaction: any
) => {
  const electedMembers = meetingEntity?.get
    ? meetingEntity.get('elected_bod_members')
    : meetingEntity?.elected_bod_members;

  if (!Array.isArray(electedMembers) || electedMembers.length === 0) {
    return;
  }

  const bodSelectedMembers = electedMembers.filter((m: any) => m?.is_selected_for_bod === true);
  if (bodSelectedMembers.length === 0) return;

  const societyId = meetingEntity?.get ? meetingEntity.get('society_id') : meetingEntity?.society_id;
  if (!societyId) return;

  const meetingId = meetingEntity?.get ? meetingEntity.get('id') : meetingEntity?.id;
  await upsertAgmMembersToBodMembersService(societyId, meetingId, bodSelectedMembers, userId);
};

/** Sync elected AGM/BOD/SGBM members into My-Society `members` only after final approval. */
const syncMeetingElectedMembersToMembersTable = async (
  meetingEntity: any,
  userId: string
) => {
  const electedMembers = meetingEntity?.get
    ? meetingEntity.get('elected_bod_members')
    : meetingEntity?.elected_bod_members;
  const deletedMembers = meetingEntity?.get
    ? meetingEntity.get('deleted_members')
    : meetingEntity?.deleted_members;

  const hasElected = Array.isArray(electedMembers) && electedMembers.length > 0;
  const hasDeleted = Array.isArray(deletedMembers) && deletedMembers.length > 0;
  if (!hasElected && !hasDeleted) return;

  const societyId = meetingEntity?.get ? meetingEntity.get('society_id') : meetingEntity?.society_id;
  if (!societyId) return;

  const societyReg = await SocietyRegistration.findByPk(societyId, {
    attributes: ['id', 'society_id'],
  });
  if (!societyReg?.id || !(societyReg as any).society_id) {
    return;
  }

  const society = {
    id: String(societyReg.id),
    society_id: String((societyReg as any).society_id),
  };

  if (hasElected) {
    await upsertMeetingElectedMembersToMembers(society, electedMembers, userId);
  }

  if (hasDeleted) {
    await deactivateDeletedMeetingShareholders(society, deletedMembers, userId);
  }
};

/**
 * Find module by name/key
 */
const findModuleByName = async (moduleName: string): Promise<Module | null> => {
  try {
    const module = await Module.findOne({
      where: {
        [Op.or]: [
          { name: moduleName },
          { key: moduleName }
        ],
        active: true
      }
    });
    return module;
  } catch (error) {
    logger.error('Error finding module by name:', error);
    throw new AppError('Failed to find module', 500);
  }
};

const INSPECTION_INQUIRY_MODULE_ALIASES = new Set(['INSPECTION_INQUIRY', 'INSPECTION_INQUIRY_RCS']);

/**
 * District (INSPECTION_INQUIRY) and RCS/HQ (INSPECTION_INQUIRY_RCS) share the Enquiry model.
 * The stored `is_rcs_initiated` flag alone selects which workflow definition to use.
 */
const remapInspectionWorkflowStepToModule = async (
  mismatchedStep: ModuleWorkflow,
  targetModuleId: string,
  effectiveIsHq: boolean
): Promise<ModuleWorkflow | null> => {
  let step = await ModuleWorkflow.findOne({
    where: {
      module_id: targetModuleId,
      sequence: mismatchedStep.sequence,
      active: true,
      is_hq: effectiveIsHq,
    },
  });
  if (!step) {
    step = await ModuleWorkflow.findOne({
      where: {
        module_id: targetModuleId,
        sequence: mismatchedStep.sequence,
        active: true,
      },
    });
  }
  return step;
};

const resolveInspectionInquiryWorkflowContext = (
  moduleName: string,
  entity: any,
): { entityModuleName: string; workflowModuleName: string; effectiveIsHq: boolean } | null => {
  const normalized = String(moduleName || '').trim().toUpperCase();
  if (!INSPECTION_INQUIRY_MODULE_ALIASES.has(normalized)) {
    return null;
  }
  const isRcsInitiated = entity.get ? entity.get('is_rcs_initiated') : entity.is_rcs_initiated;
  const effectiveIsHq = isRcsInitiated === true;
  return {
    entityModuleName: 'INSPECTION_INQUIRY',
    workflowModuleName: effectiveIsHq ? 'INSPECTION_INQUIRY_RCS' : 'INSPECTION_INQUIRY',
    effectiveIsHq,
  };
};

/**
 * Get workflow (step) id by module name and sequence.
 * Use for resolving workflow_status or linking to a specific step.
 * @param moduleName - Module key or name (e.g. 'SOCIETY_RENEWAL', 'SOCIETY_REGISTRATION')
 * @param sequence - Workflow step sequence (1-based)
 * @param isHq - Optional; when true, returns HQ step when both HQ and non-HQ exist for same sequence
 * @returns Workflow step id (UUID) or null if not found
 */
export const getWorkflowIdByModuleAndSequence = async (
  moduleName: string,
  sequence: number,
  isHq?: boolean
): Promise<string | null> => {
  const module = await findModuleByName(moduleName);
  if (!module) return null;
  const where: any = {
    module_id: module.id,
    sequence,
    active: true
  };
  if (typeof isHq === 'boolean') {
    where.is_hq = isHq;
  }
  const workflow = await ModuleWorkflow.findOne({
    where,
    attributes: ['id'],
    order: [['sequence', 'ASC']]
  });
  return workflow ? workflow.id : null;
};

/**
 * Get current workflow step for a society based on current status
 */
const getCurrentWorkflowStep = async (
  moduleId: string,
  currentStatusId: string | null,
  isHq: boolean = false
): Promise<ModuleWorkflow | null> => {
  try {
    logger.info('Getting current workflow step', {
      moduleId,
      currentStatusId,
      isHq,
      moduleIdType: typeof moduleId,
      statusIdType: typeof currentStatusId
    });

    // Get status key if statusId provided
    let currentStatusKey: string | null = null;
    if (currentStatusId) {
      try {
        const status = await findStatusById(currentStatusId);
        if (status) {
          currentStatusKey = status.key;
          logger.info('Status resolved', {
            statusId: currentStatusId,
            statusKey: status.key,
            statusIdFromDB: status.id
          });
        } else {
          logger.warn('Status not found in database', { statusId: currentStatusId });
        }
      } catch (statusError: any) {
        logger.warn('Error resolving status', {
          statusId: currentStatusId,
          error: statusError?.message,
          stack: statusError?.stack
        });
      }
    }

    // Get all workflow steps first (simple query without includes to avoid association issues)
    const allWorkflows = await ModuleWorkflow.findAll({
      where: {
        module_id: moduleId,
        active: true,
        is_hq: isHq
      },
      order: [['sequence', 'ASC']]
    });

    logger.info(`Query executed: Found ${allWorkflows.length} workflow steps`, {
      moduleId,
      isHq,
      queryWhere: { module_id: moduleId, active: true, is_hq: isHq },
      sequences: allWorkflows.map(w => w.sequence),
      statusIds: allWorkflows.map(w => w.approval_status_id),
      firstStepStatusId: allWorkflows[0]?.approval_status_id
    });

    if (allWorkflows.length === 0) {
      logger.error('No workflow steps found', {
        moduleId,
        isHq,
        moduleIdValue: moduleId,
        isHqValue: isHq
      });
      return null;
    }

    // If no status or status is "submitted", return first workflow step (sequence 1)
    if (!currentStatusId || currentStatusKey === 'submitted') {
      const firstStep = allWorkflows.find(w => w.sequence === 1);
      if (firstStep) {
        logger.info('Returning first workflow step for submitted/null status', {
          sequence: firstStep.sequence,
          approval_status_id: firstStep.approval_status_id,
          currentStatusId,
          currentStatusKey
        });
        return firstStep;
      } else {
        logger.error('First workflow step (sequence 1) not found', {
          moduleId,
          isHq,
          availableSequences: allWorkflows.map(w => w.sequence)
        });
        return null;
      }
    }

    // Find workflow step that matches current status by approval_status_id
    // Normalize UUIDs to strings for comparison (Sequelize might return UUID objects)
    const normalizedCurrentStatusId = currentStatusId ? String(currentStatusId) : null;

    logger.info('Searching for matching workflow step', {
      currentStatusId,
      normalizedCurrentStatusId,
      currentStatusKey,
      searchingIn: allWorkflows.map(w => {
        const normalizedWorkflowStatusId = w.approval_status_id ? String(w.approval_status_id) : null;
        const matches = normalizedWorkflowStatusId === normalizedCurrentStatusId;
        return {
          sequence: w.sequence,
          approval_status_id: w.approval_status_id,
          normalized_approval_status_id: normalizedWorkflowStatusId,
          matches,
          type: typeof w.approval_status_id
        };
      })
    });

    const matchingStep = allWorkflows.find(w => {
      const normalizedWorkflowStatusId = w.approval_status_id ? String(w.approval_status_id) : null;
      const matches = normalizedWorkflowStatusId === normalizedCurrentStatusId;
      if (matches) {
        logger.info('Found match!', {
          sequence: w.sequence,
          approval_status_id: w.approval_status_id,
          normalized_approval_status_id: normalizedWorkflowStatusId,
          currentStatusId,
          normalizedCurrentStatusId
        });
      }
      return matches;
    });

    if (matchingStep) {
      logger.info('Returning matching workflow step', {
        sequence: matchingStep.sequence,
        approval_status_id: matchingStep.approval_status_id,
        currentStatusId
      });
      return matchingStep;
    }

    // Fallback: return first step
    logger.warn('No exact match found, returning first workflow step as fallback', {
      currentStatusId,
      currentStatusKey,
      currentStatusIdType: typeof currentStatusId,
      availableStatusIds: allWorkflows.map(w => ({
        id: w.approval_status_id,
        type: typeof w.approval_status_id
      }))
    });
    return allWorkflows[0] || null;
  } catch (error: any) {
    logger.error('Error getting current workflow step:', {
      error: error?.message || String(error),
      stack: error?.stack,
      moduleId,
      currentStatusId,
      isHq,
      errorName: error?.name
    });
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to get current workflow step: ${error?.message || String(error)}`, 500);
  }
};

/**
 * Get next workflow step
 * Note: Don't filter by is_hq because workflow can transition from HQ to non-HQ steps (e.g., Level 6 HQ -> Level 7 non-HQ)
 */
const getNextWorkflowStep = async (
  moduleId: string,
  currentSequence: number,
  isHq: boolean = false
): Promise<ModuleWorkflow | null> => {
  try {
    const nextSequence = Number(currentSequence) + 1;
    // First try with same is_hq value
    let nextWorkflow = await ModuleWorkflow.findOne({
      where: {
        module_id: moduleId,
        sequence: nextSequence,
        active: true,
        is_hq: isHq
      },
      include: [
        {
          model: Module,
          as: 'module',
          attributes: ['id', 'name', 'key', 'description'],
          required: false
        },
        {
          model: Status,
          as: 'approvalStatus',
          attributes: ['id', 'key', 'title'],
          required: false
        },
        {
          model: Status,
          as: 'rejectStatus',
          attributes: ['id', 'key', 'title'],
          required: false
        }
      ],
      order: [['sequence', 'ASC']]
    });

    // If not found, try with opposite is_hq value (for transitions like HQ -> non-HQ)
    if (!nextWorkflow) {
      nextWorkflow = await ModuleWorkflow.findOne({
        where: {
          module_id: moduleId,
          sequence: nextSequence,
          active: true,
          is_hq: !isHq
        },
        include: [
          {
            model: Module,
            as: 'module',
            attributes: ['id', 'name', 'key', 'description'],
            required: false
          },
          {
            model: Status,
            as: 'approvalStatus',
            attributes: ['id', 'key', 'title'],
            required: false
          },
          {
            model: Status,
            as: 'rejectStatus',
            attributes: ['id', 'key', 'title'],
            required: false
          }
        ],
        order: [['sequence', 'ASC']]
      });
    }

    return nextWorkflow;
  } catch (error) {
    logger.error('Error getting next workflow step:', error);
    throw new AppError('Failed to get next workflow step', 500);
  }
};

/**
 * Get previous workflow step (for back action)
 */
const getPreviousWorkflowStep = async (
  moduleId: string,
  currentSequence: number,
  isHq: boolean = false
): Promise<ModuleWorkflow | null> => {
  try {
    if (currentSequence <= 1) {
      return null; // Already at first step
    }

    // First try with same is_hq value
    let previousWorkflow = await ModuleWorkflow.findOne({
      where: {
        module_id: moduleId,
        sequence: currentSequence - 1,
        active: true,
        is_hq: isHq
      },
      include: [
        {
          model: Module,
          as: 'module',
          attributes: ['id', 'name', 'key', 'description'],
          required: false
        },
        {
          model: Status,
          as: 'approvalStatus',
          attributes: ['id', 'key', 'title'],
          required: false
        },
        {
          model: Status,
          as: 'rejectStatus',
          attributes: ['id', 'key', 'title'],
          required: false
        }
      ],
      order: [['sequence', 'DESC']]
    });

    // If not found, try with opposite is_hq value
    if (!previousWorkflow) {
      previousWorkflow = await ModuleWorkflow.findOne({
        where: {
          module_id: moduleId,
          sequence: currentSequence - 1,
          active: true,
          is_hq: !isHq
        },
        include: [
          {
            model: Module,
            as: 'module',
            attributes: ['id', 'name', 'key', 'description'],
            required: false
          },
          {
            model: Status,
            as: 'approvalStatus',
            attributes: ['id', 'key', 'title'],
            required: false
          },
          {
            model: Status,
            as: 'rejectStatus',
            attributes: ['id', 'key', 'title'],
            required: false
          }
        ],
        order: [['sequence', 'DESC']]
      });
    }

    return previousWorkflow;
  } catch (error) {
    logger.error('Error getting previous workflow step:', error);
    throw new AppError('Failed to get previous workflow step', 500);
  }
};

/**
 * Get previous workflow step by sequence only (one step back).
 * Use this for reject so we always go exactly one step back regardless of is_hq.
 * In society registration each (module_id, sequence) is unique.
 */
const getPreviousWorkflowStepBySequence = async (
  moduleId: string,
  currentSequence: number
): Promise<ModuleWorkflow | null> => {
  if (currentSequence <= 1) return null;
  const step = await ModuleWorkflow.findOne({
    where: {
      module_id: moduleId,
      sequence: currentSequence - 1,
      active: true
    },
    include: [
      { model: Status, as: 'approvalStatus', attributes: ['id', 'key', 'title'], required: false },
      { model: Status, as: 'rejectStatus', attributes: ['id', 'key', 'title'], required: false }
    ],
    order: [['sequence', 'ASC']]
  });
  return step;
};

/** Officers who may skip the next step when forwarding. */
const FORWARD_BYPASS_ROLES = new Set([
  'drcs_arcs_district',
  'jics_sics_hq',
  'drcs_arcs_hq'
]);

/** Officers who may skip one step when returning the file. */
const REVERSE_BYPASS_ROLES = new Set([
  'rcs_district',
  'rcs_hq',
  'jt_rcs_district',
  'jt_rcs_hq',
  'drcs_arcs_hq'
]);

/**
 * Arrival statuses that would close or mis-state the file if applied by a skip.
 * challan_pending is the normal in-queue status of the RCS step, so it stays allowed.
 */
const BLOCKED_BYPASS_ARRIVAL_STATUS_KEYS = new Set([
  'certificate_issued',
  'renewal_certificate_issued',
  'approved',
  'challan_uploaded',
  'inspection_approved',
  'inspection_inquiry_approved',
  'inquiry_approved',
  'liquidation_approved'
]);

const collectWorkflowDocumentKeys = (value: unknown): string[] => {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map((item) => String(item));
      } catch {
        return [trimmed];
      }
    }
    return [trimmed];
  }
  return [];
};

const isBypassLandingBlocked = async (step: ModuleWorkflow): Promise<boolean> => {
  const roles = await resolveWorkflowRolesFromColumn(step.allowed_role_id);
  if (roles.roleNames.includes('applicant')) return true;
  const documents = collectWorkflowDocumentKeys(step.approval_documents);
  if (documents.some((key) => key.toLowerCase().includes('challan'))) return true;
  const includedStatus = (step as any).approvalStatus?.key as string | undefined;
  const statusKey =
    includedStatus ||
    (step.approval_status_id ? (await findStatusById(step.approval_status_id))?.key : null);
  return Boolean(statusKey && BLOCKED_BYPASS_ARRIVAL_STATUS_KEYS.has(statusKey));
};

const assertBypassAllowed = async (
  direction: 'forward' | 'reverse',
  actingRoleName: string | undefined,
  currentWorkflow: ModuleWorkflow,
  comments?: string
) => {
  const allowedRoles = direction === 'forward' ? FORWARD_BYPASS_ROLES : REVERSE_BYPASS_ROLES;
  if (!actingRoleName || !allowedRoles.has(actingRoleName)) {
    throw new AppError('You cannot skip a workflow step from this role', 403);
  }
  const stepRoles = await resolveWorkflowRolesFromColumn(currentWorkflow.allowed_role_id);
  if (!stepRoles.roleNames.includes(actingRoleName)) {
    throw new AppError('You cannot skip a workflow step on this step', 403);
  }
  if (!String(comments || '').trim()) {
    throw new AppError('A comment is required when skipping a workflow step', 400);
  }
};

const currentStepCanBypass = async (
  currentWorkflow: ModuleWorkflow,
  direction: 'forward' | 'reverse'
): Promise<boolean> => {
  const allowedRoles = direction === 'forward' ? FORWARD_BYPASS_ROLES : REVERSE_BYPASS_ROLES;
  const stepRoles = await resolveWorkflowRolesFromColumn(currentWorkflow.allowed_role_id);
  return stepRoles.roleNames.some((name) => allowedRoles.has(name));
};

const SOCIETY_REGISTRATION_RCS_SEQUENCES = [8, 10] as const;

const getEntityField = (entity: any, field: string): unknown =>
  entity?.get ? entity.get(field) : entity?.[field];

const societyRegistrationHasChallanUploaded = (entity: any): boolean =>
  Boolean(getEntityField(entity, 'challan_receipt'));

const resolvePreviousStepAssigneeFromActivity = async (
  referenceId: string,
  currentWorkflowId: string,
  entity: any,
  statusChangedByField?: string
): Promise<string | null> => {
  const previousStepActivities = await Activity.findAll({
    where: { reference_id: referenceId },
    order: [['created_at', 'DESC']],
    limit: 50,
    attributes: ['id', 'data', 'created_by', 'created_at']
  });
  const approvalToCurrentStep = previousStepActivities.find(
    (a: any) =>
      a.data?.action === 'approve' && String(a.data?.nextWorkflowId) === String(currentWorkflowId)
  );
  if (approvalToCurrentStep?.created_by) {
    return String(approvalToCurrentStep.created_by);
  }
  if (statusChangedByField) {
    const previousActorId = getEntityField(entity, statusChangedByField);
    if (previousActorId) {
      return String(previousActorId);
    }
  }
  return null;
};

interface ISocietyRegRcsReturnOverride {
  newStatusId: string;
  nextStatusId: string;
  nextWorkflowId: string;
  rejectWorkflowStep: ModuleWorkflow;
  assignedToUserIds: string[];
  notifyApplicantForChallanReupload: boolean;
}

/**
 * Audit return target.
 * Step 2 and the final approve/reject step send the file back to the applicant.
 * Every other return stays with the previous officer. Officers act on `next`
 * while `current` is the last completed step, so a generic one-step back from
 * `current` would skip that officer and can land on the applicant.
 */
const decideAuditRequestReturn = async (
  moduleId: string,
  currentWorkflow: ModuleWorkflow,
  actingRoleName: string
): Promise<'applicant' | 'previous-officer' | 'default'> => {
  const pendingNext = await getNextWorkflowStep(
    moduleId,
    currentWorkflow.sequence,
    Boolean(currentWorkflow.is_hq)
  );
  const currentNames = (await resolveWorkflowRolesFromColumn(currentWorkflow.allowed_role_id)).roleNames;
  const nextNames = pendingNext
    ? (await resolveWorkflowRolesFromColumn(pendingNext.allowed_role_id)).roleNames
    : [];
  const onCurrent = currentNames.includes(actingRoleName);
  const onNext = nextNames.includes(actingRoleName);
  const actingStep = onNext && !onCurrent && pendingNext ? pendingNext : currentWorkflow;
  const approvalStatus = actingStep.approval_status_id
    ? await findStatusById(actingStep.approval_status_id)
    : null;
  const maxSequence = Number(
    await ModuleWorkflow.max('sequence', {
      where: { module_id: moduleId, active: true }
    })
  );
  const actingSequence = Number(actingStep.sequence);
  const isFinalStep =
    (Number.isFinite(maxSequence) && maxSequence > 0 && actingSequence === maxSequence) ||
    approvalStatus?.key === 'approved';
  if (isFinalStep || actingSequence === 2) {
    return 'applicant';
  }
  if (onNext && !onCurrent && Number(currentWorkflow.sequence) > 1) {
    return 'previous-officer';
  }
  return 'default';
};

/** RCS reject/return: previous officer, or applicant when challan was already uploaded. */
const resolveSocietyRegistrationRcsReturnOverride = async (
  moduleId: string,
  currentWorkflow: ModuleWorkflow,
  actingWorkflowId: string,
  referenceId: string,
  entity: any,
  statusChangedByField?: string
): Promise<ISocietyRegRcsReturnOverride | null> => {
  const seq = Number(currentWorkflow.sequence);
  if (!SOCIETY_REGISTRATION_RCS_SEQUENCES.includes(seq as (typeof SOCIETY_REGISTRATION_RCS_SEQUENCES)[number])) {
    return null;
  }

  if (societyRegistrationHasChallanUploaded(entity)) {
    const challanPendingStatus = await findStatusByKey('challan_pending');
    const level9 = await ModuleWorkflow.findOne({
      where: { module_id: moduleId, sequence: 9, active: true }
    });
    const applicantId = getEntityField(entity, 'created_by');
    if (!challanPendingStatus || !level9 || !applicantId) {
      return null;
    }
    return {
      newStatusId: challanPendingStatus.id,
      nextStatusId: challanPendingStatus.id,
      nextWorkflowId: level9.id,
      rejectWorkflowStep: level9,
      assignedToUserIds: [String(applicantId)],
      notifyApplicantForChallanReupload: true
    };
  }

  const forwardedStatus = await findStatusByKey('forwarded');
  const level7 = await ModuleWorkflow.findOne({
    where: { module_id: moduleId, sequence: 7, active: true }
  });
  const previousBySequence = await getPreviousWorkflowStepBySequence(moduleId, seq);
  const targetPrevious = seq === 10 && level7 ? level7 : previousBySequence;
  if (!forwardedStatus || !targetPrevious) {
    return null;
  }

  const assigneeId = await resolvePreviousStepAssigneeFromActivity(
    referenceId,
    actingWorkflowId,
    entity,
    statusChangedByField
  );

  return {
    newStatusId: forwardedStatus.id,
    nextStatusId: forwardedStatus.id,
    nextWorkflowId: targetPrevious.id,
    rejectWorkflowStep: targetPrevious,
    assignedToUserIds: assigneeId ? [assigneeId] : [],
    notifyApplicantForChallanReupload: false
  };
};

/**
 * Get workflow step by allowed_role_id (e.g. for reject: case goes to step where this role can act).
 */
const findWorkflowStepByAllowedRole = async (
  moduleId: string,
  roleId: string,
  isHq: boolean
): Promise<ModuleWorkflow | null> => {
  const steps = await ModuleWorkflow.findAll({
    where: { module_id: moduleId, active: true, is_hq: isHq },
    include: [
      { model: Status, as: 'approvalStatus', attributes: ['id', 'key', 'title'], required: false },
      { model: Status, as: 'rejectStatus', attributes: ['id', 'key', 'title'], required: false }
    ],
    order: [['sequence', 'ASC']]
  });
  return steps.find((s) => workflowStepIncludesRole(s.allowed_role_id, roleId)) ?? null;
};

const getWorkflowStepByRoleId = async (
  moduleId: string,
  roleId: string,
  isHq: boolean = false
): Promise<ModuleWorkflow | null> => {
  try {
    let step = await findWorkflowStepByAllowedRole(moduleId, roleId, isHq);
    if (!step) {
      step = await findWorkflowStepByAllowedRole(moduleId, roleId, !isHq);
    }
    return step;
  } catch (error) {
    logger.error('Error getting workflow step by role:', error);
    throw new AppError('Failed to get workflow step by role', 500);
  }
};

/** Result of sending workflow notifications: sent + who is assigned for next action (on approve) */
interface INotificationResult {
  notificationSent: boolean;
  assignedToUserIds: string[];
  assignedToRole: { id: string; name: string } | null;
}

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> => {
  let timer: NodeJS.Timeout | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new AppError(timeoutMessage, 504)), timeoutMs);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

/**
 * Parse module_workflows JSON role columns (assigned_to, allowed_role_id, reject_role_id).
 * Single role UUID or JSON array of role UUIDs (seeders: JSON.stringify([roleId1, roleId2])).
 */
export const parseWorkflowRoleIds = (value: unknown): string[] => {
  if (value == null || value === '') {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((id): id is string => typeof id === 'string' && id.length > 0);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
        }
      } catch {
        // treat as single UUID string
      }
    }
    return trimmed.length > 0 ? [trimmed] : [];
  }
  return [];
};

/** @deprecated Use parseWorkflowRoleIds */
export const parseWorkflowAssigneeRoleIds = parseWorkflowRoleIds;

/** True when roleId is in a workflow JSON role column (single or array). */
export const workflowStepIncludesRole = (columnValue: unknown, roleId: string): boolean => {
  const ids = parseWorkflowRoleIds(columnValue);
  return ids.includes(roleId);
};

/** Resolve role records from a module_workflows JSON role column. */
const resolveWorkflowRolesFromColumn = async (
  columnValue: unknown,
  fallbackRoleId?: string | null
): Promise<{ roleIds: string[]; roles: Role[]; roleNames: string[] }> => {
  let roleIds = parseWorkflowRoleIds(columnValue);
  if (roleIds.length === 0 && fallbackRoleId) {
    roleIds = [fallbackRoleId];
  }
  if (roleIds.length === 0) {
    return { roleIds: [], roles: [], roleNames: [] };
  }
  const roles = await Role.findAll({
    where: { id: { [Op.in]: roleIds }, is_active: true },
    attributes: ['id', 'name', 'description']
  });
  return {
    roleIds: roles.map((r) => r.id),
    roles,
    roleNames: roles.map((r) => r.name)
  };
};

const HQ_WORKFLOW_ROLE_NAMES = new Set([
  'jics_sics_hq',
  'drcs_arcs_hq',
  'jt_rcs_hq',
  'rcs_hq',
  'jt_rcs_district',
  'rcs_district',
  // HQ-type users; liquidation workflow steps stay is_hq: false
  'jics_sics_liquidator',
  'jics_sics_auditor',
]);

/** Users for a module_workflows JSON role column (district/state filtered). */
const getEligibleUsersForWorkflowRoleColumn = async (
  columnValue: unknown,
  fallbackRoleId: string | undefined,
  districtId?: string,
  stateId?: string
): Promise<{ roleIds: string[]; roles: Role[]; roleNames: string[]; userIds: string[] }> => {
  const { roleIds, roles, roleNames } = await resolveWorkflowRolesFromColumn(columnValue, fallbackRoleId);
  if (roleNames.length === 0) {
    return { roleIds, roles, roleNames, userIds: [] };
  }
  const isHqRolePool = roleNames.every((name) => HQ_WORKFLOW_ROLE_NAMES.has(name));
  const userIds = await getUsers({
    districtId: isHqRolePool ? undefined : districtId,
    stateId: isHqRolePool ? undefined : stateId,
    roleNames,
    isActive: true
  });
  return { roleIds, roles, roleNames, userIds };
};

const getPrimaryWorkflowRole = (roles: Role[]): Role | null => roles[0] ?? null;

/**
 * Replace placeholders in notification template description.
 * Supported: {{username}}, {{SocietyName}}, {{roleName}}, {{assignedToUserName}}.
 * Any remaining {{...}} are replaced with empty string so they don't show in the notification.
 */
const replaceNotificationPlaceholders = (
  description: string,
  replacements: {
    username?: string;
    SocietyName?: string;
    roleName?: string;
    assignedToUserName?: string;
    [key: string]: string | undefined;
  }
): string => {
  let result = description;

  const placeholderMap: Array<[RegExp, string]> = [
    [/\{\{username\}\}/g, replacements.username ?? ''],
    [/\{\{SocietyName\}\}/g, replacements.SocietyName ?? ''],
    [/\{\{roleName\}\}/g, replacements.roleName ?? ''],
    [/\{\{assignedToUserName\}\}/g, replacements.assignedToUserName ?? ''],
    [/\{\{previousComment\}\}/g, replacements.previousComment ?? '']
  ];

  for (const [regex, value] of placeholderMap) {
    result = result.replace(regex, value);
  }

  // Replace any remaining {{...}} with empty string so template doesn't show raw placeholders
  result = result.replace(/\{\{[^}]+\}\}/g, '');

  return result;
};

/**
 * Send notifications based on workflow configuration.
 * On approve: notifies next role's user(s) and returns them as assignedTo (for frontend "assigned to me").
 */
const sendWorkflowNotifications = async (
  workflow: ModuleWorkflow,
  action: 'approve' | 'reject',
  resourceId: string,
  moduleName: string,
  districtId?: string,
  stateId?: string,
  userId?: string,
  redirectPathPrefix?: string,
  assignedTo?: string | string[] | null,
  entity?: any,
  /** Comment from the user who approved; passed to next assignee so they can see previous flow context */
  previousComment?: string | null,
  /** When set, notify this step instead of sequence+1. Used by one-step bypass. */
  notificationContext?: {
    nextWorkflow?: ModuleWorkflow | null;
    assigneeRoleColumn?: unknown;
  }
): Promise<INotificationResult> => {
  // For SOCIETY_RENEWAL and LIQUIDATION flows, use society_id in redirect URL instead of record id
  const redirectId =
    (['SOCIETY_RENEWAL'].includes(moduleName) && entity)
      ? (entity.get ? entity.get('society_id') : entity.society_id) || resourceId
      : resourceId;

  const redirectPath = redirectPathPrefix ? `${redirectPathPrefix}/${redirectId}` : `/workflow/${moduleName}/${redirectId}`;
  // Build a human-friendly label for the resource (falls back to moduleName humanization if entity has no name)
  const humanModuleName = moduleName
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
  const entityDataForLabel = entity ? (entity.get ? entity.get() : entity) : {};
  const resourceLabel =
    entityDataForLabel?.cooperative_society_name ||
    entityDataForLabel?.local_langauge_society_name ||
    entityDataForLabel?.society_name ||
    entityDataForLabel?.name_of_appellant ||
    entityDataForLabel?.society_registration_no ||
    humanModuleName;
  const result: INotificationResult = { notificationSent: false, assignedToUserIds: [], assignedToRole: null };

  try {
    if (action === 'approve') {
      // Always get next workflow step and role/users (for frontend "assigned to me")
      // getNextWorkflowStep internally moves +1 from current sequence, so pass current sequence directly.
      const nextWorkflow =
        notificationContext?.nextWorkflow ??
        (await getNextWorkflowStep(workflow.module_id, workflow.sequence, workflow.is_hq));

      if (!nextWorkflow) {
        logger.warn('Next workflow step not found - workflow completed', { workflowId: workflow.id, sequence: workflow.sequence });
        return result;
      }

      const nextStepRoles = await resolveWorkflowRolesFromColumn(nextWorkflow.allowed_role_id);
      const nextRole = getPrimaryWorkflowRole(nextStepRoles.roles);
      if (!nextRole) {
        logger.warn('Next role not found for workflow notification', { workflowId: workflow.id, nextWorkflowId: nextWorkflow.id });
        return result;
      }

      const nextAllowedIds = parseWorkflowRoleIds(nextWorkflow.allowed_role_id);

      // Role pool from current step's module_workflows.assigned_to (single UUID or JSON array).
      // Bypass passes the skipped step's assigned_to so the landing role receives the file.
      const assigneePool = await getEligibleUsersForWorkflowRoleColumn(
        notificationContext?.assigneeRoleColumn !== undefined
          ? notificationContext.assigneeRoleColumn
          : workflow.assigned_to,
        nextAllowedIds[0],
        districtId,
        stateId
      );
      const targetRoleNames =
        assigneePool.roleNames.length > 0 ? assigneePool.roleNames : nextStepRoles.roleNames;
      const allowedRoleIdsForAssignee =
        assigneePool.roleIds.length > 0 ? assigneePool.roleIds : nextStepRoles.roleIds;

      // Get sendTo preference (default: 'single')
      const sendTo = workflow.approval_send_to || 'single';
      let userIds: string[] = [];

      // If assigned_to is provided, use those specific user(s)
      const assignedToIds = normalizeAssignedToUserIds(assignedTo);
      if (assignedToIds.length > 0) {
        const assignedUsers = await User.findAll({
          where: { id: { [Op.in]: assignedToIds }, is_active: true },
          include: [
            {
              model: Role,
              as: 'role',
              required: false
            }
          ]
        });

        if (assignedUsers.length > 0) {
          const validAssignedUserIds: string[] = [];
          for (const assignedUser of assignedUsers) {
            const assignedUserId = String(assignedUser.id);
            const userRoleId = assignedUser.role_id || assignedUser.role?.id;
            const hasCorrectRole = userRoleId
              ? allowedRoleIdsForAssignee.includes(userRoleId)
              : false;
            const districtMatch = !districtId || assignedUser.district_id === districtId;

            if (!hasCorrectRole && assigneePool.roleIds.length > 1 && assignedToIds.length === 1) {
              throw new AppError(
                `Selected user must have one of the eligible roles: ${targetRoleNames.join(', ')}`,
                400
              );
            }

            if (hasCorrectRole && districtMatch) {
              validAssignedUserIds.push(assignedUserId);
            } else if (hasCorrectRole || !districtId) {
              validAssignedUserIds.push(assignedUserId);
              logger.warn('Using assigned_to user despite role/district mismatch', {
                assignedTo: assignedUserId,
                userRole: assignedUser.role?.name,
                eligibleRoles: targetRoleNames,
                userDistrict: assignedUser.district_id,
                requiredDistrict: districtId,
                hasCorrectRole,
                districtMatch
              });
            } else {
              logger.warn('Assigned user district does not match, skipping this assigned user', {
                assignedTo: assignedUserId,
                userDistrict: assignedUser.district_id,
                requiredDistrict: districtId
              });
            }
          }

          userIds = validAssignedUserIds;
          if (userIds.length > 0) {
            logger.info('Using assigned_to user(s) for notification', {
              assignedToIds: userIds,
              eligibleRoles: targetRoleNames,
              assignedCount: userIds.length
            });
          }
        } else {
          logger.warn('Assigned user(s) not found or inactive, falling back to role-based selection', {
            assignedTo: assignedToIds
          });
        }

        // Explicit assignee was requested but role/district gate dropped everyone — still notify those users
        // so inbox matches the row persisted as assigned_to_user_id (single-assign UX).
        if (assignedToIds.length > 0 && userIds.length === 0) {
          const fallback = await User.findAll({
            where: { id: { [Op.in]: assignedToIds }, is_active: true },
            attributes: ['id']
          });
          userIds = fallback.map((u: any) => String(u.id));
          if (userIds.length > 0) {
            logger.warn('Notify explicit assigned_to users without role/district gate (no eligible users after strict match)', {
              userIds,
              eligibleRoles: targetRoleNames
            });
          }
        }
      }

      // If no user id provided or validation failed, resolve from assignee role pool
      if (userIds.length === 0) {
        const allUsersForRoles =
          assigneePool.userIds.length > 0
            ? assigneePool.userIds
            : await getUsers({
                districtId,
                stateId,
                roleNames: targetRoleNames,
                isActive: true
              });

        logger.info('Users found for assignee roles', {
          roleNames: targetRoleNames,
          sendTo,
          districtId,
          stateId,
          totalUsers: allUsersForRoles.length,
          userIds: allUsersForRoles,
          assignedToProvided: !!assignedTo,
          fromWorkflowAssignedTo: assigneePool.roleIds.length > 0
        });

        if (sendTo === 'all') {
          userIds = allUsersForRoles;
          logger.info('Sending notification to ALL users', {
            count: userIds.length,
            roleNames: targetRoleNames
          });
        } else {
          const firstUser = allUsersForRoles[0];
          userIds = firstUser ? [firstUser] : [];
          logger.info('Sending notification to SINGLE user (assigned)', {
            userId: userIds[0] || 'none',
            roleNames: targetRoleNames
          });
        }
      }

      // Always return assignment info (even if no users found)
      result.assignedToRole = { id: nextRole.id, name: nextRole.name };
      result.assignedToUserIds = userIds;

      // Always send notification if users are found
      if (userIds.length > 0) {
        // Fetch notification template from workflow
        let notificationTemplate: NotificationTemplate | null = null;
        let notificationTitle = `Application Approval`;
        let notificationDescription = `Application has been approved for ${resourceLabel}. Assigned to ${nextRole.name}.`;

        if (workflow.approval_notification_template_id) {
          try {
            notificationTemplate = await NotificationTemplate.findByPk(workflow.approval_notification_template_id);
            if (notificationTemplate && notificationTemplate.active) {
              notificationTitle = notificationTemplate.title;
              // Use template description or fallback to default
              notificationDescription = notificationTemplate.description || notificationDescription;
              logger.info('Using notification template for approval', {
                templateId: notificationTemplate.id,
                templateKey: notificationTemplate.key,
                templateTitle: notificationTemplate.title
              });
            }
          } catch (templateError: any) {
            logger.warn('Failed to fetch notification template, using default', {
              templateId: workflow.approval_notification_template_id,
              error: templateError?.message
            });
          }
        }

        // Get username and society name for placeholder replacement
        let username = '';
        let societyName = '';

        if (userId) {
          try {
            const user = await User.findByPk(userId);
            if (user) {
              username = user.getFullName();
            }
          } catch (userError: any) {
            logger.warn('Failed to fetch user for notification placeholder', {
              userId,
              error: userError?.message
            });
          }
        }

        if (entity) {
          // Try to get society name from entity (for SOCIETY_REGISTRATION, SOCIETY_RENEWAL, SOCIETY_CONVERSION)
          // Fall back to appellant/registration number for APPEAL module.
          const entityData = entity.get ? entity.get() : entity;
          societyName = entityData.cooperative_society_name ||
            entityData.local_langauge_society_name ||
            entityData.society_name ||
            entityData.name_of_appellant ||
            entityData.society_registration_no ||
            '';
        }

        let assignedToUserName = '';
        if (userIds.length === 1) {
          try {
            const assignedUser = await User.findByPk(userIds[0]);
            if (assignedUser) assignedToUserName = assignedUser.getFullName();
          } catch (_) { }
        }

        // Replace placeholders in description: {{username}}, {{SocietyName}}, {{roleName}}, {{assignedToUserName}}, {{previousComment}}
        notificationDescription = replaceNotificationPlaceholders(notificationDescription, {
          username,
          SocietyName: societyName,
          roleName: nextRole.name,
          assignedToUserName,
          previousComment: previousComment ?? ''
        });
        // Ensure next assignee sees previous comment (works with or without template)
        if (previousComment && previousComment.trim()) {
          notificationDescription = notificationDescription.trimEnd();
          if (!notificationDescription.endsWith('.')) notificationDescription += '.';
          notificationDescription += ` Previous comment: ${previousComment.trim()}`;
        }

        const notificationData = {
          title: notificationTitle,
          description: notificationDescription,
          redirect_path: redirectPath,
          data: {
            workflow_id: workflow.id,
            action,
            resource_id: resourceId,
            resource_display_name: resourceLabel,
            module_name: moduleName,
            next_role: nextRole.name,
            district_id: districtId,
            state_id: stateId,
            /** Comment from previous approver so next assignee can see what came from the flow */
            previous_comment: previousComment ?? undefined
          },
          created_by: userId || undefined,
          notification_template_id: notificationTemplate?.id || undefined
        };

        await sendNotification(userIds, notificationData);
        logger.info('Approval notification sent', {
          workflowId: workflow.id,
          userIds,
          count: userIds.length,
          nextRole: nextRole.name,
          sendTo,
          districtId,
          stateId,
          templateId: notificationTemplate?.id,
          templateKey: notificationTemplate?.key
        });
        result.notificationSent = true;
      } else {
        logger.warn('No users found for notification', {
          workflowId: workflow.id,
          roleName: nextRole.name,
          sendTo,
          districtId,
          stateId
        });
      }

      return result;
    }

    if (action === 'reject') {
      // Always send rejection notification (regardless of config)
      const sendTo = workflow.reject_send_to || 'single';

      // Find previous step role (to notify who submitted/reviewed before)
      const previousWorkflow = await getPreviousWorkflowStep(workflow.module_id, workflow.sequence, workflow.is_hq);
      let targetRole: Role | null = null;
      let userIds: string[] = [];

      // When reject_send_to is 'APPLICANT', always notify applicant (ignore previous step)
      if (sendTo === 'APPLICANT') {
        targetRole = await Role.findOne({ where: { name: 'applicant' } });
      } else if (previousWorkflow) {
        const prevRoles = await resolveWorkflowRolesFromColumn(previousWorkflow.allowed_role_id);
        targetRole = getPrimaryWorkflowRole(prevRoles.roles);
      } else {
        // If no previous workflow (first step), notify applicant
        targetRole = await Role.findOne({ where: { name: 'applicant' } });
      }

      if (!targetRole) {
        logger.warn('Target role not found for rejection notification', { workflowId: workflow.id });
        return result;
      }

      // When reject_send_to is APPLICANT, or when at first step (no previous workflow), notify applicant (entity.created_by)
      // so they get "rejected - please resubmit" (e.g. when "back" at first step is treated as reject)
      if ((sendTo === 'APPLICANT' || !previousWorkflow) && entity?.created_by) {
        userIds = [entity.created_by];
        logger.info('Sending rejection notification to applicant (created_by)', {
          applicantUserId: entity.created_by,
          reason: sendTo === 'APPLICANT' ? 'reject_send_to=APPLICANT' : 'first_step_reject_or_back'
        });
      }

      // If assigned_to is provided for reject, use those specific user(s) (only when not already sending to applicant)
      const assignedToIds = normalizeAssignedToUserIds(assignedTo);
      if (userIds.length === 0 && assignedToIds.length > 0) {
        const User = sequelize.models.User as any;
        const assignedUsers = await User.findAll({
          where: { id: { [Op.in]: assignedToIds }, is_active: true },
          include: [
            {
              model: Role,
              as: 'role',
              required: false
            }
          ]
        });

        if (assignedUsers.length > 0) {
          const validAssignedUserIds: string[] = [];
          for (const assignedUser of assignedUsers) {
            const assignedUserId = String(assignedUser.id);
            const userRoleId = assignedUser.role_id || assignedUser.role?.id;
            const hasCorrectRole = userRoleId === targetRole.id;
            const districtMatch = !districtId || assignedUser.district_id === districtId;

            if (hasCorrectRole && districtMatch) {
              validAssignedUserIds.push(assignedUserId);
            } else if (hasCorrectRole || !districtId) {
              validAssignedUserIds.push(assignedUserId);
              logger.warn('Using assigned_to user despite role/district mismatch', {
                assignedTo: assignedUserId,
                userRole: assignedUser.role?.name,
                requiredRole: targetRole.name,
                userDistrict: assignedUser.district_id,
                requiredDistrict: districtId,
                hasCorrectRole,
                districtMatch
              });
            } else {
              logger.warn('Assigned user district does not match, skipping this assigned user', {
                assignedTo: assignedUserId,
                userDistrict: assignedUser.district_id,
                requiredDistrict: districtId
              });
            }
          }

          userIds = validAssignedUserIds;
          if (userIds.length > 0) {
            logger.info('Using assigned_to user(s) for rejection notification', {
              assignedToIds: userIds,
              roleName: targetRole.name,
              assignedCount: userIds.length
            });
          }
        } else {
          logger.warn('Assigned user(s) not found or inactive, falling back to role-based selection', {
            assignedTo: assignedToIds
          });
        }
      }

      // If no assigned_to or assigned user validation failed, use role-based selection
      if (userIds.length === 0) {
        // Get all users for the target role in the same district/state
        const allUsersForRole: string[] = await getUsers({
          districtId,
          stateId,
          roleNames: [targetRole.name],
          isActive: true
        });

        logger.info('Users found for rejection notification', {
          roleName: targetRole.name,
          sendTo,
          districtId,
          stateId,
          totalUsers: allUsersForRole.length,
          userIds: allUsersForRole,
          assignedToProvided: !!assignedTo
        });

        // Apply single/all logic
        if (sendTo === 'all') {
          // Send to ALL users with this role in the same district/state
          userIds = allUsersForRole;
          logger.info('Sending rejection notification to ALL users', { count: userIds.length, roleName: targetRole.name });
        } else {
          // Send to SINGLE user (first user found - the assigned user)
          const firstUser = allUsersForRole[0];
          userIds = firstUser ? [firstUser] : [];
          logger.info('Sending rejection notification to SINGLE user', { userId: userIds[0] || 'none', roleName: targetRole.name });
        }
      }

      // Always send notification if users found
      if (userIds.length > 0) {
        // Fetch notification template from workflow
        let notificationTemplate: NotificationTemplate | null = null;
        let notificationTitle = 'Application Rejection';
        let notificationDescription = `Application has been rejected for ${resourceLabel}. Please review and resubmit.`;

        if (workflow.reject_notification_template_id) {
          try {
            notificationTemplate = await NotificationTemplate.findByPk(workflow.reject_notification_template_id);
            if (notificationTemplate && notificationTemplate.active) {
              notificationTitle = notificationTemplate.title;
              // Use template description or fallback to default
              notificationDescription = notificationTemplate.description || notificationDescription;
              logger.info('Using notification template for rejection', {
                templateId: notificationTemplate.id,
                templateKey: notificationTemplate.key,
                templateTitle: notificationTemplate.title
              });
            }
          } catch (templateError: any) {
            logger.warn('Failed to fetch notification template, using default', {
              templateId: workflow.reject_notification_template_id,
              error: templateError?.message
            });
          }
        }

        // Get username and society name for placeholder replacement
        let username = '';
        let societyName = '';

        if (userId) {
          try {
            const user = await User.findByPk(userId);
            if (user) {
              username = user.getFullName();
            }
          } catch (userError: any) {
            logger.warn('Failed to fetch user for notification placeholder', {
              userId,
              error: userError?.message
            });
          }
        }

        if (entity) {
          // Try to get society name from entity (for SOCIETY_REGISTRATION, SOCIETY_RENEWAL, SOCIETY_CONVERSION)
          // Fall back to appellant/registration number for APPEAL module.
          const entityData = entity.get ? entity.get() : entity;
          societyName = entityData.cooperative_society_name ||
            entityData.local_langauge_society_name ||
            entityData.society_name ||
            entityData.name_of_appellant ||
            entityData.society_registration_no ||
            '';
        }

        const roleNameForReject = targetRole?.name ?? '';
        let assignedToUserNameReject = '';
        if (userIds.length === 1) {
          try {
            const assignedUser = await User.findByPk(userIds[0]);
            if (assignedUser) assignedToUserNameReject = assignedUser.getFullName();
          } catch (_) { }
        }

        // Replace placeholders in description: {{username}}, {{SocietyName}}, {{roleName}}, {{assignedToUserName}}
        notificationDescription = replaceNotificationPlaceholders(notificationDescription, {
          username,
          SocietyName: societyName,
          roleName: roleNameForReject,
          assignedToUserName: assignedToUserNameReject
        });

        const notificationData = {
          title: notificationTitle,
          description: notificationDescription,
          redirect_path: redirectPath,
          data: {
            workflow_id: workflow.id,
            action: 'reject',
            resource_id: resourceId,
            resource_display_name: resourceLabel,
            module_name: moduleName,
            target_role: targetRole.name,
            district_id: districtId,
            state_id: stateId
          },
          created_by: userId || undefined,
          notification_template_id: notificationTemplate?.id || undefined
        };

        await sendNotification(userIds, notificationData);
        logger.info('Rejection notification sent', {
          workflowId: workflow.id,
          userIds,
          count: userIds.length,
          targetRole: targetRole.name,
          sendTo,
          districtId,
          stateId,
          templateId: notificationTemplate?.id,
          templateKey: notificationTemplate?.key
        });
        result.notificationSent = true;
      } else {
        logger.warn('No users found for rejection notification', {
          workflowId: workflow.id,
          sendTo,
          districtId,
          stateId,
          roleName: targetRole.name
        });
      }

      return result;
    }

    return result;
  } catch (error) {
    logger.error('Error sending workflow notifications:', error);
    return result;
  }
};

function pickWorkflowDocumentMediaId(raw: unknown): string | null {
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (raw && typeof raw === 'object') {
    const o = raw as { mediaId?: unknown; id?: unknown };
    if (typeof o.mediaId === 'string' && o.mediaId.trim()) return o.mediaId.trim();
    if (typeof o.id === 'string' && o.id.trim()) return o.id.trim();
  }
  return null;
}

/**
 * Main function to update workflow status for any module (society registration, renewal, conversion, audit, etc.).
 * Same API: status change + notification + history. Next role/users returned as assignedTo for frontend.
 */
export const updateWorkflowStatus = async (
  params: IWorkflowUpdateParams
): Promise<IWorkflowUpdateResult> => {
  const retryCount = Number((params as any).__retryCount || 0);
  const transaction = await sequelize.transaction();
  const resourceId = params.resourceId ?? params.societyId; // Backward compatibility: societyId still accepted
  if (!resourceId) {
    throw new AppError('resourceId is required', 400);
  }

  try {
    const { action, userId, comments, districtId, stateId, isHq = false, assigned_to } = params;
    const bypassRequested = params.bypass === true;
    // Normalize workflow attachments: body may send `documents` as object or JSON string (e.g. multipart + JSON field).
    let documents: any = (params as { documents?: unknown }).documents ?? null;
    if (typeof documents === 'string' && documents.trim()) {
      try {
        documents = JSON.parse(documents);
      } catch {
        logger.warn('Workflow documents: invalid JSON string, ignoring', { resourceId });
        documents = null;
      }
    }
    let moduleName = String(params.moduleName || '').trim().toUpperCase();
    const inspectionLookupName = INSPECTION_INQUIRY_MODULE_ALIASES.has(moduleName)
      ? 'INSPECTION_INQUIRY'
      : moduleName;

    // 1. Resolve entity by module (works for SOCIETY_REGISTRATION, SOCIETY_RENEWAL, SOCIETY_CONVERSION, AUDIT_REQUEST, LIQUIDATION)
    const { entity, config, districtId: entityDistrictId, stateId: entityStateId, referenceId } = await getEntityByModule(
      inspectionLookupName,
      resourceId,
      transaction
    );
    const inspectionCtx = resolveInspectionInquiryWorkflowContext(moduleName, entity);
    if (inspectionCtx) {
      moduleName = inspectionCtx.entityModuleName;
    }
    // For LIQUIDATION / LIQUIDATION_RCS, derive isHq from stored is_applicant (0 = RCS flow = isHq true)
    let effectiveIsHq = isHq;
    if (moduleName === 'LIQUIDATION' || moduleName === 'LIQUIDATION_RCS') {
      const isApplicant = entity.get ? entity.get('is_applicant') : entity.is_applicant;
      effectiveIsHq = isApplicant === false;
    }
    if (inspectionCtx) {
      effectiveIsHq = inspectionCtx.effectiveIsHq;
    }
    const finalDistrictId = districtId ?? entityDistrictId;
    const finalStateId = stateId ?? entityStateId;
    const currentStatusId = entity.get ? entity.get(config.statusField) : entity[config.statusField];

    // Get current workflow step id if entity has workflowStatusField (dynamic workflow)
    const currentWorkflowStatusId = config.workflowStatusField
      ? (entity.get ? entity.get(config.workflowStatusField) : entity[config.workflowStatusField])
      : null;

    // 2. Find module (for LIQUIDATION / INSPECTION_INQUIRY RCS flows use *_RCS module for workflow steps)
    const workflowModuleName =
      inspectionCtx?.workflowModuleName ??
      ((moduleName === 'LIQUIDATION' && effectiveIsHq)
        ? 'LIQUIDATION_RCS'
        : moduleName);
    const module = await findModuleByName(workflowModuleName);
    if (!module) {
      throw new AppError(`Module not found: ${workflowModuleName}`, 404);
    }

    // 3. Get current workflow step
    // Priority: Use workflowStatusField (dynamic workflow) if available, otherwise match by status ID
    let currentWorkflow: ModuleWorkflow | null = null;
    if (currentWorkflowStatusId && config.workflowStatusField) {
      // Direct lookup by workflow step ID
      currentWorkflow = await ModuleWorkflow.findByPk(currentWorkflowStatusId, {
        include: [
          {
            model: Module,
            as: 'module',
            attributes: ['id', 'name', 'key', 'description'],
            required: false
          },
        ]
      });
      if (currentWorkflow && !currentWorkflow.active) {
        currentWorkflow = null;
      }
      if (
        currentWorkflow &&
        currentWorkflow.module_id !== module.id &&
        inspectionCtx
      ) {
        const remapped = await remapInspectionWorkflowStepToModule(
          currentWorkflow,
          module.id,
          effectiveIsHq
        );
        logger.warn('Remapped inspection workflow step on update', {
          resourceId,
          fromModuleId: currentWorkflow.module_id,
          toModuleId: module.id,
          sequence: currentWorkflow.sequence,
          remapped: !!remapped,
        });
        currentWorkflow = remapped;
      }
      if (currentWorkflow && currentWorkflow.module_id !== module.id) {
        currentWorkflow = null; // Invalid workflow step, fall back to status matching
      }
      logger.info('Using workflowStatusField', {
        field: config.workflowStatusField,
        workflowStatusId: currentWorkflowStatusId,
        found: !!currentWorkflow
      });
    }

    // Fallback: match by status ID
    if (!currentWorkflow) {
      currentWorkflow = await getCurrentWorkflowStep(module.id, currentStatusId, effectiveIsHq);
    }

    if (!currentWorkflow) {
      throw new AppError('Current workflow step not found', 404);
    }

    // Non-null alias for approve/reject/back handling (may advance to final renewal step for DRCS).
    let actingWorkflow: ModuleWorkflow = currentWorkflow;

    // Applicants submit/resubmit via module forms and uploads — never workflow forward/return.
    let actingRoleName: string | undefined;
    if (action === 'approve' || action === 'reject' || action === 'back') {
      const actingUser = await User.findByPk(userId, {
        include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }]
      });
      actingRoleName = (actingUser as any)?.role?.name;
      if (actingRoleName === 'applicant') {
        throw new AppError('Applicants cannot forward or return workflow applications', 403);
      }
    }

    let newStatusId: string | null = null;
    let nextWorkflowId: string | null = null;
    let nextStatusId: string | null = null;
    let historyType: string = 'status_change';
    let bypassSkippedStep: ModuleWorkflow | null = null;
    const notifResult: INotificationResult = { notificationSent: false, assignedToUserIds: [], assignedToRole: null };
    let shouldGenerateRenewalCertificate = false;

    if (bypassRequested && action === 'reject') {
      throw new AppError('Skip is only available when forwarding or returning', 400);
    }

    // 4. Handle actions
    if (action === 'approve') {
      // Use current workflow's is_hq value to find next step (getNextWorkflowStep will try both if needed)
      const currentIsHq = actingWorkflow.is_hq ?? effectiveIsHq;

      // SOCIETY_RENEWAL: DRCS final step (sequence 4) must complete in a single approval.
      // A bypass must stay on the real current step and jump exactly one step ahead.
      if (!bypassRequested && moduleName === 'SOCIETY_RENEWAL' && actingRoleName === 'drcs_arcs_district') {
        if (Number(actingWorkflow.sequence) !== SOCIETY_RENEWAL_FINAL_SEQUENCE) {
          const pendingFinalStep = await getNextWorkflowStep(
            module.id,
            actingWorkflow.sequence,
            currentIsHq
          );
          if (
            pendingFinalStep &&
            Number(pendingFinalStep.sequence) === SOCIETY_RENEWAL_FINAL_SEQUENCE
          ) {
            actingWorkflow = pendingFinalStep;
          }
        }
      }

      let nextWorkflow = await getNextWorkflowStep(
        module.id,
        actingWorkflow.sequence,
        currentIsHq
      );

      if (bypassRequested && nextWorkflow && actingRoleName) {
        const onCurrentStep = (
          await resolveWorkflowRolesFromColumn(actingWorkflow.allowed_role_id)
        ).roleNames.includes(actingRoleName);
        const onNextStep = (
          await resolveWorkflowRolesFromColumn(nextWorkflow.allowed_role_id)
        ).roleNames.includes(actingRoleName);
        if (!onCurrentStep && onNextStep) {
          actingWorkflow = nextWorkflow;
          nextWorkflow = await getNextWorkflowStep(
            module.id,
            actingWorkflow.sequence,
            actingWorkflow.is_hq ?? currentIsHq
          );
        }
      }

      if (bypassRequested) {
        await assertBypassAllowed('forward', actingRoleName, actingWorkflow, comments);
        if (!nextWorkflow) {
          throw new AppError('There is no next step to skip', 400);
        }
        const landingWorkflow = await getNextWorkflowStep(
          module.id,
          nextWorkflow.sequence,
          nextWorkflow.is_hq
        );
        if (!landingWorkflow) {
          throw new AppError('There is no step after the one you are skipping', 400);
        }
        if (await isBypassLandingBlocked(landingWorkflow)) {
          throw new AppError('This step cannot be skipped', 400);
        }
        bypassSkippedStep = nextWorkflow;
        nextWorkflow = landingWorkflow;
        logger.info('Forward bypass: skipping one workflow step', {
          moduleName,
          fromSequence: actingWorkflow.sequence,
          skippedSequence: bypassSkippedStep.sequence,
          landingSequence: landingWorkflow.sequence
        });
      }

      if (
        moduleName === 'SOCIETY_RENEWAL' &&
        Number(actingWorkflow.sequence) === SOCIETY_RENEWAL_FINAL_SEQUENCE
      ) {
        nextWorkflow = null;
      }

      currentWorkflow = actingWorkflow;
      if (nextWorkflow && nextWorkflow.approval_status_id) {
        newStatusId = nextWorkflow.approval_status_id;
        nextWorkflowId = nextWorkflow.id; // This will be set to workflow_status
        nextStatusId = nextWorkflow.approval_status_id;
        // Forwarding to final DRCS step is not certificate issuance — keep status as forwarded.
        if (moduleName === 'SOCIETY_RENEWAL') {
          const renewalIssuedStatus = await findStatusByKey('renewal_certificate_issued');
          if (
            renewalIssuedStatus &&
            nextWorkflow.approval_status_id === renewalIssuedStatus.id
          ) {
            const forwardedStatus = await findStatusByKey('forwarded');
            if (forwardedStatus) {
              newStatusId = forwardedStatus.id;
              nextStatusId = forwardedStatus.id;
            }
          }
        }
        // Inquiry/Inspection: the final step's status (inspection approved) must be
        // applied when RCS approves that step, not when the previous officer forwards into it.
        if (moduleName === 'INSPECTION_INQUIRY' && currentWorkflow.approval_status_id) {
          const nextStatus = await findStatusById(nextWorkflow.approval_status_id);
          if (
            nextStatus?.key === 'inspection_approved' ||
            nextStatus?.key === 'inspection_inquiry_approved' ||
            nextStatus?.key === 'inquiry_approved'
          ) {
            newStatusId = currentWorkflow.approval_status_id;
            nextStatusId = currentWorkflow.approval_status_id;
          }
        }
        historyType = 'approval';
        logger.info('Next workflow step found', {
          currentSequence: currentWorkflow.sequence,
          nextSequence: nextWorkflow.sequence,
          currentIsHq: currentIsHq,
          nextIsHq: nextWorkflow.is_hq,
          nextWorkflowId: nextWorkflow.id
        });
        // Single-send steps must receive assigned_to (next user id) from client — except applicant actor
        // (e.g. challan upload → notify first RCS via getUsers fallback).
        const sendToGate = nextWorkflow.approval_send_to || 'single';
        if (moduleName === 'SOCIETY_REGISTRATION' && sendToGate === 'single') {
          const actorRoles = await resolveWorkflowRolesFromColumn(currentWorkflow.allowed_role_id);
          const actorRole = getPrimaryWorkflowRole(actorRoles.roles);
          const isApplicantActor = actorRole?.name === 'applicant';
          if (!isApplicantActor && normalizeAssignedToUserIds(assigned_to).length === 0) {
            throw new AppError('Next assignee is required: pass assigned_to (user id) for this approval step.', 400);
          }
        }
        try {
          const res = await withTimeout(
            sendWorkflowNotifications(
              currentWorkflow,
              'approve',
              resourceId,
              moduleName,
              finalDistrictId,
              finalStateId,
              userId,
              config.redirectPathPrefix,
              assigned_to,
              entity,
              comments, // Pass comment to next assignee so they can see previous flow context
              bypassSkippedStep
                ? {
                    nextWorkflow,
                    assigneeRoleColumn:
                      bypassSkippedStep.assigned_to ?? nextWorkflow.allowed_role_id
                  }
                : undefined
            ),
            12000,
            'Approval notification timed out'
          );
          notifResult.notificationSent = res.notificationSent;
          notifResult.assignedToUserIds = res.assignedToUserIds || [];
          notifResult.assignedToRole = res.assignedToRole || null;
        } catch (notifyErr: any) {
          logger.warn('Approve notification failed, continuing workflow update', {
            moduleName,
            resourceId,
            error: notifyErr?.message
          });
          notifResult.notificationSent = false;
          notifResult.assignedToUserIds = [];
          notifResult.assignedToRole = null;
        }
      } else {
        // Workflow completed - no next step
        if (moduleName === 'SOCIETY_RENEWAL' && currentWorkflow.approval_status_id) {
          // Terminal DRCS step (sequence 4): always set renewal_certificate_issued.
          const renewalIssuedStatus = await findStatusByKey('renewal_certificate_issued');
          if (
            renewalIssuedStatus &&
            currentWorkflow.sequence === SOCIETY_RENEWAL_FINAL_SEQUENCE
          ) {
            newStatusId = renewalIssuedStatus.id;
            nextStatusId = renewalIssuedStatus.id;
          } else {
            newStatusId = currentWorkflow.approval_status_id;
          }
          nextWorkflowId = null;
          historyType = 'approval';
        } else if (
          moduleName === 'SOCIETY_REGISTRATION' &&
          Number(currentWorkflow.sequence) === SOCIETY_REGISTRATION_FINAL_SEQUENCE &&
          currentWorkflow.approval_status_id
        ) {
          const certificateIssuedStatus = await findStatusByKey('certificate_issued');
          if (
            certificateIssuedStatus &&
            String(currentWorkflow.approval_status_id) === String(certificateIssuedStatus.id)
          ) {
            newStatusId = certificateIssuedStatus.id;
            nextStatusId = certificateIssuedStatus.id;
          } else {
            newStatusId = currentWorkflow.approval_status_id;
            nextStatusId = currentWorkflow.approval_status_id;
          }
          nextWorkflowId = null;
          historyType = 'approval';
        } else if (moduleName === 'INSPECTION_INQUIRY' && currentWorkflow.approval_status_id) {
          newStatusId = currentWorkflow.approval_status_id;
          nextStatusId = currentWorkflow.approval_status_id;
          nextWorkflowId = null;
          historyType = 'approval';
        } else {
          const completedStatus = await findStatusByKey('approved');
          if (completedStatus) {
            newStatusId = completedStatus.id;
            nextWorkflowId = null; // Clear workflow_status when completed
            historyType = 'approval';
          } else {
            throw new AppError('Approved status not found', 404);
          }
        }
      }

      // Final SOCIETY_RENEWAL step (DRCS sequence 4): stamp QR and issue certificate.
      if (moduleName === 'SOCIETY_RENEWAL' && !nextWorkflow) {
        const renewalIssuedStatus = await findStatusByKey('renewal_certificate_issued');
        const isFinalRenewalStep =
          currentWorkflow.sequence === SOCIETY_RENEWAL_FINAL_SEQUENCE ||
          (renewalIssuedStatus &&
            String(currentWorkflow.approval_status_id || '') ===
              String(renewalIssuedStatus.id));
        if (isFinalRenewalStep) {
          shouldGenerateRenewalCertificate = true;
        }
      }
    } else if (action === 'reject') {
      // On reject: always move exactly one step back by sequence (so Level 3 -> Level 2, not Level 1)
      const previousWorkflowReject = await getPreviousWorkflowStepBySequence(module.id, currentWorkflow.sequence);
      let rejectWorkflowStep: ModuleWorkflow | null = previousWorkflowReject;
      let societyRegRcsReturnOverride: ISocietyRegRcsReturnOverride | null = null;

      if (currentWorkflow.reject_status_id) {
        newStatusId = currentWorkflow.reject_status_id;
        nextStatusId = currentWorkflow.reject_status_id;
        historyType = 'rejection';

        // Check if reject_status_id is a final rejection status (like 'rejected')
        const rejectStatus = await findStatusById(currentWorkflow.reject_status_id);
        const rejectStatusKey = rejectStatus?.key;
        let isFinalRejection = rejectStatusKey === 'rejected' || rejectStatusKey === 'cancelled';

        if (moduleName === 'SOCIETY_REGISTRATION') {
          societyRegRcsReturnOverride = await resolveSocietyRegistrationRcsReturnOverride(
            module.id,
            currentWorkflow,
            actingWorkflow.id,
            referenceId,
            entity,
            config.statusChangedByField
          );
          if (societyRegRcsReturnOverride) {
            newStatusId = societyRegRcsReturnOverride.newStatusId;
            nextStatusId = societyRegRcsReturnOverride.nextStatusId;
            nextWorkflowId = societyRegRcsReturnOverride.nextWorkflowId;
            rejectWorkflowStep = societyRegRcsReturnOverride.rejectWorkflowStep;
            notifResult.assignedToUserIds = societyRegRcsReturnOverride.assignedToUserIds;
            isFinalRejection = false;
            logger.info('SOCIETY_REGISTRATION RCS reject: return override applied', {
              sequence: currentWorkflow.sequence,
              nextWorkflowId: societyRegRcsReturnOverride.nextWorkflowId,
              assignedToUserIds: societyRegRcsReturnOverride.assignedToUserIds,
              notifyApplicantForChallanReupload: societyRegRcsReturnOverride.notifyApplicantForChallanReupload
            });
          }
        }

        logger.info('Reject: checking rejection status', {
          rejectStatusId: currentWorkflow.reject_status_id,
          rejectStatusKey,
          isFinalRejection,
          currentSequence: currentWorkflow.sequence,
          moduleName,
          hasPreviousStep: !!previousWorkflowReject
        });

        if (isFinalRejection) {
          // For final rejection, clear workflow_status
          nextWorkflowId = null;
          logger.info('Reject: final rejection - clearing workflow_status', {
            rejectStatusKey,
            currentSequence: currentWorkflow.sequence,
            moduleName
          });
        } else if (!societyRegRcsReturnOverride) {
          // One step back: workflow_status = previous step's id (or current step if already at first step)
          if (previousWorkflowReject) {
            nextWorkflowId = previousWorkflowReject.id;
            logger.info('Reject: workflow moving one step back', {
              previousSequence: previousWorkflowReject.sequence,
              previousWorkflowId: previousWorkflowReject.id,
              moduleName
            });
          } else {
            // At first step: keep workflow_status at current step (sequence 1) so applicant can be notified
            // Note: This should not happen for final rejections as they're handled above
            nextWorkflowId = currentWorkflow.id;
            rejectWorkflowStep = currentWorkflow;
            logger.info('Reject: already at first step, workflow_status set to current step (sequence 1)', {
              currentWorkflowId: currentWorkflow.id,
              currentSequence: currentWorkflow.sequence,
              moduleName,
              rejectStatusKey
            });
          }
        }

        const societyRegResolvedAssignees = societyRegRcsReturnOverride?.assignedToUserIds?.length
          ? [...societyRegRcsReturnOverride.assignedToUserIds]
          : [];

        const res = await sendWorkflowNotifications(
          currentWorkflow,
          'reject',
          resourceId,
          moduleName,
          finalDistrictId,
          finalStateId,
          userId,
          config.redirectPathPrefix,
          assigned_to,
          entity,
          undefined // previousComment not needed for reject
        );
        notifResult.notificationSent = res.notificationSent;
        // For reject: return previous step's role as assigned (one step back)
        if (nextWorkflowId && rejectWorkflowStep) {
          const rejectRoles = await resolveWorkflowRolesFromColumn(rejectWorkflowStep.allowed_role_id);
          const rejectRole = getPrimaryWorkflowRole(rejectRoles.roles);
          if (rejectRole) {
            notifResult.assignedToRole = { id: rejectRole.id, name: rejectRole.name };
          }
          if (societyRegResolvedAssignees.length > 0) {
            notifResult.assignedToUserIds = societyRegResolvedAssignees;
          } else if (rejectRole) {
            notifResult.assignedToUserIds = res.assignedToUserIds || [];
          }
        }

        if (societyRegRcsReturnOverride && notifResult.assignedToUserIds?.length) {
          const redirectPath = config.redirectPathPrefix
            ? `${config.redirectPathPrefix}/${resourceId}`
            : `/workflow/${moduleName}/${resourceId}`;
          const societyName =
            getEntityField(entity, 'cooperative_society_name') || 'Society';
          try {
            await sendNotification(notifResult.assignedToUserIds, {
              title: societyRegRcsReturnOverride.notifyApplicantForChallanReupload
                ? 'Challan re-upload required'
                : 'Request has been re-assigned to you',
              description: societyRegRcsReturnOverride.notifyApplicantForChallanReupload
                ? `Please re-upload the challan for ${societyName}.`
                : `Request has been re-assigned to you for ${societyName}. Please review and take action.`,
              redirect_path: redirectPath,
              data: {
                action: 'reject',
                resource_id: resourceId,
                module_name: moduleName
              },
              created_by: userId || undefined
            });
            notifResult.notificationSent = true;
          } catch (societyRegNotifErr: any) {
            logger.warn('SOCIETY_REGISTRATION RCS reject: failed to send return notification', {
              error: societyRegNotifErr?.message
            });
          }
        }
      } else {
        const rejectStatus = await findStatusByKey('rejected');
        if (rejectStatus) {
          newStatusId = rejectStatus.id;
          nextWorkflowId = null;
          nextStatusId = null;
          historyType = 'rejection';
        } else {
          throw new AppError('Rejected status not found', 404);
        }
      }
    } else if (action === 'back') {
      if (bypassRequested) {
        await assertBypassAllowed('reverse', actingRoleName, currentWorkflow, comments);
      }
      let previousWorkflow = await getPreviousWorkflowStep(module.id, currentWorkflow.sequence, effectiveIsHq);
      let auditReturnedToApplicant = false;
      if (moduleName === 'AUDIT_REQUEST' && actingRoleName) {
        const auditReturn = await decideAuditRequestReturn(module.id, currentWorkflow, actingRoleName);
        if (auditReturn === 'applicant') {
          if (bypassRequested) {
            throw new AppError('This return goes back to the applicant and cannot skip a step', 400);
          }
          const actingForStatus = currentWorkflow;
          const rejectStatus =
            (actingForStatus.reject_status_id
              ? await findStatusById(actingForStatus.reject_status_id)
              : null) || (await findStatusByKey('rejected'));
          if (!rejectStatus) {
            throw new AppError('Rejected status not found', 404);
          }
          auditReturnedToApplicant = true;
          newStatusId = rejectStatus.id;
          nextStatusId = rejectStatus.id;
          nextWorkflowId = null;
          historyType = 'rejection';
          const applicantId = getEntityField(entity, 'created_by');
          if (applicantId) {
            notifResult.assignedToUserIds = [String(applicantId)];
          }
          const applicantRole = await Role.findOne({ where: { name: 'applicant' } });
          if (applicantRole) {
            notifResult.assignedToRole = { id: applicantRole.id, name: applicantRole.name };
          }
          if (notifResult.assignedToUserIds?.length) {
            const redirectPath = config.redirectPathPrefix
              ? `${config.redirectPathPrefix}/${resourceId}`
              : `/audit-requests/${resourceId}`;
            try {
              await sendNotification(notifResult.assignedToUserIds, {
                title: 'Audit request returned for correction',
                description: 'Your audit request has been returned. Please correct the details and re-submit.',
                redirect_path: redirectPath,
                data: { action: 'back', resource_id: resourceId, module_name: moduleName },
                created_by: userId || undefined
              });
              notifResult.notificationSent = true;
            } catch (auditReturnErr: any) {
              logger.warn('AUDIT_REQUEST return: failed to notify applicant', {
                error: auditReturnErr?.message
              });
            }
          }
          logger.info('AUDIT_REQUEST return assigned to applicant', {
            resourceId,
            actingRoleName,
            currentSequence: currentWorkflow.sequence
          });
        } else if (auditReturn === 'previous-officer' && !bypassRequested) {
          previousWorkflow = currentWorkflow;
          logger.info('AUDIT_REQUEST return stays with the previous officer', {
            resourceId,
            landingSequence: currentWorkflow.sequence
          });
        }
      }
      if (auditReturnedToApplicant) {
        // Status, workflow clear, and applicant assignment are already set.
      } else if (previousWorkflow) {
        historyType = 'rejection';
        let societyRegRcsReturnOverride: ISocietyRegRcsReturnOverride | null = null;

        if (moduleName === 'SOCIETY_REGISTRATION') {
          societyRegRcsReturnOverride = await resolveSocietyRegistrationRcsReturnOverride(
            module.id,
            currentWorkflow,
            actingWorkflow.id,
            referenceId,
            entity,
            config.statusChangedByField
          );
        }

        if (societyRegRcsReturnOverride) {
          newStatusId = societyRegRcsReturnOverride.newStatusId;
          nextWorkflowId = societyRegRcsReturnOverride.nextWorkflowId;
          nextStatusId = societyRegRcsReturnOverride.nextStatusId;
          previousWorkflow = societyRegRcsReturnOverride.rejectWorkflowStep;
          notifResult.assignedToUserIds = societyRegRcsReturnOverride.assignedToUserIds;
          logger.info('SOCIETY_REGISTRATION RCS back: return override applied', {
            sequence: currentWorkflow.sequence,
            nextWorkflowId: societyRegRcsReturnOverride.nextWorkflowId,
            assignedToUserIds: societyRegRcsReturnOverride.assignedToUserIds
          });
        } else {
          // Prefer workflow-configured reject status for this step.
          // Fallback to global "rejected" only if step-level reject status is not configured.
          const rejectStatusId = currentWorkflow.reject_status_id || (await findStatusByKey('rejected'))?.id || null;
          if (!rejectStatusId) {
            throw new AppError('Rejected status not found', 404);
          }
          newStatusId = rejectStatusId;
          nextWorkflowId = previousWorkflow.id; // Set to previous workflow step
          nextStatusId = rejectStatusId;
          const assigneeId = await resolvePreviousStepAssigneeFromActivity(
            referenceId,
            actingWorkflow.id,
            entity,
            config.statusChangedByField
          );
          if (assigneeId) {
            notifResult.assignedToUserIds = [assigneeId];
            logger.info('Back action: resolved previous step assigned user', {
              previousStepAssignedUserId: assigneeId,
              currentWorkflowId: actingWorkflow.id,
              previousWorkflowId: previousWorkflow.id
            });
          }
        }

        if (bypassRequested) {
          if (societyRegRcsReturnOverride?.notifyApplicantForChallanReupload) {
            throw new AppError('This return cannot skip the applicant challan step', 400);
          }
          const landingWorkflow = await getPreviousWorkflowStep(
            module.id,
            previousWorkflow.sequence,
            previousWorkflow.is_hq
          );
          if (!landingWorkflow) {
            throw new AppError('There is no earlier step to assign after the skip', 400);
          }
          if (await isBypassLandingBlocked(landingWorkflow)) {
            throw new AppError('This step cannot be skipped', 400);
          }
          bypassSkippedStep = previousWorkflow;
          const assigneeId = await resolvePreviousStepAssigneeFromActivity(
            referenceId,
            previousWorkflow.id,
            entity,
            config.statusChangedByField
          );
          previousWorkflow = landingWorkflow;
          nextWorkflowId = landingWorkflow.id;
          notifResult.assignedToUserIds = assigneeId ? [assigneeId] : [];
          logger.info('Return bypass: skipping one workflow step', {
            moduleName,
            fromSequence: currentWorkflow.sequence,
            skippedSequence: bypassSkippedStep.sequence,
            landingSequence: landingWorkflow.sequence
          });
        }

        const previousRoles = await resolveWorkflowRolesFromColumn(previousWorkflow.allowed_role_id);
        const previousRole = getPrimaryWorkflowRole(previousRoles.roles);
        if (previousRole) {
          notifResult.assignedToRole = { id: previousRole.id, name: previousRole.name };
        }
        // Send notification to previous step user(s) that request has been sent back
        // For SOCIETY_RENEWAL, use society_id in redirect URL instead of renewal id
        const redirectIdForBack =
          (['SOCIETY_RENEWAL'].includes(moduleName) && entity)
            ? (entity.get ? entity.get('society_id') : entity.society_id) || resourceId
            : resourceId;
        const redirectPath = config.redirectPathPrefix ? `${config.redirectPathPrefix}/${redirectIdForBack}` : `/workflow/${moduleName}/${redirectIdForBack}`;
        const roleNameForBack =
          notifResult.assignedToRole?.name ??
          getPrimaryWorkflowRole((await resolveWorkflowRolesFromColumn(previousWorkflow.allowed_role_id)).roles)?.name;
        const backNotifyUserIds = notifResult.assignedToUserIds?.length
          ? notifResult.assignedToUserIds
          : roleNameForBack
            ? (await getUsers({ districtId: finalDistrictId, stateId: finalStateId, roleNames: [roleNameForBack], isActive: true })).slice(0, 1)
            : [];
        if (backNotifyUserIds.length > 0) {
          try {
            const societyName =
              getEntityField(entity, 'cooperative_society_name') || 'Society';
            const challanReupload =
              societyRegRcsReturnOverride?.notifyApplicantForChallanReupload === true;
            await sendNotification(backNotifyUserIds, {
              title: challanReupload ? 'Challan re-upload required' : 'Request has been re-assigned to you',
              description: challanReupload
                ? `Please re-upload the challan for ${societyName}.`
                : bypassSkippedStep
                  ? `A workflow step was skipped and the file is assigned to you for ${societyName}. Please review and take action.`
                  : `Request has been re-assigned to you for ${societyName}. Please review and take action.`,
              redirect_path: redirectPath,
              data: { action: 'back', resource_id: redirectIdForBack, module_name: moduleName },
              created_by: userId || undefined
            });
            notifResult.notificationSent = true;
            logger.info('Back action: notification sent to previous step user(s)', {
              userIds: backNotifyUserIds,
              previousWorkflowId: previousWorkflow.id
            });
          } catch (backNotifErr: any) {
            logger.warn('Back action: failed to send notification', { error: backNotifErr?.message });
          }
        }
      } else {
        if (bypassRequested) {
          throw new AppError('There is no step to skip on return', 400);
        }
        // At first step: treat back action as reject action
        logger.info('Back action at first step: treating as reject action', {
          currentWorkflowId: currentWorkflow.id,
          currentSequence: currentWorkflow.sequence
        });

        if (currentWorkflow.reject_status_id) {
          newStatusId = currentWorkflow.reject_status_id;
          nextStatusId = currentWorkflow.reject_status_id;
          historyType = 'rejection';
          // Back at first step: clear workflow_status so record is no longer in any workflow step
          nextWorkflowId = null;
          logger.info('Back at first step: clearing workflow_status', {
            currentWorkflowId: currentWorkflow.id,
            currentSequence: currentWorkflow.sequence,
            moduleName
          });

          const res = await sendWorkflowNotifications(
            currentWorkflow,
            'reject',
            resourceId,
            moduleName,
            finalDistrictId,
            finalStateId,
            userId,
            config.redirectPathPrefix,
            assigned_to,
            entity,
            undefined // previousComment not needed for reject
          );
          notifResult.notificationSent = res.notificationSent;

          // Set assigned role to current step's role
          const rejectRoles = await resolveWorkflowRolesFromColumn(currentWorkflow.allowed_role_id);
          const rejectRole = getPrimaryWorkflowRole(rejectRoles.roles);
          if (rejectRole) {
            notifResult.assignedToRole = { id: rejectRole.id, name: rejectRole.name };
            notifResult.assignedToUserIds = res.assignedToUserIds || [];
          }
        } else {
          const rejectStatus = await findStatusByKey('rejected');
          if (rejectStatus) {
            newStatusId = rejectStatus.id;
            nextWorkflowId = null;
            nextStatusId = null;
            historyType = 'rejection';
            if (moduleName === 'AUDIT_REQUEST') {
              const applicantId = getEntityField(entity, 'created_by');
              if (applicantId) {
                notifResult.assignedToUserIds = [String(applicantId)];
              }
            }
          } else {
            throw new AppError('Rejected status not found', 404);
          }
        }
      }
    }

    if (!newStatusId) {
      throw new AppError('Failed to determine new status', 500);
    }

    // 5. Update entity status and workflow_status (generic: status or status_id, optional status_changed_by/at, workflow_status)
    const status = await findStatusById(newStatusId);
    if (!status) {
      throw new AppError('Status not found', 404);
    }
    const updatePayload: any = { [config.statusField]: newStatusId };

    // Update workflow step field when module uses dynamic workflow (workflowStatusField)
    // Explicitly handle null values for workflow_status clearing (e.g., on final rejection)
    if (config.workflowStatusField) {
      // Always set workflowStatusField if nextWorkflowId is defined (including null)
      // null explicitly clears the workflow_status field
      if (nextWorkflowId !== undefined) {
        updatePayload[config.workflowStatusField] = nextWorkflowId; // Can be null to clear workflow_status
        logger.info('Updating workflow step field', {
          field: config.workflowStatusField,
          workflowStatusId: nextWorkflowId,
          action,
          moduleName,
          isNull: nextWorkflowId === null,
          willClear: nextWorkflowId === null
        });
      } else {
        // If nextWorkflowId is undefined, don't update the field (keep existing value)
        logger.info('Skipping workflow step field update - nextWorkflowId is undefined', {
          field: config.workflowStatusField,
          action,
          moduleName
        });
      }
    }

    // Persist assigned user on entity when assignedToUserField is configured
    if (config.assignedToUserField) {
      const normalizedAssignedToIds = normalizeAssignedToUserIds(assigned_to);
      if ((action === 'approve' || action === 'reject') && normalizedAssignedToIds.length > 0) {
        // Keep DB compatibility: assigned_to_user_id is a single user id column.
        updatePayload[config.assignedToUserField] = normalizedAssignedToIds[0];
      } else if (
        (action === 'back' || action === 'reject') &&
        notifResult.assignedToUserIds?.length
      ) {
        updatePayload[config.assignedToUserField] = notifResult.assignedToUserIds[0];
        logger.info('Workflow return: updating assigned_to_user_id', {
          action,
          assigned_to_user_id: notifResult.assignedToUserIds[0]
        });
      } else {
        // Clear when no assigned_to on approve/reject or back without resolved user
        updatePayload[config.assignedToUserField] = null;
      }
    }

    if (config.statusChangedByField) updatePayload[config.statusChangedByField] = userId;
    if (config.statusChangedAtField) updatePayload[config.statusChangedAtField] = new Date();

    // Persist workflow-uploaded media ids on society registration so GET /societies/:id and previous-doc merge always see them.
    if (moduleName === 'SOCIETY_REGISTRATION' && documents && typeof documents === 'object') {
      const d = documents as Record<string, unknown>;
      const inspectionId =
        pickWorkflowDocumentMediaId(d.site_inspection_report) ||
        pickWorkflowDocumentMediaId(d.inspection_report);
      if (inspectionId) {
        updatePayload.site_inspection_report = inspectionId;
      }
      const nonFamilyId = pickWorkflowDocumentMediaId(d.non_family_coop_certificate);
      if (nonFamilyId) {
        updatePayload.non_family_coop_certificate = nonFamilyId;
      }
    }

    // JICS/SICS uploads renewal_certificate at step 3 — always store latest media URL for DRCS stamping.
    if (
      moduleName === 'SOCIETY_RENEWAL' &&
      action === 'approve' &&
      !shouldGenerateRenewalCertificate &&
      documents &&
      typeof documents === 'object'
    ) {
      const pendingCertMediaId = pickWorkflowDocumentMediaId(
        (documents as Record<string, unknown>).renewal_certificate
      );
      if (pendingCertMediaId) {
        const media = await Media.findByPk(pendingCertMediaId, {
          attributes: ['id', 'url'],
          transaction,
        });
        if (media?.url) {
          updatePayload.renewal_certificate_url = media.url;
        }
      }
    }

    // Issue renewal certificate at DRCS/ARCS final approval (sequence 4).
    if (
      moduleName === 'SOCIETY_RENEWAL' &&
      action === 'approve' &&
      shouldGenerateRenewalCertificate
    ) {
      try {
        const societyRegId = entity.get ? entity.get('society_id') : entity.society_id;
        const docs = documents as Record<string, unknown> | undefined;
        let sourceMediaId = pickWorkflowDocumentMediaId(docs?.renewal_certificate);

        if (!sourceMediaId) {
          try {
            const mergedDocs = await getLatestCommentDocuments(resourceId, 'SOCIETY_RENEWAL');
            sourceMediaId =
              mergedDocs.find((d) => d.key === 'renewal_certificate')?.mediaId ?? null;
          } catch (mergeErr: any) {
            logger.warn('SOCIETY_RENEWAL: failed to resolve renewal_certificate from workflow comments', {
              resourceId,
              error: mergeErr?.message,
            });
          }
        }

        if (!sourceMediaId) {
          sourceMediaId = await findRenewalCertificateMediaId(resourceId);
        }

        if (!sourceMediaId) {
          const existingUrl =
            (entity.get ? entity.get('renewal_certificate_url') : entity.renewal_certificate_url) ||
            updatePayload.renewal_certificate_url;
          if (existingUrl) {
            const mediaRow = await Media.findOne({
              where: { url: String(existingUrl), active: true },
              attributes: ['id'],
              transaction,
            });
            sourceMediaId = mediaRow?.id ?? null;
          }
        }

        if (sourceMediaId) {
          const issuance = await issueRenewalCertificateDocument(
            sourceMediaId,
            userId,
            societyRegId
          );
          if (issuance?.stamped) {
            updatePayload.renewal_certificate_url = issuance.issuedUrl;
            updatePayload.certificate_issue_date = new Date();
            shouldGenerateRenewalCertificate = false;
            logger.info('SOCIETY_RENEWAL: renewal certificate issued to applicant', {
              resourceId,
              societyRegId,
              issuedMediaId: issuance.issuedMediaId,
              stamped: true,
            });
          } else {
            logger.error('SOCIETY_RENEWAL: renewal certificate QR stamping failed for uploaded media', {
              resourceId,
              societyRegId,
              sourceMediaId,
              stamped: issuance?.stamped ?? false,
            });
            throw new AppError(
              'Failed to stamp QR on the uploaded renewal certificate. Ensure the uploaded certificate is present and reachable by the backend server.',
              500,
            );
          }
        } else {
          throw new AppError(
            'Uploaded renewal certificate is required before final approval. Please ask JICS/SICS to upload the renewal certificate and try again.',
            400,
          );
        }
      } catch (renewalCertIssueErr: any) {
        if (renewalCertIssueErr instanceof AppError) {
          throw renewalCertIssueErr;
        }
        logger.error('SOCIETY_RENEWAL: renewal certificate issuance failed', {
          resourceId,
          error: renewalCertIssueErr?.message,
        });
        throw new AppError(
          renewalCertIssueErr?.message || 'Failed to issue renewal certificate with QR code',
          500,
        );
      }
    }

    // Handle certificate generation for SOCIETY_CONVERSION at sequence 8 (certificate_issued status)
    // Check if we're approving at sequence 8 (last step) for conversion
    let shouldGenerateCertificate = false;
    if (moduleName === 'SOCIETY_CONVERSION' && currentWorkflow.sequence === 8 && action === 'approve') {
      // Check if the approval status is certificate_issued
      const certificateIssuedStatus = await findStatusByKey('certificate_issued');
      if (certificateIssuedStatus && currentWorkflow.approval_status_id === certificateIssuedStatus.id) {
        shouldGenerateCertificate = true;
      }
      // Also check if newStatusId is certificate_issued (in case workflow logic sets it)
      if (!shouldGenerateCertificate && certificateIssuedStatus && newStatusId === certificateIssuedStatus.id) {
        shouldGenerateCertificate = true;
      }
    }

    let storedIdentity: {
      convertedName: string | null;
      convertedAddress: string | null;
      originalName: string | null;
      originalAddress: string | null;
    } | null = null;

    if (shouldGenerateCertificate) {
      try {
        const {
          syncSocietyNameAndAddressFromConversion,
          snapshotOriginalSocietyIdentity,
          readStoredConversionIdentity,
        } = await import('./SocietyConversionService');
        const societyIdForIdentity = entity.get ? entity.get('society_id') : entity.society_id;
        const storedConversionData = entity.get ? entity.get('data') : entity.data;
        const identityPayload: { data: unknown } = { data: storedConversionData };
        if (societyIdForIdentity) {
          await snapshotOriginalSocietyIdentity(
            String(societyIdForIdentity),
            identityPayload,
            transaction
          );
          updatePayload.data = identityPayload.data;
          await syncSocietyNameAndAddressFromConversion(
            String(societyIdForIdentity),
            identityPayload,
            transaction
          );
        }
        storedIdentity = readStoredConversionIdentity(identityPayload.data);
      } catch (identityErr: unknown) {
        logger.error('Conversion approval: failed to update society name and address', {
          resourceId,
          error: identityErr instanceof Error ? identityErr.message : String(identityErr),
        });
        throw identityErr;
      }

      try {
        // Check if certificate already exists
        const existingCertificate = entity.get ? entity.get('certificate') : entity.certificate;
        if (existingCertificate) {
          logger.info('Certificate already exists for conversion, skipping generation', {
            resourceId,
            certificateId: existingCertificate
          });
        } else {
          // Get society_id from conversion entity
          const societyId = entity.get ? entity.get('society_id') : entity.society_id;
          if (!societyId) {
            throw new Error('Society ID not found in conversion entity');
          }

          // Fetch conversion details with sector information
          const conversionFromId = entity.get ? entity.get('conversion_from') : entity.conversion_from;
          const conversionToId = entity.get ? entity.get('conversion_to') : entity.conversion_to;
          const originalRegistrationNumber = entity.get ? entity.get('registration_number') : entity.registration_number;
          const conversionDate = entity.get ? entity.get('approval_date') : entity.approval_date;

          // Fetch sector names
          let conversionFromName: string | undefined;
          let conversionToName: string | undefined;

          if (conversionFromId) {
            const SectorOfOperation = sequelize.models.SectorOfOperation as any;
            if (SectorOfOperation) {
              const fromSector = await SectorOfOperation.findByPk(conversionFromId, {
                attributes: ['name'],
                transaction
              });
              conversionFromName = (fromSector as any)?.name;
            }
          }

          if (conversionToId) {
            const SectorOfOperation = sequelize.models.SectorOfOperation as any;
            if (SectorOfOperation) {
              const toSector = await SectorOfOperation.findByPk(conversionToId, {
                attributes: ['name'],
                transaction
              });
              conversionToName = (toSector as any)?.name;
            }
          }

          // Build conversion from/to text (society name + sector)
          // Format: "SIKIRIMA MULTIPURPOSE COOPERATIVE SOCIETY LTD" -> "SIKIRIMA LARGE SIZED MULTIPURPOSE COOPERATIVE SOCIETY LTD"
          // We need to construct the old and new society names
          const society = await SocietyRegistration.findByPk(societyId, {
            attributes: ['cooperative_society_name', 'registration_number'],
            transaction
          });

          const currentSocietyName = (society as any)?.cooperative_society_name || '';

          // For conversion certificate, we need:
          // conversionFrom: Original society name (before conversion)
          // conversionTo: New society name (after conversion - current name)
          // The current society name is the converted name, so we construct the original name
          let oldSocietyName = storedIdentity?.originalName || currentSocietyName;
          let newSocietyName = storedIdentity?.convertedName || currentSocietyName;

          // If we have sector names, construct the names
          if (!storedIdentity?.convertedName && conversionFromName && conversionToName) {
            // Extract base name by removing the current sector suffix
            let baseName = currentSocietyName;
            // Try to remove the "to" sector name to get base name
            if (currentSocietyName.includes(conversionToName)) {
              baseName = currentSocietyName.replace(new RegExp(`\\s*${conversionToName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), '').trim();
            }
            // Construct old name with "from" sector
            oldSocietyName = `${baseName} ${conversionFromName}`.trim();
            // New name is the current name (with "to" sector)
            newSocietyName = currentSocietyName;
          }

          // Use reusable function to generate and upload certificate
          const uploadedMedia = await generateAndUploadSocietyCertificate(
            societyId,
            userId,
            {
              certificateType: 'conversion',
              transaction,
              issuedBy: undefined, // Can be enhanced to fetch user details if needed
              conversionData: {
                conversionFrom: oldSocietyName,
                conversionTo: newSocietyName,
                conversionFromAddress: storedIdentity?.originalAddress || undefined,
                conversionToAddress: storedIdentity?.convertedAddress || undefined,
                originalRegistrationNumber: originalRegistrationNumber || undefined,
                conversionDate: conversionDate ? new Date(conversionDate).toLocaleDateString('en-GB') : undefined
              }
            }
          );

          // Update conversion with certificate media ID
          updatePayload.certificate = uploadedMedia.id;
          updatePayload.approval_date = new Date();

          logger.info('Conversion certificate generated and uploaded successfully', {
            resourceId,
            certificateMediaId: uploadedMedia.id,
            sequence: currentWorkflow.sequence
          });
        }
      } catch (certError: any) {
        logger.error('Error generating conversion certificate', {
          resourceId,
          error: certError?.message,
          sequence: currentWorkflow.sequence,
          stack: certError?.stack
        });
        // Don't fail the workflow update if certificate generation fails
        // But log it as a warning so it can be investigated
      }
    }

    const byeLawModuleKey = workflowModuleName || moduleName;
    const byeLawWorkflowConfig = BYE_LAW_WORKFLOW_MODULE_CONFIG[byeLawModuleKey];

    // JT RCS step: persist workflow-uploaded rcs_observations/bye_laws onto the module record.
    if (
      byeLawWorkflowConfig &&
      action === 'approve' &&
      currentWorkflow.sequence === byeLawWorkflowConfig.jtRcsSequence
    ) {
      try {
        const byeLawsMediaId = await resolveModuleByeLawsMediaId(
          String(referenceId),
          byeLawModuleKey,
          entity,
          documents as Record<string, unknown> | null,
        );
        if (byeLawsMediaId) {
          updatePayload.bye_laws = byeLawsMediaId;
          logger.info('Workflow bye_laws persisted from JT RCS upload', {
            moduleName: byeLawModuleKey,
            resourceId,
            byeLawsMediaId,
            sequence: currentWorkflow.sequence,
          });
        } else {
          logger.warn('JT RCS approval: bye_laws/rcs_observations media not found to persist', {
            moduleName: byeLawModuleKey,
            resourceId,
            sequence: currentWorkflow.sequence,
          });
        }
      } catch (jtByeLawErr: unknown) {
        logger.warn('JT RCS approval: failed to resolve bye_laws media', {
          moduleName: byeLawModuleKey,
          resourceId,
          sequence: currentWorkflow.sequence,
          error: jtByeLawErr instanceof Error ? jtByeLawErr.message : String(jtByeLawErr),
        });
      }
    }

    // RCS final approval: stamp bye_laws PDF with QR + SD-RCS authorized signatory.
    if (
      byeLawWorkflowConfig &&
      action === 'approve' &&
      currentWorkflow.sequence === byeLawWorkflowConfig.rcsFinalSequence
    ) {
      try {
        const societyRegId = await resolveModuleSocietyRegistrationId(entity, byeLawModuleKey);
        const sourceMediaId = await resolveModuleByeLawsMediaId(
          String(referenceId),
          byeLawModuleKey,
          entity,
          documents as Record<string, unknown> | null,
        );

        if (sourceMediaId) {
          const issuance = await issueModuleByeLawDocument(
            sourceMediaId,
            userId,
            societyRegId,
          );
          if (issuance?.stamped && issuance.issuedMediaId) {
            updatePayload.bye_laws = issuance.issuedMediaId;
            if (moduleName === 'SOCIETY_CONVERSION' && societyRegId) {
              await SocietyRegistration.update(
                { bye_laws: issuance.issuedMediaId },
                { where: { id: societyRegId }, transaction },
              );
            }
            logger.info('Module bye_laws updated with RCS-stamped document', {
              moduleName: byeLawModuleKey,
              resourceId,
              sourceMediaId,
              issuedMediaId: issuance.issuedMediaId,
            });
          } else if (issuance && !issuance.stamped) {
            logger.warn('Module bye_laws stamping did not complete on final RCS approval', {
              moduleName: byeLawModuleKey,
              resourceId,
              sourceMediaId,
            });
          }
        } else {
          logger.warn('Final RCS approval: no bye_laws media found to stamp', {
            moduleName: byeLawModuleKey,
            resourceId,
            sequence: currentWorkflow.sequence,
          });
        }

        if (byeLawModuleKey === 'AMENDMENT') {
          const issuedProposedId = await stampAmendmentProposedByelawIfNeeded(
            String(referenceId),
            userId,
            societyRegId,
          );
          if (issuedProposedId) {
            updatePayload.new_proposed_byelaw_media_id = issuedProposedId;
          }
        }
      } catch (byeLawIssueErr: unknown) {
        logger.error('Module bye_laws issuance failed on final RCS approval', {
          moduleName: byeLawModuleKey,
          resourceId,
          error: byeLawIssueErr instanceof Error ? byeLawIssueErr.message : String(byeLawIssueErr),
        });
      }
    }

    // Final RCS approval: sign JT RCS uploads from every JT step, except other_documents, and store them.
    // RCS approves while `current` is still the previous step and `next` is the final step,
    // so the saved status is liquidation_approved before workflow_status reaches the final sequence.
    const isLiquidationModule =
      byeLawModuleKey === 'LIQUIDATION' || byeLawModuleKey === 'LIQUIDATION_RCS';
    const liquidationApprovalStatus =
      isLiquidationModule && action === 'approve' && newStatusId
        ? await findStatusById(newStatusId)
        : null;
    if (
      isLiquidationModule &&
      byeLawWorkflowConfig &&
      action === 'approve' &&
      (
        Number(currentWorkflow.sequence) === byeLawWorkflowConfig.rcsFinalSequence ||
        liquidationApprovalStatus?.key === 'liquidation_approved'
      )
    ) {
      try {
        const societyRegId = await resolveModuleSocietyRegistrationId(entity, byeLawModuleKey);
        const storedObservations = entity.get
          ? entity.get('liquidator_appointment_observations')
          : entity.liquidator_appointment_observations;
        const signedJtDocs = await issueLiquidationJtUploadsOnFinalApproval({
          moduleName: byeLawModuleKey,
          resourceId: String(referenceId),
          approverUserId: userId,
          societyRegistrationId: societyRegId,
          existingObservationsMediaId: storedObservations ? String(storedObservations) : null,
          existingByeLawsMediaId: updatePayload.bye_laws ? String(updatePayload.bye_laws) : null,
        });

        if (signedJtDocs.length > 0) {
          updatePayload.rcs_signed_documents = signedJtDocs;
          const signedObservations = signedJtDocs.find(
            (doc) => (doc.key === 'rcs_observations' || doc.key === 'bye_laws') && doc.stamped,
          );
          if (signedObservations && !updatePayload.bye_laws) {
            updatePayload.bye_laws = signedObservations.issuedMediaId;
          }
          if (!documents || typeof documents !== 'object' || Array.isArray(documents)) {
            documents = {};
          }
          for (const doc of signedJtDocs) {
            if (doc.issuedMediaId) {
              (documents as Record<string, string>)[doc.key] = doc.issuedMediaId;
            }
          }
          logger.info('Liquidation JT RCS documents signed on final RCS approval', {
            moduleName: byeLawModuleKey,
            resourceId,
            count: signedJtDocs.length,
            stamped: signedJtDocs.filter((doc) => doc.stamped).length,
          });
        }
      } catch (jtSignErr: unknown) {
        logger.error('Liquidation JT RCS document signing failed on final RCS approval', {
          moduleName: byeLawModuleKey,
          resourceId,
          error: jtSignErr instanceof Error ? jtSignErr.message : String(jtSignErr),
        });
      }
    }

    // Liquidator appointment: Jt. RCS uploads observations; RCS approval stamps QR + signature.
    const appointmentObservationsStep = LIQUIDATOR_APPOINTMENT_OBSERVATIONS_STEPS[byeLawModuleKey];
    if (appointmentObservationsStep && action === 'approve') {
      try {
        const uploadedMediaId = pickNamedWorkflowDocumentMediaId(
          documents,
          LIQUIDATOR_APPOINTMENT_OBSERVATIONS_KEY,
        );
        const storedMediaId = entity.get
          ? entity.get('liquidator_appointment_observations')
          : entity.liquidator_appointment_observations;

        if (
          currentWorkflow.sequence === appointmentObservationsStep.uploadSequence &&
          uploadedMediaId
        ) {
          updatePayload.liquidator_appointment_observations = uploadedMediaId;
        }

        if (currentWorkflow.sequence === appointmentObservationsStep.stampSequence) {
          let sourceMediaId = uploadedMediaId || (storedMediaId ? String(storedMediaId) : null);
          if (!sourceMediaId) {
            const previousDocs = await getLatestCommentDocuments(String(referenceId), byeLawModuleKey);
            sourceMediaId =
              previousDocs.find((doc) => doc.key === LIQUIDATOR_APPOINTMENT_OBSERVATIONS_KEY)?.mediaId ||
              null;
          }

          if (sourceMediaId) {
            const societyRegId = await resolveModuleSocietyRegistrationId(entity, byeLawModuleKey);
            const issuance = await issueModuleByeLawDocument(sourceMediaId, userId, societyRegId);
            updatePayload.liquidator_appointment_observations =
              issuance?.stamped && issuance.issuedMediaId ? issuance.issuedMediaId : sourceMediaId;
          }
        }
      } catch (appointmentObservationsErr: unknown) {
        logger.error('Liquidator appointment observations issuance failed', {
          moduleName: byeLawModuleKey,
          resourceId,
          sequence: currentWorkflow.sequence,
          error:
            appointmentObservationsErr instanceof Error
              ? appointmentObservationsErr.message
              : String(appointmentObservationsErr),
        });
      }
    }

    // AGM final RCS approval: issue JT RCS proceedings with QR + SD-RCS authorized signatory
    if (
      moduleName === 'AGM' &&
      action === 'approve' &&
      currentWorkflow.sequence === 8
    ) {
      try {
        const societyId = entity.get ? entity.get('society_id') : entity.society_id;
        const issuance = await issueAgmProceedingsDocument(
          String(referenceId),
          userId,
          societyId ? String(societyId) : null,
        );
        if (issuance?.issuedMediaId) {
          updatePayload.issued_proceedings_document_id = issuance.issuedMediaId;
        }
      } catch (agmProceedingsErr: any) {
        logger.error('AGM proceedings issuance failed on final RCS approval', {
          resourceId,
          error: agmProceedingsErr?.message,
          stack: agmProceedingsErr?.stack,
        });
      }
    }

    await entity.update(updatePayload, { transaction });

    // Final AGM/BOD/SGBM approval: sync elected members into My-Society members.
    // bod_members sync is AGM/BOD only (FK agm_id → general_body_meetings; SGBM is a different table).
    // Do not fail core workflow transition if sync fails (e.g. pending migration/schema mismatch).
    if (
      (moduleName === 'AGM' || moduleName === 'BOD' || moduleName === 'SGBM') &&
      action === 'approve' &&
      status?.key === 'approved'
    ) {
      if (moduleName === 'AGM' || moduleName === 'BOD') {
        try {
          await syncMeetingElectedMembersToBod(entity, userId, transaction);
        } catch (syncErr: any) {
          logger.warn(`${moduleName} approved but failed to sync elected BOD members`, {
            resourceId,
            error: syncErr?.message
          });
        }
      }
      try {
        await syncMeetingElectedMembersToMembersTable(entity, userId);
      } catch (syncErr: any) {
        logger.warn(`${moduleName} approved but failed to sync elected members into members table`, {
          resourceId,
          error: syncErr?.message
        });
      }
    }

    logger.info('Entity updated', {
      statusField: config.statusField,
      newStatusId,
      workflowStatusField: config.workflowStatusField ? updatePayload[config.workflowStatusField] ?? 'not updated' : 'n/a',
      moduleName
    });

    let workflowHistoryCommentLine = resolveEffectiveWorkflowHistoryComment(
      comments,
      moduleName,
      referenceId,
      resourceId,
      entity,
      action
    );
    let bypassSkippedRoleLabel: string | null = null;
    if (bypassSkippedStep) {
      const skippedRoles = await resolveWorkflowRolesFromColumn(bypassSkippedStep.allowed_role_id);
      const skippedRole = getPrimaryWorkflowRole(skippedRoles.roles);
      bypassSkippedRoleLabel =
        skippedRole?.description ||
        skippedRole?.name ||
        skippedRoles.roleNames.join(', ') ||
        `step ${bypassSkippedStep.sequence}`;
      const officerComment = comments && String(comments).trim() ? String(comments).trim() : '';
      workflowHistoryCommentLine = officerComment
        ? `Skipped ${bypassSkippedRoleLabel}. ${officerComment}`
        : `Skipped ${bypassSkippedRoleLabel}. ${workflowHistoryCommentLine}`;
    }

    // 6. History (same API stores every status change)
    let historyRecordId: string | undefined;
    try {
      const historyData: any = {
        resource: moduleName,
        type: historyType,
        reference_id: referenceId,
        created_by: userId,
        comments: workflowHistoryCommentLine
      };
      if (documents && typeof documents === 'object' && Object.keys(documents).length > 0) {
        historyData.data = { documents };
      }
      const history = await createHistory(historyData);
      historyRecordId = history.id;
    } catch (historyError) {
      logger.error('Failed to create history record:', historyError);
    }

    // 7. Create Activity with documents data
    let activityRecordId: string | undefined;
    try {
      // Get current workflow role for activity description
      const currentRoles = await resolveWorkflowRolesFromColumn(currentWorkflow.allowed_role_id);
      const currentRole = getPrimaryWorkflowRole(currentRoles.roles);
      const roleName =
        currentRoles.roleNames.length > 1
          ? currentRoles.roleNames.join(', ')
          : currentRole?.name || 'Unknown Role';

      const resourceDisplayName = buildResourceDisplayLabel(entity, moduleName);
      const activityTitleSuffix =
        String(moduleName || '')
          .trim()
          .toUpperCase()
          .replace(/\s+/g, '_') === 'SOCIETY_REGISTRATION'
          ? resourceDisplayName
          : moduleName;

      // Prepare activity data
      const activityData: any = {
        resourceId,
        resourceDisplayName,
        moduleName,
        action,
        workflowSequence: currentWorkflow.sequence,
        currentRole: roleName,
        newStatus: status.key,
        comments: comments && String(comments).trim() ? String(comments).trim() : null
      };

      if (bypassSkippedStep) {
        activityData.bypassed = true;
        activityData.skippedWorkflowId = bypassSkippedStep.id;
        activityData.skippedSequence = bypassSkippedStep.sequence;
        activityData.skippedRole = bypassSkippedRoleLabel;
      }

      // Add documents data if provided
      if (documents) {
        activityData.documents = documents;
      }

      // Add workflow transition info
      if (nextWorkflowId) {
        const nextWorkflowStep = await ModuleWorkflow.findByPk(nextWorkflowId, {
          include: [
            {
              model: Module,
              as: 'module',
              attributes: ['id', 'name', 'key', 'description'],
              required: false
            },
          ]
        });
        const nextRoles = await resolveWorkflowRolesFromColumn(nextWorkflowStep?.allowed_role_id);
        activityData.nextRole =
          nextRoles.roleNames.length > 1 ? nextRoles.roleNames.join(', ') : nextRoles.roles[0]?.name || null;
        activityData.nextWorkflowId = nextWorkflowId;
      }

      // Create activity
      const activity = await createActivity({
        title: `Workflow ${action.charAt(0).toUpperCase() + action.slice(1)} - ${activityTitleSuffix}`,
        description: bypassSkippedStep
          ? `${workflowHistoryCommentLine} (by ${roleName}; skipped ${bypassSkippedRoleLabel}).`
          : `${workflowHistoryCommentLine} (by ${roleName}).`,
        data: activityData,
        reference_id: referenceId,
        created_by: userId
      });

      if (activity) {
        activityRecordId = activity.id;
        logger.info('Activity created for workflow update', {
          activityId: activity.id,
          resourceId,
          moduleName,
          action,
          hasDocuments: !!documents
        });
      }
    } catch (activityError) {
      logger.error('Failed to create activity record:', activityError);
      // Don't fail the workflow update if activity creation fails
    }

    await transaction.commit();

    // Fetch assigned user (from assigned_to param or, for back action, from previous step resolved user)
    let assignedUser = null;
    const rawAssignedUserId =
      assigned_to ??
      ((action === 'back' || action === 'reject') && notifResult.assignedToUserIds?.length
        ? notifResult.assignedToUserIds[0]
        : null);
    const assignedUserId = Array.isArray(rawAssignedUserId)
      ? rawAssignedUserId[0]
      : rawAssignedUserId;
    if (assignedUserId) {
      try {
        const user = await User.findByPk(assignedUserId, {
          attributes: ['id', 'first_name', 'last_name', 'email']
        });
        if (user) {
          assignedUser = {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            full_name: user.getFullName()
          };
        }
      } catch (userError: any) {
        logger.warn('Failed to fetch assigned user', {
          assigned_to: assignedUserId,
          error: userError?.message
        });
      }
    }

    logger.info('Workflow status updated successfully', {
      resourceId,
      moduleName,
      action,
      newStatus: newStatusId,
      nextWorkflowId,
      userId,
      assigned_to
    });

    return {
      success: true,
      message: `Workflow ${action} completed successfully`,
      currentStatus: status.key,
      nextWorkflowId: nextWorkflowId || null,
      nextStatus: nextStatusId ? (await findStatusById(nextStatusId))?.key || null : null,
      notificationSent: notifResult.notificationSent,
      historyRecordId,
      activityRecordId: activityRecordId || undefined,
      assignedToRole: notifResult.assignedToRole || null,
      assignedToUserIds: notifResult.assignedToUserIds || [],
      assigned_user: assignedUser
    };
  } catch (error: any) {
    await transaction.rollback();
    const message = String(error?.message || '');
    const isLockTimeout = /Lock wait timeout exceeded/i.test(message);
    if (isLockTimeout && retryCount < 2) {
      logger.warn('Lock wait timeout during workflow update, retrying', {
        moduleName: params.moduleName,
        resourceId: params.resourceId ?? params.societyId,
        retryCount: retryCount + 1
      });
      return updateWorkflowStatus({ ...(params as any), __retryCount: retryCount + 1 } as any);
    }
    logger.error('Error updating workflow status:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error?.message || 'Failed to update workflow status', 500);
  }
};

/**
 * Get workflow status for any module (society registration, renewal, conversion, audit, etc.).
 * Returns current/next/previous step and assignedTo (role + user IDs for next action) for frontend.
 */
export const getWorkflowStatus = async (
  resourceId: string,
  moduleName: string,
  isHq: boolean = false
): Promise<{
  currentWorkflow: any;
  nextWorkflow: any;
  previousWorkflow: any;
  currentStatus: any;
  assignedToRole: { id: string; name: string } | null;
  /** Users who can act on the current step (allowed_role_id) */
  assignedToUserIds: string[];
  /** Role UUID(s) from current step module_workflows.assigned_to (single or pool) */
  assigneeRoleIds: string[];
  /** Resolved roles for assignee picker when approving */
  assigneeRoles: { id: string; name: string; description?: string }[];
  /** Users eligible to be selected as assignee (from assigneeRoleIds / assigned_to column) */
  assigneeUserIds: string[];
  /** Resolved assignee profiles for workflow forward picker (district-filtered) */
  assigneeUsers: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role?: { id: string; name: string; description?: string } | null;
  }>;
  total_workflowLevel: number;
  /** Persisted user ID assigned to this resource (from entity.assigned_to_user_id when configured) */
  assignedToUserId: string | null;
  /** Resolved assigned user details (when assignedToUserId is set) */
  assignedUser: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    full_name?: string;
  } | null;
  /** Workflow previous comment: picked from History (latest approval), so next assignee can see what came from the flow */
  previousComment: string | null;
  /** User who marked unavailable and caused return to assigner (when applicable) */
  unavailableAssignee: Awaited<ReturnType<typeof loadAssigneeProfileForWorkflow>> | null;
  /** True when UI should prompt assigner to pick a new assignee */
  pendingReassign: boolean;
  /** One-step forward skip target, when the current step's role may bypass. */
  nextBypass: any;
  /**
   * Forward skip when the officer is completing `next` (their role is on next, not current).
   * Skips the step after next and lands one step further.
   */
  nextStepBypass: any;
  /** One-step return skip target, when the current step's role may bypass. */
  previousBypass: any;
}> => {
  try {
    const normalizedModuleName = String(moduleName || '').trim().toUpperCase();
    const inspectionLookupName = INSPECTION_INQUIRY_MODULE_ALIASES.has(normalizedModuleName)
      ? 'INSPECTION_INQUIRY'
      : normalizedModuleName;
    logger.info('Getting workflow status', { resourceId, moduleName: normalizedModuleName, isHq });

    const { entity, config } = await getEntityByModule(inspectionLookupName, resourceId);
    const inspectionCtx = resolveInspectionInquiryWorkflowContext(normalizedModuleName, entity);
    // For LIQUIDATION / LIQUIDATION_RCS, derive isHq from stored is_applicant (0 = RCS flow = isHq true)
    let effectiveIsHq = isHq;
    if (normalizedModuleName === 'LIQUIDATION' || normalizedModuleName === 'LIQUIDATION_RCS') {
      const isApplicant = entity.get ? entity.get('is_applicant') : entity.is_applicant;
      effectiveIsHq = isApplicant === false;
    }
    if (inspectionCtx) {
      effectiveIsHq = inspectionCtx.effectiveIsHq;
    }
    const currentStatusId = entity.get ? entity.get(config.statusField) : entity[config.statusField];

    logger.info('Entity found', {
      entityId: entity.id,
      currentStatusId,
      statusField: config.statusField
    });

    // For LIQUIDATION / INSPECTION_INQUIRY RCS flows use *_RCS module for workflow steps
    const workflowModuleName =
      inspectionCtx?.workflowModuleName ??
      ((normalizedModuleName === 'LIQUIDATION' && effectiveIsHq)
        ? 'LIQUIDATION_RCS'
        : normalizedModuleName);
    const module = await findModuleByName(workflowModuleName);
    if (!module) {
      logger.error('Module not found', { moduleName: workflowModuleName });
      throw new AppError(`Module not found: ${workflowModuleName}`, 404);
    }

    logger.info('Module found', { moduleId: module.id, moduleKey: module.key });

    // Get current workflow step id if entity has workflowStatusField (dynamic workflow)
    const currentWorkflowStatusId = config.workflowStatusField
      ? (entity.get ? entity.get(config.workflowStatusField) : entity[config.workflowStatusField])
      : null;

    // Resolve current status key when workflow_status is null (needed to treat "back at sequence 1" as out-of-workflow)
    let currentStatusKey: string | null = null;
    if (currentStatusId) {
      try {
        const status = await findStatusById(currentStatusId);
        if (status) currentStatusKey = status.key;
      } catch (_) { }
    }

    // Check if workflow steps exist for this module
    // Distinct by sequence so HQ/non-HQ duplicates don't inflate the total.
    const workflowStepsCount = await ModuleWorkflow.count({
      where: {
        module_id: module.id,
        active: true
      },
      distinct: true,
      col: 'sequence'
    });

    logger.info('Workflow steps count', {
      moduleId: module.id,
      isHq: effectiveIsHq,
      count: workflowStepsCount,
      workflowStatusId: currentWorkflowStatusId
    });

    if (workflowStepsCount === 0) {
      throw new AppError(
        `No workflow steps found for module "${moduleName}". ` +
        `Please ensure workflow steps are seeded for this module.`,
        404
      );
    }

    // Priority: Use workflowStatusField (dynamic workflow) if available, otherwise match by status ID
    let currentWorkflow: ModuleWorkflow | null = null;
    if (currentWorkflowStatusId && config.workflowStatusField) {
      // Direct lookup by workflow step ID
      currentWorkflow = await ModuleWorkflow.findByPk(currentWorkflowStatusId, {
        include: [
          {
            model: Module,
            as: 'module',
            attributes: ['id', 'name', 'key', 'description'],
            required: false
          },
        ]
      });
      if (currentWorkflow && !currentWorkflow.active) {
        currentWorkflow = null;
      }
      if (
        currentWorkflow &&
        currentWorkflow.module_id !== module.id &&
        inspectionCtx
      ) {
        const remapped = await remapInspectionWorkflowStepToModule(
          currentWorkflow,
          module.id,
          effectiveIsHq
        );
        logger.warn('Remapped inspection workflow step to correct module', {
          resourceId,
          fromModuleId: currentWorkflow.module_id,
          toModuleId: module.id,
          sequence: currentWorkflow.sequence,
          remapped: !!remapped,
        });
        currentWorkflow = remapped;
      }
      if (currentWorkflow && currentWorkflow.module_id !== module.id) {
        currentWorkflow = null; // Invalid workflow step, fall back to status matching
      }
      logger.info('Using workflowStatusField in getWorkflowStatus', {
        field: config.workflowStatusField,
        workflowStatusId: currentWorkflowStatusId,
        found: !!currentWorkflow,
        sequence: currentWorkflow?.sequence
      });
    }

    // Out of workflow: workflow_status was explicitly cleared (e.g. back at sequence 1) and status is terminal
    const outOfWorkflow =
      config.workflowStatusField &&
      (currentWorkflowStatusId === null || currentWorkflowStatusId === undefined) &&
      (currentStatusKey === 'rejected' ||
        currentStatusKey === 'cancelled' ||
        (normalizedModuleName === 'SOCIETY_REGISTRATION' &&
          currentStatusKey === 'certificate_issued') ||
        (normalizedModuleName === 'SOCIETY_RENEWAL' &&
          currentStatusKey === 'renewal_certificate_issued'));

    // Fallback: match by status ID (skip when out-of-workflow so renewal/conversion etc. show nextWorkflow = null)
    if (!currentWorkflow && !outOfWorkflow) {
      currentWorkflow = await getCurrentWorkflowStep(module.id, currentStatusId, effectiveIsHq);
    }

    // If no workflow step found: return null workflows when out-of-workflow (back at seq 1), else throw
    if (!currentWorkflow) {
      if (outOfWorkflow) {
        logger.info('Workflow status cleared (out of workflow)', {
          moduleName,
          resourceId,
          currentStatusKey,
          workflowStatusField: config.workflowStatusField
        });
        const currentStatus = currentStatusId ? await findStatusById(currentStatusId) : null;
        let assignedToUserId: string | null = null;
        let assignedUser: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      full_name?: string;
      is_available?: boolean;
      unavailable_since?: Date | null;
      unavailable_until?: Date | null;
      unavailable_reason?: string | null;
    } | null = null;
        if (config.assignedToUserField) {
          assignedToUserId = (entity.get ? entity.get(config.assignedToUserField) : entity[config.assignedToUserField]) ?? null;
          if (assignedToUserId) {
            try {
              const user = await User.findByPk(assignedToUserId, { attributes: ['id', 'first_name', 'last_name', 'email'] });
              if (user) {
                assignedUser = {
                  id: user.id,
                  first_name: user.first_name,
                  last_name: user.last_name,
                  email: user.email,
                  full_name: (user as any).getFullName ? (user as any).getFullName() : undefined
                };
              }
            } catch (_) { }
          }
        }
        return {
          currentWorkflow: null,
          nextWorkflow: null,
          previousWorkflow: null,
          currentStatus,
          assignedToRole: null,
          assignedToUserIds: [],
          assigneeRoleIds: [],
          assigneeRoles: [],
          assigneeUserIds: [],
          assigneeUsers: [],
          assignedToUserId,
          assignedUser,
          unavailableAssignee: null,
          pendingReassign: false,
          total_workflowLevel: workflowStepsCount,
          nextBypass: null,
          nextStepBypass: null,
          previousBypass: null,
          previousComment: await getLatestWorkflowCommentFromHistory(
            String(entity.get ? entity.get(config.referenceIdField) : entity[config.referenceIdField] || entity.id),
            moduleName
          )
        };
      }

      const statusInfo = currentStatusId ? await findStatusById(currentStatusId) : null;

      // Get all available workflow steps for debugging (simple query)
      const allWorkflows = await ModuleWorkflow.findAll({
        where: {
          module_id: module.id,
          active: true,
          is_hq: effectiveIsHq
        },
        order: [['sequence', 'ASC']]
      });

      logger.error('Current workflow step not found', {
        moduleId: module.id,
        moduleName,
        currentStatusId,
        statusKey: statusInfo?.key || 'null',
        isHq: effectiveIsHq,
        availableWorkflows: allWorkflows.map(w => ({
          sequence: w.sequence,
          approval_status_id: w.approval_status_id
        }))
      });

      throw new AppError(
        `No workflow step found for status "${statusInfo?.key || currentStatusId || 'null'}" in module "${moduleName}". ` +
        `Available workflow steps: ${allWorkflows.map(w => `seq ${w.sequence} (status_id: ${w.approval_status_id})`).join(', ')}. ` +
        `Please ensure workflow steps are properly configured for this status.`,
        404
      );
    }

    // Load associations for currentWorkflow
    await currentWorkflow.reload({
      include: [
        {
          model: Module,
          as: 'module',
          attributes: ['id', 'name', 'key', 'description'],
          required: false
        },
        {
          model: Status,
          as: 'approvalStatus',
          attributes: ['id', 'key', 'title'],
          required: false
        },
        {
          model: Status,
          as: 'rejectStatus',
          attributes: ['id', 'key', 'title'],
          required: false
        }
      ]
    });

    let nextWorkflow = null;
    let previousWorkflow = null;
    let nextBypassWorkflow: ModuleWorkflow | null = null;
    let nextStepBypassWorkflow: ModuleWorkflow | null = null;
    let previousBypassWorkflow: ModuleWorkflow | null = null;
    let nextBypassSkipped: ModuleWorkflow | null = null;
    let nextStepBypassSkipped: ModuleWorkflow | null = null;
    let previousBypassSkipped: ModuleWorkflow | null = null;
    let assignedToRole: { id: string; name: string } | null = null;
    let assignedToUserIds: string[] = [];
    let assigneeRoleIds: string[] = [];
    let assigneeRoles: { id: string; name: string; description?: string }[] = [];
    let assigneeUserIds: string[] = [];
    let assignedToUserId: string | null = null;
    let assignedUser: Awaited<ReturnType<typeof loadAssigneeProfileForWorkflow>> | null = null;

    // Persisted assigned user from entity (when configured)
    if (config.assignedToUserField) {
      const persistedId = entity.get ? entity.get(config.assignedToUserField) : entity[config.assignedToUserField];
      if (persistedId) {
        assignedToUserId = persistedId;
        try {
          assignedUser = await loadAssigneeProfileForWorkflow(persistedId);
        } catch (e) {
          logger.warn('Failed to load assigned user for getWorkflowStatus', { assignedToUserId: persistedId });
        }
      }
    }

    // Get current status (rejected or not) for response
    const currentStatus = currentStatusId ? await findStatusById(currentStatusId) : null;

    // Always show next and previous from current workflow step so user can approve (move to next) or back (move to previous) even when status is rejected
    if (currentWorkflow) {
      // Use current workflow's is_hq value to find next/previous steps (getNextWorkflowStep/getPreviousWorkflowStep will try both if needed)
      const currentIsHq = currentWorkflow.is_hq ?? effectiveIsHq;

      nextWorkflow = await getNextWorkflowStep(module.id, currentWorkflow.sequence, currentIsHq);
      previousWorkflow = await getPreviousWorkflowStep(module.id, currentWorkflow.sequence, currentIsHq);

      if (await currentStepCanBypass(currentWorkflow, 'forward') && nextWorkflow) {
        const landing = await getNextWorkflowStep(
          module.id,
          nextWorkflow.sequence,
          nextWorkflow.is_hq
        );
        if (landing && !(await isBypassLandingBlocked(landing))) {
          nextBypassWorkflow = landing;
          nextBypassSkipped = nextWorkflow;
        }
      }

      if (nextWorkflow && (await currentStepCanBypass(nextWorkflow, 'forward'))) {
        const skippedAfterNext = await getNextWorkflowStep(
          module.id,
          nextWorkflow.sequence,
          nextWorkflow.is_hq
        );
        if (skippedAfterNext) {
          const landingAfterNext = await getNextWorkflowStep(
            module.id,
            skippedAfterNext.sequence,
            skippedAfterNext.is_hq
          );
          if (landingAfterNext && !(await isBypassLandingBlocked(landingAfterNext))) {
            nextStepBypassWorkflow = landingAfterNext;
            nextStepBypassSkipped = skippedAfterNext;
          }
        }
      }

      if (await currentStepCanBypass(currentWorkflow, 'reverse') && previousWorkflow) {
        let normalReturn: ModuleWorkflow | null = previousWorkflow;
        if (normalizedModuleName === 'SOCIETY_REGISTRATION') {
          const referenceId = String(
            (entity.get ? entity.get(config.referenceIdField) : entity[config.referenceIdField]) ||
              (entity.get ? entity.get('id') : entity.id)
          );
          const returnOverride = await resolveSocietyRegistrationRcsReturnOverride(
            module.id,
            currentWorkflow,
            currentWorkflow.id,
            referenceId,
            entity,
            config.statusChangedByField
          );
          if (returnOverride?.notifyApplicantForChallanReupload) {
            normalReturn = null;
          } else if (returnOverride?.rejectWorkflowStep) {
            normalReturn = returnOverride.rejectWorkflowStep;
          }
        }
        if (normalReturn) {
          const landing = await getPreviousWorkflowStep(
            module.id,
            normalReturn.sequence,
            normalReturn.is_hq
          );
          if (landing && !(await isBypassLandingBlocked(landing))) {
            previousBypassWorkflow = landing;
            previousBypassSkipped = normalReturn;
          }
        }
      }

      let districtId = config.districtField
        ? (entity.get ? entity.get(config.districtField) : entity[config.districtField])
        : undefined;
      const stateId = config.stateField
        ? (entity.get ? entity.get(config.stateField) : entity[config.stateField])
        : undefined;
      if (!districtId) {
        const societyId = entity.get ? entity.get('society_id') : entity.society_id;
        if (societyId) {
          try {
            const societyReg = await SocietyRegistration.findByPk(societyId, {
              attributes: ['district_id'],
            });
            districtId = societyReg?.district_id ?? districtId;
          } catch (societyDistrictErr: any) {
            logger.warn('Failed to resolve society district for workflow assignee picker', {
              resourceId,
              moduleName: normalizedModuleName,
              societyId,
              error: societyDistrictErr?.message,
            });
          }
        }
      }

      // Who can act on the current step (allowed_role_id — single UUID or JSON role pool)
      const actorPool = await getEligibleUsersForWorkflowRoleColumn(
        currentWorkflow.allowed_role_id,
        undefined,
        districtId,
        stateId
      );
      const primaryActor = getPrimaryWorkflowRole(actorPool.roles);
      if (primaryActor) {
        assignedToRole = { id: primaryActor.id, name: primaryActor.name };
        assignedToUserIds = actorPool.userIds;
      }

      // Assignee picker: use the current step's assigned_to when the acting step requires
      // picking a single assignee on forward (e.g. DRCS at step 2 → IO pool). Only fall
      // back to the next step when the current step does not assign on forward.
      const nextAllowedIds = nextWorkflow
        ? parseWorkflowRoleIds(nextWorkflow.get ? nextWorkflow.get('allowed_role_id') : nextWorkflow.allowed_role_id)
        : [];
      const currentApprovalSendTo = String(
        currentWorkflow.get
          ? currentWorkflow.get('approval_send_to')
          : currentWorkflow.approval_send_to || ''
      ).toLowerCase();
      const currentAssignedTo = currentWorkflow.get
        ? currentWorkflow.get('assigned_to')
        : currentWorkflow.assigned_to;
      const nextApprovalSendTo = nextWorkflow
        ? String(
            nextWorkflow.get
              ? nextWorkflow.get('approval_send_to')
              : nextWorkflow.approval_send_to || ''
          ).toLowerCase()
        : '';
      const assigneeSourceWorkflow =
        currentApprovalSendTo === 'single' && currentAssignedTo
          ? currentWorkflow
          : nextWorkflow && nextApprovalSendTo === 'single'
            ? nextWorkflow
            : currentWorkflow;
      const assigneeFallbackRoleId =
        parseWorkflowRoleIds(
          assigneeSourceWorkflow.get
            ? assigneeSourceWorkflow.get('allowed_role_id')
            : assigneeSourceWorkflow.allowed_role_id
        )[0] || nextAllowedIds[0];
      const assigneePool = await getEligibleUsersForWorkflowRoleColumn(
        assigneeSourceWorkflow.assigned_to,
        assigneeFallbackRoleId,
        districtId,
        stateId
      );
      assigneeRoleIds = assigneePool.roleIds;
      assigneeRoles = assigneePool.roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description
      }));
      assigneeUserIds = assigneePool.userIds;
    }

    let assigneeUsers: Array<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      role?: { id: string; name: string; description?: string } | null;
    }> = [];
    if (assigneeUserIds.length > 0) {
      const users = await User.findAll({
        where: { id: { [Op.in]: assigneeUserIds }, is_active: true },
        attributes: ['id', 'first_name', 'last_name', 'email'],
        include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description'] }],
      });
      assigneeUsers = users.map((u) => {
        const json = u.toJSON() as any;
        return {
          id: json.id,
          first_name: json.first_name,
          last_name: json.last_name,
          email: json.email,
          role: json.role ?? null,
        };
      });
    }

    // Workflow previous comment: pick from History so next assignee sees what came from previous step
    const referenceIdForHistory = String(
      (entity.get ? entity.get(config.referenceIdField) : entity[config.referenceIdField]) ||
      (entity.get ? entity.get('id') : entity.id)
    );
    const previousComment = await getLatestWorkflowCommentFromHistory(referenceIdForHistory, moduleName);

    // When assignee marked unavailable, application is returned to original assigner (status_changed_by).
    let unavailableAssignee: Awaited<ReturnType<typeof loadAssigneeProfileForWorkflow>> | null = null;

    if (
      config.statusChangedByField &&
      assignedToUserId &&
      config.assignedToUserField
    ) {
      const originalAssignerId = entity.get
        ? entity.get(config.statusChangedByField)
        : entity[config.statusChangedByField];
      if (originalAssignerId && String(assignedToUserId) === String(originalAssignerId)) {
        const referenceId = String(
          (entity.get ? entity.get(config.referenceIdField) : entity[config.referenceIdField]) ||
            (entity.get ? entity.get('id') : entity.id)
        );
        const returnRow = await ApplicationAssignment.findOne({
          where: {
            module_name: normalizedModuleName,
            resource_id: referenceId,
            action_type: 'returned_on_unavailable',
            new_assignee_id: originalAssignerId
          },
          order: [['created_at', 'DESC']]
        });
        if (returnRow?.previous_assignee_id) {
          try {
            unavailableAssignee = await loadAssigneeProfileForWorkflow(
              returnRow.previous_assignee_id
            );
          } catch (e) {
            logger.warn('Failed to load unavailable assignee for workflow status', {
              userId: returnRow.previous_assignee_id
            });
          }
        }
      }
    }

    const enrichWorkflowStep = async (workflow: ModuleWorkflow | null) => {
      if (!workflow) return null;
      const json = (workflow.toJSON ? workflow.toJSON() : workflow) as Record<string, any>;
      const allowedIds = parseWorkflowRoleIds(json.allowed_role_id);
      const rejectIds = parseWorkflowRoleIds(json.reject_role_id);
      const assigneeIds = parseWorkflowRoleIds(json.assigned_to);
      const [allowedRoles, rejectRoles, assignedToRoles] = await Promise.all([
        allowedIds.length
          ? Role.findAll({ where: { id: { [Op.in]: allowedIds }, is_active: true }, attributes: ['id', 'name', 'description'] })
          : [],
        rejectIds.length
          ? Role.findAll({ where: { id: { [Op.in]: rejectIds }, is_active: true }, attributes: ['id', 'name', 'description'] })
          : [],
        assigneeIds.length
          ? Role.findAll({ where: { id: { [Op.in]: assigneeIds }, is_active: true }, attributes: ['id', 'name', 'description'] })
          : [],
      ]);
      return {
        ...json,
        approvalStatus: json.approvalStatus ?? null,
        rejectStatus: json.rejectStatus ?? null,
        allowedRoleIds: allowedIds,
        allowedRoles: allowedRoles.map((r) => ({ id: r.id, name: r.name, description: r.description })),
        allowedRole: allowedRoles[0] ? { id: allowedRoles[0].id, name: allowedRoles[0].name, description: allowedRoles[0].description } : null,
        rejectRoleIds: rejectIds,
        rejectRoles: rejectRoles.map((r) => ({ id: r.id, name: r.name, description: r.description })),
        rejectRole: rejectRoles[0] ? { id: rejectRoles[0].id, name: rejectRoles[0].name, description: rejectRoles[0].description } : null,
        assigneeRoleIds: assigneeIds,
        assignedToRoles: assignedToRoles.map((r) => ({ id: r.id, name: r.name, description: r.description })),
        assignedToRole: assignedToRoles[0]
          ? { id: assignedToRoles[0].id, name: assignedToRoles[0].name, description: assignedToRoles[0].description }
          : null,
        total_workflowLevel: workflowStepsCount
      };
    };

    const withSkippedRole = async (
      landing: ModuleWorkflow | null,
      skipped: ModuleWorkflow | null
    ) => {
      if (!landing || !skipped) return null;
      const enriched = await enrichWorkflowStep(landing);
      const skippedRoles = await resolveWorkflowRolesFromColumn(skipped.allowed_role_id);
      const skippedRole = getPrimaryWorkflowRole(skippedRoles.roles);
      return {
        ...enriched,
        skippedRoleLabel:
          skippedRole?.description ||
          skippedRole?.name ||
          skippedRoles.roleNames.join(', ') ||
          null
      };
    };

    return {
      currentWorkflow: await enrichWorkflowStep(currentWorkflow),
      nextWorkflow: await enrichWorkflowStep(nextWorkflow),
      previousWorkflow: await enrichWorkflowStep(previousWorkflow),
      nextBypass: await withSkippedRole(nextBypassWorkflow, nextBypassSkipped),
      nextStepBypass: await withSkippedRole(nextStepBypassWorkflow, nextStepBypassSkipped),
      previousBypass: await withSkippedRole(previousBypassWorkflow, previousBypassSkipped),
      currentStatus: currentStatus,
      assignedToRole,
      assignedToUserIds,
      assigneeRoleIds,
      assigneeRoles,
      assigneeUserIds,
      assigneeUsers,
      assignedToUserId,
      assignedUser,
      unavailableAssignee,
      pendingReassign: !!unavailableAssignee,
      total_workflowLevel: workflowStepsCount,
      previousComment
    };
  } catch (error: any) {
    logger.error('Error getting workflow status:', {
      error: error?.message || String(error),
      stack: error?.stack,
      resourceId,
      moduleName,
      isHq
    });
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      `Failed to get workflow status: ${error?.message || String(error)}`,
      500
    );
  }
};

/** workflowStatus payload for entity detail APIs (frontend). */
export const formatWorkflowStatusForApi = (
  workflowStatus: Awaited<ReturnType<typeof getWorkflowStatus>>
) => ({
  current: workflowStatus.currentWorkflow,
  next: workflowStatus.nextWorkflow,
  previous: workflowStatus.previousWorkflow,
  nextBypass: workflowStatus.nextBypass ?? null,
  nextStepBypass: workflowStatus.nextStepBypass ?? null,
  previousBypass: workflowStatus.previousBypass ?? null,
  currentStatus: workflowStatus.currentStatus,
  assignedToRole: workflowStatus.assignedToRole,
  assignedToUserIds: workflowStatus.assignedToUserIds,
  assignedToUserId: workflowStatus.assignedToUserId ?? null,
  assignedUser: workflowStatus.assignedUser ?? null,
  assigneeRoleIds: workflowStatus.assigneeRoleIds ?? [],
  assigneeRoles: workflowStatus.assigneeRoles ?? [],
  assigneeUserIds: workflowStatus.assigneeUserIds ?? [],
  assigneeUsers: workflowStatus.assigneeUsers ?? [],
  unavailableAssignee: workflowStatus.unavailableAssignee ?? null,
  pendingReassign: workflowStatus.pendingReassign ?? false,
  previousComment: workflowStatus.previousComment ?? null,
  total_workflowLevel: workflowStatus.total_workflowLevel
});

// ============================================================================
// RETURN TO ASSIGNER when current assignee marks unavailable
// ============================================================================

/**
 * For every in-flight application assigned to `unavailableUserId`, move
 * assigned_to_user_id back to the original assigner (status_changed_by).
 */
export const returnAssignedApplicationsToAssigner = async (
  unavailableUserId: string
): Promise<{ count: number }> => {
  let count = 0;

  for (const [moduleName, config] of Object.entries(MODULE_ENTITY_CONFIG)) {
    if (!config.assignedToUserField || !config.statusChangedByField || !config.workflowStatusField) {
      continue;
    }

    const Model = sequelize.models[config.modelName] as any;
    if (!Model) continue;

    const entities = await Model.findAll({
      where: {
        [config.assignedToUserField]: unavailableUserId,
        [config.workflowStatusField]: { [Op.ne]: null }
      }
    });

    for (const entity of entities) {
      const assignerId = entity.get
        ? entity.get(config.statusChangedByField)
        : entity[config.statusChangedByField];
      if (!assignerId || String(assignerId) === String(unavailableUserId)) {
        continue;
      }

      const entityId = entity.get ? entity.get('id') : entity.id;
      const workflowStatusId = entity.get
        ? entity.get(config.workflowStatusField)
        : entity[config.workflowStatusField];

      await entity.update({
        [config.assignedToUserField]: assignerId,
        ...(config.statusChangedAtField
          ? { [config.statusChangedAtField]: new Date() }
          : {})
      });

      await ApplicationAssignment.create({
        module_name: moduleName.toUpperCase(),
        resource_id: String(entityId),
        workflow_status_id: workflowStatusId ?? null,
        previous_assignee_id: unavailableUserId,
        new_assignee_id: assignerId,
        assigned_by: unavailableUserId,
        action_type: 'returned_on_unavailable',
        reason: 'Assignee marked unavailable — application returned to original assigner'
      });

      count += 1;

      try {
        const assigner = await User.findByPk(assignerId, {
          attributes: ['id', 'email', 'first_name']
        });
        if (assigner?.email) {
          await sendNotificationEmail(
            assigner.email,
            'Application returned — assignee unavailable',
            `An application you assigned is back in your queue because the assigned officer is now unavailable. Please open the application and use Reassign to forward it to another officer.`
          );
        }
      } catch (notifyErr) {
        logger.warn('Failed to notify assigner after return-on-unavailable', {
          assignerId,
          moduleName,
          entityId
        });
      }
    }
  }

  if (count > 0) {
    logger.info('Returned applications to original assigners (assignee unavailable)', {
      unavailableUserId,
      count
    });
  }

  return { count };
};

/**
 * When an officer is available again, put files that were only parked on the
 * original assigner (returned_on_unavailable) back on that officer's desk —
 * unless they were already reassigned to someone else.
 */
export const restoreApplicationsToAvailableOfficer = async (
  availableUserId: string
): Promise<{ count: number }> => {
  const returnRows = await ApplicationAssignment.findAll({
    where: {
      previous_assignee_id: availableUserId,
      action_type: 'returned_on_unavailable',
    },
    order: [['created_at', 'DESC']],
  });

  const seen = new Set<string>();
  let count = 0;

  for (const row of returnRows) {
    const moduleName = String(row.module_name || '').toUpperCase();
    const resourceId = String(row.resource_id || '');
    const key = `${moduleName}:${resourceId}`;
    if (!resourceId || seen.has(key)) continue;
    seen.add(key);

    const latest = await ApplicationAssignment.findOne({
      where: { module_name: row.module_name, resource_id: resourceId },
      order: [['created_at', 'DESC']],
    });
    if (
      !latest ||
      latest.action_type !== 'returned_on_unavailable' ||
      String(latest.previous_assignee_id) !== String(availableUserId)
    ) {
      continue;
    }

    const config = MODULE_ENTITY_CONFIG[moduleName];
    if (!config?.assignedToUserField) continue;

    const Model = sequelize.models[config.modelName] as any;
    if (!Model) continue;

    const entity = await Model.findOne({
      where: { [config.findField]: resourceId },
    });
    if (!entity) continue;

    const currentAssigneeId = entity.get
      ? entity.get(config.assignedToUserField)
      : entity[config.assignedToUserField];
    if (String(currentAssigneeId) !== String(latest.new_assignee_id)) {
      continue;
    }

    await entity.update({
      [config.assignedToUserField]: availableUserId,
      ...(config.statusChangedAtField
        ? { [config.statusChangedAtField]: new Date() }
        : {}),
    });

    await ApplicationAssignment.create({
      module_name: moduleName,
      resource_id: resourceId,
      workflow_status_id: latest.workflow_status_id ?? null,
      previous_assignee_id: latest.new_assignee_id,
      new_assignee_id: availableUserId,
      assigned_by: availableUserId,
      action_type: 'workflow_assign',
      reason: 'Assignee marked available — application restored to original officer',
    });

    count += 1;
  }

  if (count > 0) {
    logger.info('Restored applications to officer after they became available', {
      availableUserId,
      count,
    });
  }

  return { count };
};

// ============================================================================
// REASSIGN WORKFLOW (manual takeback + reassign when current assignee unavailable)
// ============================================================================

export interface IReassignWorkflowParams {
  resourceId: string;
  moduleName: string;
  newAssigneeUserId: string;
  reason: string;
  callerId: string;
}

export interface IReassignWorkflowResult {
  success: boolean;
  message: string;
  resourceId: string;
  moduleName: string;
  previousAssigneeId: string | null;
  newAssigneeId: string;
  workflowStatusId: string | null;
  assignmentHistoryId: string;
}

/**
 * Reassign a workflow resource (e.g. society registration) from its currently-assigned user
 * to a new user, when the current assignee is unavailable.
 *
 * Strict rules enforced (per product requirement):
 *   1. Caller MUST be the user who originally assigned the resource to the current assignee
 *      (i.e. the user recorded in entity.status_changed_by — the previous-step approver).
 *   2. Current assignee MUST be effectively unavailable
 *      (is_active === false  OR  is_available === false after auto-expire check).
 *   3. New assignee MUST be: active + available + same role as the unavailable officer
 *      + (when module has districtField) same district as the resource.
 *   4. Resource must currently be inside an active workflow step (workflow_status set, status not terminal).
 *
 * The workflow STEP itself does not advance — only assigned_to_user_id changes.
 * Full audit row written to application_assignments.
 */
export const reassignWorkflow = async (
  params: IReassignWorkflowParams
): Promise<IReassignWorkflowResult> => {
  const { resourceId, moduleName, newAssigneeUserId, reason, callerId } = params;

  if (!resourceId) throw new AppError('resourceId is required', 400);
  if (!moduleName) throw new AppError('moduleName is required', 400);
  if (!newAssigneeUserId) throw new AppError('newAssigneeUserId is required', 400);
  if (!reason || !reason.trim()) throw new AppError('reason is required for reassignment', 400);
  if (!callerId) throw new AppError('Authenticated user not found', 401);

  const normalizedModuleName = String(moduleName).trim().toUpperCase();
  const config = MODULE_ENTITY_CONFIG[normalizedModuleName];
  if (!config) {
    throw new AppError(`Workflow not configured for module: ${moduleName}`, 400);
  }
  if (!config.assignedToUserField) {
    throw new AppError(
      `Module ${moduleName} does not support per-user assignment (no assignedToUserField configured).`,
      400
    );
  }
  if (!config.workflowStatusField) {
    throw new AppError(
      `Module ${moduleName} does not support reassign (no dynamic workflow tracking).`,
      400
    );
  }

  const transaction = await sequelize.transaction();
  let committed = false;
  let oldAssigneeId: string | null = null;
  let workflowStatusId: string | null = null;
  let assignmentHistoryId = '';

  try {
    const { entity } = await getEntityByModule(normalizedModuleName, resourceId, transaction);
    if (!entity) throw new AppError('Resource not found', 404);

    const Model = sequelize.models[config.modelName] as any;
    const entityId = entity.get ? entity.get('id') : entity.id;

    // Row lock so concurrent reassign / approve calls serialize on this entity.
    const lockedEntity = await Model.findByPk(entityId, {
      transaction,
      lock: Transaction.LOCK.UPDATE
    });
    if (!lockedEntity) throw new AppError('Resource not found (after lock)', 404);

    workflowStatusId =
      (lockedEntity.get
        ? lockedEntity.get(config.workflowStatusField)
        : lockedEntity[config.workflowStatusField]) ?? null;

    if (!workflowStatusId) {
      throw new AppError(
        'Resource is not in an active workflow step (workflow_status is null). Reassignment not allowed.',
        400
      );
    }

    const currentStatusId =
      lockedEntity.get ? lockedEntity.get(config.statusField) : lockedEntity[config.statusField];
    if (currentStatusId) {
      const status = await findStatusById(currentStatusId);
      if (status && (status.key === 'approved' || status.key === 'rejected' || status.key === 'cancelled')) {
        throw new AppError(
          `Cannot reassign: resource is already in terminal status "${status.key}".`,
          400
        );
      }
    }

    const persistedAssigneeId =
      (lockedEntity.get
        ? lockedEntity.get(config.assignedToUserField)
        : lockedEntity[config.assignedToUserField]) ?? null;

    if (!persistedAssigneeId) {
      throw new AppError(
        'Resource has no currently assigned user. Use the approve flow to make an initial assignment.',
        400
      );
    }

    // --- Permission: caller must be the original assigner (status_changed_by) ---
    const originalAssignerId = config.statusChangedByField
      ? (lockedEntity.get
        ? lockedEntity.get(config.statusChangedByField)
        : lockedEntity[config.statusChangedByField])
      : null;

    if (!originalAssignerId) {
      throw new AppError(
        'Cannot determine original assigner for this resource. Reassignment not allowed.',
        403
      );
    }
    if (originalAssignerId !== callerId) {
      throw new AppError(
        'Only the user who originally assigned this application can reassign it.',
        403
      );
    }

    // Resolve who was on leave: either still assigned, or returned to assigner inbox.
    let oldAssigneeId = persistedAssigneeId;
    if (String(persistedAssigneeId) === String(originalAssignerId)) {
      const returnRow = await ApplicationAssignment.findOne({
        where: {
          module_name: normalizedModuleName,
          resource_id: entityId,
          action_type: 'returned_on_unavailable',
          new_assignee_id: originalAssignerId
        },
        order: [['created_at', 'DESC']],
        transaction
      });
      if (!returnRow?.previous_assignee_id) {
        throw new AppError(
          'No pending reassignment: application was not returned from an unavailable assignee.',
          400
        );
      }
      oldAssigneeId = returnRow.previous_assignee_id;
    }

    if (oldAssigneeId === newAssigneeUserId) {
      throw new AppError('New assignee is the same as the current assignee.', 400);
    }

    // --- Former / current assignee must be unavailable (after auto-expire check) ---
    const { user: currentAssignee, isAvailable: currentIsAvailable } =
      await ensureUserAvailability(oldAssigneeId);
    if (currentIsAvailable) {
      throw new AppError(
        `Assignee "${currentAssignee.email}" is still available. Reassignment is only permitted when they are unavailable.`,
        400
      );
    }

    // --- Validate new assignee ---
    const newAssignee = await User.findByPk(newAssigneeUserId);
    if (!newAssignee) throw new AppError('New assignee user not found', 404);
    if (newAssignee.is_active === false) {
      throw new AppError('New assignee is inactive.', 400);
    }
    const { isAvailable: newIsAvailable } = await ensureUserAvailability(newAssignee);
    if (!newIsAvailable) {
      throw new AppError('New assignee is also marked unavailable.', 400);
    }

    const currentWorkflow = await ModuleWorkflow.findByPk(workflowStatusId);
    if (!currentWorkflow) {
      throw new AppError('Current workflow step not found.', 500);
    }

    // --- Role check: new assignee must match the unavailable officer's role ---
    if (currentAssignee.role_id !== newAssignee.role_id) {
      throw new AppError(
        'New assignee must have the same role as the unavailable officer.',
        400
      );
    }

    // --- District check (when module is district-scoped) ---
    if (config.districtField) {
      const entityDistrictId =
        lockedEntity.get ? lockedEntity.get(config.districtField) : lockedEntity[config.districtField];
      if (entityDistrictId && newAssignee.district_id && newAssignee.district_id !== entityDistrictId) {
        throw new AppError(
          'New assignee belongs to a different district than the resource.',
          400
        );
      }
    }

    // --- Apply changes ---
    const updatePayload: Record<string, any> = {
      [config.assignedToUserField]: newAssigneeUserId
    };
    if (config.statusChangedAtField) {
      // Track the moment of reassignment without changing the workflow step.
      updatePayload[config.statusChangedAtField] = new Date();
    }
    if ('updated_by' in (Model.rawAttributes || {})) {
      updatePayload.updated_by = callerId;
    }

    await lockedEntity.update(updatePayload, { transaction });

    const assignmentRow = await ApplicationAssignment.create(
      {
        module_name: normalizedModuleName,
        resource_id: entityId,
        workflow_status_id: workflowStatusId,
        previous_assignee_id: oldAssigneeId,
        new_assignee_id: newAssigneeUserId,
        assigned_by: callerId,
        action_type: 'reassign',
        reason: reason.trim()
      },
      { transaction }
    );
    assignmentHistoryId = assignmentRow.id;

    await transaction.commit();
    committed = true;

    // --- Post-commit side effects (history, activity, notifications) ---
    const resourceTableName = (Model as any).tableName || config.modelName;
    const oldUserLabel = `${currentAssignee.first_name ?? ''} ${currentAssignee.last_name ?? ''}`.trim() || currentAssignee.email;
    const newUserLabel = `${newAssignee.first_name ?? ''} ${newAssignee.last_name ?? ''}`.trim() || newAssignee.email;

    try {
      await logOperation(
        resourceTableName,
        'reassign',
        entityId,
        callerId,
        `Reassigned from ${oldUserLabel} to ${newUserLabel}. Reason: ${reason.trim()}`
      );
    } catch (e) {
      logger.warn('logOperation failed after reassign', {
        moduleName: normalizedModuleName,
        resourceId: entityId,
        error: e instanceof Error ? e.message : String(e)
      });
    }

    try {
      await createActivity({
        title: 'Application Reassigned',
        description: `Application reassigned from ${oldUserLabel} to ${newUserLabel}`,
        data: {
          module_name: normalizedModuleName,
          resource_id: entityId,
          previous_assignee_id: oldAssigneeId,
          new_assignee_id: newAssigneeUserId,
          workflow_status_id: workflowStatusId,
          reason: reason.trim(),
          assigned_by: callerId
        },
        reference_id: entityId,
        created_by: callerId
      });
    } catch (e) {
      logger.warn('createActivity failed after reassign', {
        error: e instanceof Error ? e.message : String(e)
      });
    }

    const redirectPath = `${config.redirectPathPrefix || ''}/${entityId}`;

    try {
      await sendNotification([newAssigneeUserId], {
        title: 'New Application Assigned',
        description: `An application has been assigned to you (previous assignee was unavailable). Reason: ${reason.trim()}`,
        data: JSON.stringify({
          module_name: normalizedModuleName,
          resource_id: entityId,
          previous_assignee_id: oldAssigneeId,
          assigned_by: callerId,
          action_type: 'reassign'
        }),
        redirect_path: redirectPath,
        created_by: callerId
      });
    } catch (e) {
      logger.warn('Notification to new assignee failed', {
        error: e instanceof Error ? e.message : String(e)
      });
    }

    try {
      await sendNotification([oldAssigneeId], {
        title: 'Application Withdrawn',
        description: `An application previously assigned to you has been reassigned because you are currently unavailable.`,
        data: JSON.stringify({
          module_name: normalizedModuleName,
          resource_id: entityId,
          new_assignee_id: newAssigneeUserId,
          assigned_by: callerId,
          action_type: 'reassign'
        }),
        redirect_path: redirectPath,
        created_by: callerId
      });
    } catch (e) {
      // Old assignee may be inactive — that's fine, just log.
      logger.info('Withdraw notification to previous assignee skipped/failed', {
        previousAssigneeId: oldAssigneeId,
        error: e instanceof Error ? e.message : String(e)
      });
    }

    if (newAssignee.email) {
      try {
        await sendNotificationEmail(
          newAssignee.email,
          'New Application Assigned' as any,
          `An application has been reassigned to you because the previous assignee was unavailable. Reason: ${reason.trim()}`,
          redirectPath as any
        );
      } catch (e) {
        logger.warn('Email to new assignee failed', {
          error: e instanceof Error ? e.message : String(e)
        });
      }
    }

    return {
      success: true,
      message: 'Resource reassigned successfully',
      resourceId: entityId,
      moduleName: normalizedModuleName,
      previousAssigneeId: oldAssigneeId,
      newAssigneeId: newAssigneeUserId,
      workflowStatusId,
      assignmentHistoryId
    };
  } catch (error: any) {
    if (!committed) {
      try { await transaction.rollback(); } catch (_) { /* noop */ }
    }
    logger.error('Error in reassignWorkflow:', {
      message: error?.message,
      moduleName,
      resourceId,
      callerId
    });
    if (error instanceof AppError) throw error;
    throw new AppError(error?.message || 'Failed to reassign workflow resource', 500);
  }
};

/**
 * Get full assignment history for a resource (ordered newest-first).
 * Used by the application detail page to show who handled the application over time.
 */
export const getAssignmentHistory = async (
  moduleName: string,
  resourceId: string
) => {
  const normalizedModuleName = String(moduleName || '').trim().toUpperCase();
  if (!normalizedModuleName) throw new AppError('moduleName is required', 400);
  if (!resourceId) throw new AppError('resourceId is required', 400);

  const rows = await ApplicationAssignment.findAll({
    where: { module_name: normalizedModuleName, resource_id: resourceId },
    include: [
      {
        model: User,
        as: 'previousAssignee',
        attributes: ['id', 'first_name', 'last_name', 'email', 'is_available', 'is_active'],
        required: false
      },
      {
        model: User,
        as: 'newAssignee',
        attributes: ['id', 'first_name', 'last_name', 'email', 'is_available', 'is_active'],
        required: false
      },
      {
        model: User,
        as: 'assignedByUser',
        attributes: ['id', 'first_name', 'last_name', 'email'],
        required: false
      },
      {
        model: ModuleWorkflow,
        as: 'workflowStep',
        attributes: ['id', 'sequence', 'allowed_role_id'],
        required: false
      }
    ],
    order: [['created_at', 'DESC']]
  });

  return rows.map((r: any) => (r.toJSON ? r.toJSON() : r));
};
