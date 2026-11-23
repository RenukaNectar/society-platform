import Status from '../models/Status';
import User from '../models/user';
import Liquidation from '../models/Liquidation';
import ILiquidation from '../models/Liquidation';
import logger from '../utils/logger';
import { findStatusByKey } from './StatusService';
import SocietyRegistration from '../models/SocietyRegistration';
import { IRole } from '../types';
import { Op, Sequelize, QueryTypes } from 'sequelize';
import sequelize from '../config/sequelize';
import Media from '../models/Media';
import SocietyType from '../models/SocietyType';
import SectorOfOperation from '../models/SectorOfOperation';
import { getUsers, notifyRolesInDistrict, sendNotification } from './NotificationService';
import { NOTIFICATIONS } from '../config';
import { createActivity } from './ActiviesService';
import ModuleWorkflow from '../models/ModuleWorkflow';
import Module from '../models/Module';
import Role from '../models/Role';
import {
  formatWorkflowStatusForApi,
  getWorkflowStatus,
  getWorkflowIdByModuleAndSequence,
  parseWorkflowRoleIds
} from './WorkflowUtilService';
import NotificationTemplate from '../models/NotificationTemplate';
import { createHistory } from './HistoryService';
import { getLatestCommentDocuments, attachCompleteProcessingHistoryToDetail, extractDocumentMediaIds } from './WorkflowCommentService';
import { issueLiquidationJtUploadsOnFinalApproval, liquidationJtStepForRecordedSequence } from './ModuleByeLawDocumentService';
import Activity from '../models/Activity';

/** Terminal status keys: once reached, another liquidation can be started for the same society. */
const LIQUIDATION_TERMINAL_STATUS_KEYS = ['rejected', 'liquidation_approved', 'approved'];

const LIQUIDATION_DETAIL_INCLUDES = [
  {
    model: SocietyRegistration,
    as: 'society',
    attributes: ['id', 'district_id'],
  },
  {
    model: Status,
    as: 'statusObj',
    attributes: ['id', 'key', 'title'],
  },
  {
    model: SocietyType,
    as: 'societyType',
    attributes: ['id', 'title'],
  },
  {
    model: User,
    as: 'createdByUser',
    attributes: ['id', 'first_name', 'last_name', 'email'],
  },
  {
    model: ModuleWorkflow,
    as: 'workflowStatus',
    attributes: ['id', 'sequence', 'allowed_role_id', 'approval_status_id', 'reject_status_id', 'assigned_to'],
  },
  {
    model: User,
    as: 'assignedToUser',
    attributes: ['id', 'first_name', 'last_name', 'email'],
  },
  {
    model: Media,
    as: 'minutesMeetingMedia',
    attributes: ['id', 'url'],
  },
  {
    model: Media,
    as: 'attendanceSheetMedia',
    attributes: ['id', 'url'],
  },
  {
    model: Media,
    as: 'circularNoticeMedia',
    attributes: ['id', 'url'],
  },
  {
    model: Media,
    as: 'creditorsListMedia',
    attributes: ['id', 'url'],
  },
  {
    model: Media,
    as: 'membersListMedia',
    attributes: ['id', 'url'],
  },
  {
    model: Media,
    as: 'byeLawsMedia',
    attributes: ['id', 'url'],
    required: false,
  },
  {
    model: Media,
    as: 'liquidatorAppointmentObservationsMedia',
    attributes: ['id', 'url'],
    required: false,
  },
];

const SIGNED_DOCUMENT_LABELS: Record<string, string> = {
  liquidator_appointment_observations: 'RCS Observations for Liquidator Appointment',
  liquidator_appointment_request: 'Liquidator Appointment Request',
  liquidation_report: 'Liquidation Report',
  audit_report: 'Audit Report',
  rcs_observations: 'RCS Observations',
  bye_laws: 'RCS Observations',
};

type StoredSignedDocument = {
  key?: string;
  sequence?: number;
  sourceMediaId?: string;
  issuedMediaId?: string;
  stamped?: boolean;
};

function parseStoredSignedDocuments(raw: unknown): StoredSignedDocument[] {
  let value = raw;
  if (typeof value === 'string' && value.trim()) {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? (value as StoredSignedDocument[]) : [];
}

const APPLICANT_JT_RCS_SEQUENCES = [7, 9, 13, 15, 19];
const RCS_JT_RCS_SEQUENCES = [3, 5, 8, 10, 14, 16, 20];
const DETAIL_SKIPPED_DOCUMENT_KEYS = new Set(['other_documents', 'audit_report']);

const canonicalDetailDocumentKey = (key: string) =>
  key === 'bye_laws' ? 'rcs_observations' : key;

/** One row per document type and step. A signed copy replaces the unsigned upload. */
function dedupeDetailDocuments(documents: DetailJtDocument[]): DetailJtDocument[] {
  const indexBySlot = new Map<string, number>();
  const result: DetailJtDocument[] = [];
  for (const doc of documents) {
    const key = canonicalDetailDocumentKey(doc.key);
    if (DETAIL_SKIPPED_DOCUMENT_KEYS.has(key)) continue;
    const slot = key === 'liquidation_report' ? key : `${key}:${doc.sequence ?? ''}`;
    const normalized = { ...doc, key };
    const existingIndex = indexBySlot.get(slot);
    if (existingIndex == null) {
      indexBySlot.set(slot, result.length);
      result.push(normalized);
      continue;
    }
    const current = result[existingIndex];
    const incomingSeq = Number(normalized.sequence) || 0;
    const currentSeq = Number(current.sequence) || 0;
    const preferIncoming =
      (normalized.stamped && !current.stamped) ||
      (normalized.stamped === current.stamped && incomingSeq >= currentSeq);
    if (preferIncoming) {
      result[existingIndex] = normalized;
    }
  }
  return result;
}

function parseActivityPayload(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

type DetailJtDocument = {
  key: string;
  sequence: number | null;
  sourceMediaId: string;
  issuedMediaId: string;
  stamped: boolean;
};

async function collectJtRcsDetailDocuments(result: Record<string, unknown>): Promise<DetailJtDocument[]> {
  const resourceId = typeof result.id === 'string' ? result.id : '';
  if (!resourceId) return [];

  const isRcsFlow = result.is_applicant === false || result.is_applicant === 0 || result.is_applicant === '0';
  const sequences = isRcsFlow ? RCS_JT_RCS_SEQUENCES : APPLICANT_JT_RCS_SEQUENCES;
  const activities = await Activity.findAll({
    where: { reference_id: resourceId },
    order: [['created_at', 'ASC']],
  });

  const latestBySequence = new Map<number, Record<string, unknown>>();
  for (const activity of activities) {
    const data = parseActivityPayload((activity as { data?: unknown }).data);
    const moduleName = String(data.moduleName || '');
    if (moduleName !== 'LIQUIDATION' && moduleName !== 'LIQUIDATION_RCS') continue;
    if (String(data.action || '') !== 'approve') continue;
    const sequence = liquidationJtStepForRecordedSequence(Number(data.workflowSequence), sequences);
    if (sequence == null) continue;
    latestBySequence.set(sequence, data);
  }

  const documents: DetailJtDocument[] = [];
  for (const sequence of sequences) {
    const data = latestBySequence.get(sequence);
    if (!data?.documents) continue;
    for (const { key, mediaId } of extractDocumentMediaIds(data.documents)) {
      const sourceMediaId = mediaId?.trim();
      if (!sourceMediaId || DETAIL_SKIPPED_DOCUMENT_KEYS.has(key)) continue;
      documents.push({
        key,
        sequence,
        sourceMediaId,
        issuedMediaId: sourceMediaId,
        stamped: false,
      });
    }
  }

  const signed = parseStoredSignedDocuments(result.rcs_signed_documents);
  for (const doc of signed) {
    const key = String(doc.key || '');
    const sourceMediaId = typeof doc.sourceMediaId === 'string' ? doc.sourceMediaId.trim() : '';
    const issuedMediaId = typeof doc.issuedMediaId === 'string' ? doc.issuedMediaId.trim() : '';
    if (!key || !issuedMediaId || DETAIL_SKIPPED_DOCUMENT_KEYS.has(key)) continue;
    const sequence = Number(doc.sequence) || null;
    const existing = documents.find(
      (item) => item.key === key && item.sequence === sequence && (!sourceMediaId || item.sourceMediaId === sourceMediaId),
    );
    if (existing) {
      existing.issuedMediaId = issuedMediaId;
      existing.stamped = Boolean(doc.stamped);
      continue;
    }
    documents.push({
      key,
      sequence,
      sourceMediaId: sourceMediaId || issuedMediaId,
      issuedMediaId,
      stamped: Boolean(doc.stamped),
    });
  }

  const observationsMedia = result.liquidatorAppointmentObservationsMedia as { id?: string; url?: string } | undefined;
  const observationsId = typeof result.liquidator_appointment_observations === 'string'
    ? result.liquidator_appointment_observations
    : observationsMedia?.id;
  if (observationsId) {
    const existing = documents.find((doc) => doc.key === 'liquidator_appointment_observations');
    if (existing && existing.sourceMediaId !== observationsId) {
      existing.issuedMediaId = observationsId;
      existing.stamped = true;
    } else if (!existing) {
      documents.unshift({
        key: 'liquidator_appointment_observations',
        sequence: isRcsFlow ? 8 : 7,
        sourceMediaId: observationsId,
        issuedMediaId: observationsId,
        stamped: false,
      });
    }
  }

  const byeLawsMedia = result.byeLawsMedia as { id?: string; url?: string } | undefined;
  const byeLawsId = typeof result.bye_laws === 'string' ? result.bye_laws : byeLawsMedia?.id;
  if (byeLawsId) {
    const existing = documents.find((doc) => doc.key === 'rcs_observations' || doc.key === 'bye_laws');
    if (existing && existing.sourceMediaId !== byeLawsId) {
      existing.issuedMediaId = byeLawsId;
      existing.stamped = true;
    } else if (!existing) {
      documents.push({
        key: 'rcs_observations',
        sequence: isRcsFlow ? 20 : 19,
        sourceMediaId: byeLawsId,
        issuedMediaId: byeLawsId,
        stamped: false,
      });
    }
  }

  return dedupeDetailDocuments(documents);
}

async function attachRcsSignedDocuments(result: Record<string, unknown>): Promise<void> {
  const documents = await collectJtRcsDetailDocuments(result);
  const mediaIds = Array.from(new Set(documents.map((doc) => doc.issuedMediaId).filter(Boolean)));
  if (mediaIds.length === 0) {
    result.rcsSignedDocuments = [];
    return;
  }

  const mediaRows = await Media.findAll({
    where: { id: { [Op.in]: mediaIds }, active: true },
    attributes: ['id', 'url'],
  });
  const urlById = new Map<string, string>();
  for (const row of mediaRows) {
    if (row.id && row.url) urlById.set(row.id, row.url);
  }

  const knownUrls = new Map<string, string>();
  const observationsMedia = result.liquidatorAppointmentObservationsMedia as { id?: string; url?: string } | undefined;
  const byeLawsMedia = result.byeLawsMedia as { id?: string; url?: string } | undefined;
  if (observationsMedia?.id && observationsMedia.url) knownUrls.set(observationsMedia.id, observationsMedia.url);
  if (byeLawsMedia?.id && byeLawsMedia.url) knownUrls.set(byeLawsMedia.id, byeLawsMedia.url);

  result.rcsSignedDocuments = documents
    .map((doc) => {
      const url = urlById.get(doc.issuedMediaId) || knownUrls.get(doc.issuedMediaId) || '';
      if (!url) return null;
      const label = SIGNED_DOCUMENT_LABELS[doc.key] || doc.key.replace(/_/g, ' ');
      return {
        key: doc.key,
        sequence: doc.sequence,
        label,
        sourceMediaId: doc.sourceMediaId,
        issuedMediaId: doc.issuedMediaId,
        stamped: doc.stamped,
        url,
      };
    })
    .filter(Boolean);
}

/** Normalize detail payload: expose memberListMedia alias used by frontend. */
function formatLiquidationDetailResponse(result: Record<string, unknown>): Record<string, unknown> {
  if (result.membersListMedia != null && result.memberListMedia == null) {
    result.memberListMedia = result.membersListMedia;
  }
  return result;
}

/** society_type often stores a sector_of_operations id, which SocietyType cannot resolve. */
async function attachSocietyTypeTitle(result: Record<string, unknown>): Promise<void> {
  const current = result.societyType as { title?: string } | null | undefined;
  if (current?.title) return;
  const typeId = typeof result.society_type === 'string' ? result.society_type : '';
  if (!typeId) return;
  const sector = await SectorOfOperation.findByPk(typeId, { attributes: ['id', 'name'] });
  if (!sector?.name) return;
  result.societyType = { id: sector.id, title: sector.name };
}

/** HQ workflow roles are not scoped by district/state when resolving notification recipients. */
const HQ_WORKFLOW_ROLE_NAMES = new Set([
  'jics_sics_hq',
  'drcs_arcs_hq',
  'jt_rcs_hq',
  'rcs_hq',
  'jt_rcs_district',
  'rcs_district',
  // HQ-type users; workflow steps stay is_hq: false
  'jics_sics_liquidator',
  'jics_sics_auditor',
]);

const resolveWorkflowUserGeoFilter = (
  roleNames: string[],
  districtId?: string | null,
  stateId?: string | null
) => {
  const isHqRolePool = roleNames.every((name) => HQ_WORKFLOW_ROLE_NAMES.has(name));
  return {
    districtId: isHqRolePool ? undefined : districtId || undefined,
    stateId: isHqRolePool ? undefined : stateId || undefined,
  };
};

/**
 * Notify workflow seq-2 role after liquidation submit / resubmit (applicant → DRCS/ARCS district; RCS → DRCS/ARCS HQ).
 * Same pattern as Amendment / Election / Enquiry.
 */
async function notifyLiquidationSubmittedToNextRole(params: {
  liquidation: Liquidation;
  societyId: string;
  liquidationModuleKey: 'LIQUIDATION' | 'LIQUIDATION_RCS';
  isRcsFlow: boolean;
  createdBy?: string | null;
  logContext?: string;
  resubmit?: boolean;
}): Promise<void> {
  const {
    liquidation,
    societyId,
    liquidationModuleKey,
    isRcsFlow,
    createdBy,
    logContext = 'liquidation submit',
    resubmit = false,
  } = params;

  const society = await SocietyRegistration.findByPk(societyId);
  const districtId = society?.district_id || null;
  const stateId = society?.state_id || null;

  const liquidationModule = await Module.findOne({
    where: { key: liquidationModuleKey, active: true },
  });
  if (!liquidationModule) {
    logger.warn(`Liquidation ${logContext} notification skipped: module not found`, {
      liquidationModuleKey,
      liquidationId: liquidation.id,
    });
    return;
  }

  const currentStep = await ModuleWorkflow.findOne({
    where: {
      module_id: liquidationModule.id,
      sequence: 1,
      active: true,
      is_hq: isRcsFlow,
    },
  });
  const nextStep = await ModuleWorkflow.findOne({
    where: {
      module_id: liquidationModule.id,
      sequence: 2,
      active: true,
      is_hq: false,
    },
  });

  const nextRoleIds = parseWorkflowRoleIds(nextStep?.allowed_role_id);
  const nextRole = nextRoleIds.length
    ? await Role.findOne({
        where: { id: nextRoleIds[0], is_active: true },
        attributes: ['id', 'name'],
      })
    : null;
  const nextRoleName = nextRole?.name;
  const nextRoleId = nextRole?.id;

  if (!nextRoleName) {
    logger.warn(`Liquidation ${logContext} notification skipped: workflow seq-2 role not found`, {
      liquidationId: liquidation.id,
      liquidationModuleKey,
      allowedRoleIds: nextRoleIds,
    });
    return;
  }

  let templateTitle = resubmit
    ? 'Liquidation Request Resubmitted'
    : (NOTIFICATIONS.notifications.liquidation.requested.title as string);
  let templateDescription = resubmit
    ? `A liquidation request has been resubmitted for society "${society?.cooperative_society_name || 'Unknown'}"`
    : `A new liquidation request has been submitted for society "${society?.cooperative_society_name || 'Unknown'}"`;
  let templateId: string | undefined;

  try {
    const templateIdFromWorkflow = currentStep?.approval_notification_template_id || null;
    const template = templateIdFromWorkflow
      ? await NotificationTemplate.findByPk(templateIdFromWorkflow)
      : await NotificationTemplate.findOne({ where: { key: 'liquidation_submit', active: true } });

    if (template && (template as { active?: boolean }).active !== false) {
      templateTitle = template.title || templateTitle;
      templateDescription = template.description || templateDescription;
      templateId = template.id;
    }
  } catch (tplErr: unknown) {
    logger.warn('Failed to fetch liquidation_submit notification template', {
      error: tplErr instanceof Error ? tplErr.message : String(tplErr),
    });
  }

  const creatorUser = createdBy ? await User.findByPk(createdBy) : null;
  const username =
    (creatorUser as { getFullName?: () => string })?.getFullName?.() ||
    `${creatorUser?.first_name || ''} ${creatorUser?.last_name || ''}`.trim() ||
    creatorUser?.email ||
    '';
  const societyLabel = society?.cooperative_society_name || societyId;

  const description = templateDescription
    .replace(/\{\{username\}\}/g, username)
    .replace(/\{\{SocietyName\}\}/g, societyLabel)
    .replace(/\{\{roleName\}\}/g, nextRoleName)
    .replace(/\{\{[^}]+\}\}/g, '');

  const notificationPayload = {
    title: templateTitle as any,
    description,
    data: JSON.stringify({
      liquidation_id: liquidation.id,
      module_name: liquidationModuleKey,
      next_role: nextRoleName,
      next_role_id: nextRoleId,
      district_id: districtId,
      state_id: stateId,
      ...(resubmit ? { action: 'resubmitted' } : {}),
    }),
    redirect_path: NOTIFICATIONS.notifications.liquidation.requested.path.replace('{id}', liquidation.id),
    created_by: createdBy,
    notification_template_id: templateId,
  } as any;

  const isDistrictScopedRole = !HQ_WORKFLOW_ROLE_NAMES.has(nextRoleName);

  if (isDistrictScopedRole) {
    if (!districtId) {
      logger.warn(`Liquidation ${logContext} notification skipped: no district_id`, {
        liquidationId: liquidation.id,
        nextRoleName,
      });
      return;
    }

    const notification = await notifyRolesInDistrict(districtId, notificationPayload, [nextRoleName]);
    if (notification) {
      logger.info(`Liquidation ${logContext} notification sent to district workflow role`, {
        liquidationId: liquidation.id,
        districtId,
        nextRoleName,
        templateId,
      });
    }
    return;
  }

  const geo = resolveWorkflowUserGeoFilter([nextRoleName], districtId, stateId);
  const userIds = await getUsers({
    ...geo,
    roleNames: [nextRoleName],
    isActive: true,
  });

  if (!userIds.length) {
    logger.warn(`Liquidation ${logContext}: no users found for workflow role`, {
      liquidationId: liquidation.id,
      nextRoleName,
      districtId: geo.districtId,
      stateId: geo.stateId,
    });
    return;
  }

  await sendNotification(userIds, notificationPayload);
  logger.info(`Liquidation ${logContext} notification sent to workflow role`, {
    liquidationId: liquidation.id,
    nextRoleName,
    userCount: userIds.length,
    templateId,
  });
}

/**
 * Create a new liquidation.
 * Only one active liquidation (applicant or RCS flow) per society at a time.
 * @param initiatedBy - 'applicant' | 'rcs'. Applicant flow = sequence 1 is_hq false; RCS flow = sequence 1 is_hq true.
 */
export const create = async (
  liquidationData: ILiquidation,
  userDistrictId?: string,
  options?: { initiatedBy?: 'applicant' | 'rcs' }
): Promise<Liquidation> => {
  try {
    // Do not require society_type from request payload.
    // Derive it from society registration if missing.
    if (!liquidationData.society_type && liquidationData.society_id) {
      const societyForType = await SocietyRegistration.findByPk(liquidationData.society_id, {
        attributes: ['society_type'],
      });
      (liquidationData as any).society_type =
        societyForType?.get('society_type') || 'unknown';
    }

    const initiatedBy = options?.initiatedBy ?? 'applicant';
    const isRcsFlow = initiatedBy === 'rcs';

    // Ensure only one active liquidation per society (block if RCS or applicant flow already in progress)
    const terminalStatuses = await Promise.all(
      LIQUIDATION_TERMINAL_STATUS_KEYS.map((key) => findStatusByKey(key))
    );
    const terminalStatusIds = terminalStatuses.filter(Boolean).map((s) => s!.id);
    const existingActive = await Liquidation.findOne({
      where: {
        society_id: liquidationData.society_id,
        ...(terminalStatusIds.length > 0 ? { status: { [Op.notIn]: terminalStatusIds } } : {})
      }
    });
    if (existingActive) {
      throw new Error(
        'A liquidation process is already in progress for this society. Only one process (RCS or applicant) can be active at a time. Please complete or reject the existing process before starting a new one.'
      );
    }

    // Set workflow_status to first step of the chosen flow: applicant (LIQUIDATION) or RCS (LIQUIDATION_RCS)
    const liquidationModuleKey = isRcsFlow ? 'LIQUIDATION_RCS' : 'LIQUIDATION';
    const workflowStatusId = await getWorkflowIdByModuleAndSequence(liquidationModuleKey, 1, isRcsFlow);
    if (workflowStatusId) {
      logger.info('Auto-setting workflow_status to first workflow step for liquidation', {
        workflow_step_id: workflowStatusId,
        sequence: 1
      });
    }

    // Try to get the "submitted" status, fallback to "pending" if not found
    const statusToUse = await findStatusByKey("submitted");
    if (statusToUse) {
      logger.info(`Using status: submitted with ID: ${statusToUse.id}`);
    } else {
      logger.warn(`Status submitted not found, trying next...`);
    }

    if (!statusToUse) {
      throw new Error('No suitable status found. Please ensure statuses are seeded in the database.');
    }

    // Remove workflow fields and is_applicant from input; we set them automatically from initiatedBy
    const { workflow_status, assigned_to_user_id, is_applicant: _discardIsApplicant, ...dataWithoutWorkflowFields } = liquidationData as any;

    // Always set the status, workflow_status, and is_applicant (1 = applicant flow, 0 = RCS flow)
    const liquidationWithStatus = {
      ...dataWithoutWorkflowFields,
      status: statusToUse.id,
      workflow_status: workflowStatusId,
      assigned_to_user_id: null,
      is_applicant: !isRcsFlow
    };

    logger.info('Attempting to create liquidation with data:', JSON.stringify(liquidationWithStatus, null, 2));

    const liquidation = await Liquidation.create(liquidationWithStatus);

    try {
      await notifyLiquidationSubmittedToNextRole({
        liquidation,
        societyId: liquidationData.society_id,
        liquidationModuleKey,
        isRcsFlow,
        createdBy: liquidation.created_by,
        logContext: 'create',
      });
    } catch (notificationError) {
      logger.warn('Failed to send workflow next-step notifications, but liquidation was created successfully', {
        liquidation_id: liquidation.id,
        society_id: liquidationData.society_id,
        error: notificationError instanceof Error ? notificationError.message : String(notificationError),
      });
    }

    const society = await SocietyRegistration.findByPk(liquidationData.society_id);

    logger.info(`Liquidation created with ID: ${liquidation.id} and status: ${statusToUse.key}`);

    // Log activity
    await createActivity({
      title: 'Liquidation Request Created',
      description: `New liquidation request submitted for society "${society?.cooperative_society_name || 'Unknown'}"`,
      data: {
        liquidation_id: liquidation.id,
        society_id: liquidationData.society_id,
        society_name: society?.cooperative_society_name,
        liquidation_reason: liquidationData.reason_for_liquidation || 'Unknown',
        liquidation_person: liquidationData.liquidation_person || 'Unknown',
        created_by: liquidationData.created_by
      },
      reference_id: liquidation.id,
      created_by: liquidationData.created_by || 'system'
    });

    // history for liquidation creation
    await createHistory({
      resource: 'liquidation',
      type: 'create',
      reference_id: liquidation.id,
      created_by: liquidationData.created_by,
      comments: `Liquidation request created for society: ${society?.cooperative_society_name || 'Unknown'}`,
      data: JSON.stringify({
        liquidation: liquidation
      })
    });
    return liquidation;
  } catch (error: any) {
    logger.error('Error creating liquidation:', error);
    throw new Error(`Failed to create liquidation: ${error.message || 'Unknown error'}`);
  }
};

/** Fields that must not be changed via update (identity/system) */
const UPDATE_FORBIDDEN_KEYS = ['id', 'society_id', 'created_by', 'created_at'];

/**
 * Update an existing liquidation by ID.
 * Access: same as getById (admin all; others by district).
 */
// export const update = async (
//   id: string,
//   data: Partial<ILiquidation>,
//   userDistrictId?: string,
//   userRole?: string
// ): Promise<Liquidation | null> => {
//   try {
//     const existing = await getById(id, userDistrictId, userRole);
//     if (!existing) {
//       return null;
//     }

//     const payload = { ...data } as any;
//     UPDATE_FORBIDDEN_KEYS.forEach((key) => delete payload[key]);

//     // When status is set to "resubmitted", set status column and reset workflow_status to sequence 1
//     const resubmittedStatus = await findStatusByKey('resubmitted');
//     const isResubmittedRequest =
//       resubmittedStatus &&
//       (payload.status === resubmittedStatus.id || payload.status === 'resubmitted');

//     if (isResubmittedRequest && resubmittedStatus) {
//       payload.status = resubmittedStatus.id;
//       const isRcsFlow = !existing.is_applicant;
//       const workflowStatusId = await getWorkflowIdByModuleAndSequence('LIQUIDATION', 1, isRcsFlow);
//       if (workflowStatusId) {
//         payload.workflow_status = workflowStatusId;
//         logger.info('Status set to resubmitted and workflow_status to sequence 1', {
//           liquidationId: id,
//           workflow_step_id: workflowStatusId,
//           sequence: 1,
//           is_applicant: existing.is_applicant
//         });
//       }
//     }

//     if (Object.keys(payload).length === 0) {
//       return await Liquidation.findByPk(id);
//     }

//     await Liquidation.update(payload, { where: { id } });
//     return await Liquidation.findByPk(id);
//   } catch (error: any) {
//     logger.error('Error updating liquidation:', error);
//     throw new Error(`Failed to update liquidation: ${error.message || 'Unknown error'}`);
//   }
// };


export const update = async (
  id: string,
  data: Partial<ILiquidation>,
  userDistrictId?: string,
  userRole?: string
): Promise<Liquidation | null> => {
  try {
    const existing = await getById(id, userDistrictId, userRole);
    if (!existing) return null;

    const payload = { ...data } as any;

    // Remove forbidden keys
    UPDATE_FORBIDDEN_KEYS.forEach((key) => delete payload[key]);

    /* ================================
       RESUBMITTED STATUS LOGIC
    ================================= */
    const resubmittedStatus = await findStatusByKey('resubmitted');

    let isResubmitted = false;
    const isRcsFlow = !existing.is_applicant;
    const liquidationModuleKey = isRcsFlow ? 'LIQUIDATION_RCS' : 'LIQUIDATION';

    const isResubmittedRequest =
      resubmittedStatus &&
      (payload.status === 'resubmitted' || payload.status === resubmittedStatus.id);

    if (isResubmittedRequest && resubmittedStatus) {
      isResubmitted = true;

      // ✅ Set correct status ID
      payload.status = resubmittedStatus.id;

      // ✅ Get workflow sequence 1 (use LIQUIDATION_RCS module for RCS flow)
      const workflowStatusId = await getWorkflowIdByModuleAndSequence(
        liquidationModuleKey,
        1,
        isRcsFlow
      );

      if (workflowStatusId) {
        payload.workflow_status = workflowStatusId;
      }

      logger.info('Resubmitted: status + workflow reset', {
        liquidationId: id,
        status: resubmittedStatus.id,
        workflow_status: workflowStatusId,
        sequence: 1,
        is_applicant: existing.is_applicant
      });
    }

    /* ================================
       UPDATE
    ================================= */
    if (Object.keys(payload).length === 0) {
      return await Liquidation.findByPk(id);
    }

    await Liquidation.update(payload, { where: { id } });

    const updatedLiquidation = await Liquidation.findByPk(id);
    if (!updatedLiquidation) {
      return null;
    }

    // history for liquidation resubmit (only when resubmitted)
    if (isResubmitted) {
      await createHistory({
        resource: 'liquidation',
        type: 'resubmit',
        reference_id: id,
        created_by: existing.created_by || 'system',
        comments: `Liquidation request resubmitted for society: ${existing.society?.cooperative_society_name || 'Unknown'}`,
        data: JSON.stringify({
          liquidation: updatedLiquidation
        })
      });

      // notification to next workflow step (same pattern as create)
      try {
        await notifyLiquidationSubmittedToNextRole({
          liquidation: updatedLiquidation,
          societyId: existing.society_id,
          liquidationModuleKey,
          isRcsFlow,
          createdBy: updatedLiquidation.created_by,
          logContext: 'resubmit',
          resubmit: true,
        });
      } catch (notificationError) {
        logger.warn('Failed to send liquidation resubmit notifications (non-fatal)', {
          liquidation_id: updatedLiquidation.id,
          society_id: existing.society_id,
          error: notificationError instanceof Error ? notificationError.message : String(notificationError),
        });
      }
    }

    return updatedLiquidation;
  } catch (error: any) {
    logger.error('Error updating liquidation:', error);
    throw new Error(`Failed to update liquidation: ${error.message || 'Unknown error'}`);
  }
};
/**
 * Already approved files missed the stamp when RCS approved from the previous step,
 * or when the JT upload was stored on that previous sequence. Stamp on the next open.
 */
async function ensureLiquidationJtUploadsStamped(result: Record<string, unknown>): Promise<void> {
  const statusKey =
    (result.statusObj as { key?: string } | undefined)?.key ||
    (result.status as { key?: string } | undefined)?.key;
  if (statusKey !== 'liquidation_approved' && statusKey !== 'approved') return;

  const signed = parseStoredSignedDocuments(result.rcs_signed_documents);
  if (signed.some((doc) => doc.key === 'liquidation_report' && doc.stamped && doc.issuedMediaId)) {
    return;
  }

  const resourceId = typeof result.id === 'string' ? result.id : '';
  const approverUserId = typeof result.status_changed_by === 'string' ? result.status_changed_by : '';
  if (!resourceId || !approverUserId) return;

  const isRcsFlow = result.is_applicant === false || result.is_applicant === 0 || result.is_applicant === '0';
  const society = result.society as { id?: string } | undefined;
  const societyRegistrationId =
    (typeof result.society_registration_id === 'string' && result.society_registration_id) ||
    society?.id ||
    null;

  const signedJtDocs = await issueLiquidationJtUploadsOnFinalApproval({
    moduleName: isRcsFlow ? 'LIQUIDATION_RCS' : 'LIQUIDATION',
    resourceId,
    approverUserId,
    societyRegistrationId,
    existingObservationsMediaId:
      typeof result.liquidator_appointment_observations === 'string'
        ? result.liquidator_appointment_observations
        : null,
    existingByeLawsMediaId: typeof result.bye_laws === 'string' ? result.bye_laws : null,
  });

  const stampedReport = signedJtDocs.find((doc) => doc.key === 'liquidation_report' && doc.stamped);
  if (!stampedReport) return;

  await Liquidation.update(
    { rcs_signed_documents: signedJtDocs },
    { where: { id: resourceId } },
  );
  result.rcs_signed_documents = signedJtDocs;
  logger.info('Stamped liquidation report on approved liquidation detail', {
    resourceId,
    issuedMediaId: stampedReport.issuedMediaId,
  });
}

/**
 * Get liquidation by ID
 */
export const getById = async (id: string, userDistrictId?: string, userRole?: string): Promise<any> => {
  try {
    const registrarRoles = ['jt_rcs_district', 'rcs_district', 'drcs_arcs_district'];
    const isRegistrar = userRole && registrarRoles.includes(userRole);
    if (isRegistrar && userDistrictId === null) {
      throw new Error('Access denied: Registrar must be assigned to a district to view liquidations');
    }

    const liquidation = await Liquidation.findOne({
      where: { id },
      include: LIQUIDATION_DETAIL_INCLUDES,
    });

    if (!liquidation) {
      if (userDistrictId) {
        throw new Error('Liquidation not found or access denied');
      }
      return null;
    }

    let isHq = false;

    // Derive isHq from stored is_applicant: applicant flow (is_applicant true) => isHq false; RCS flow (is_applicant false) => isHq true
    const isApplicant = liquidation.get ? liquidation.get('is_applicant') : (liquidation as any).is_applicant;
    isHq = isApplicant === false;
    const historyModuleKey = isHq ? 'LIQUIDATION_RCS' : 'LIQUIDATION';

    // Convert to plain object to ensure all fields are included
    const result = formatLiquidationDetailResponse(
      (liquidation.toJSON ? liquidation.toJSON() : liquidation.get({ plain: true })) as Record<string, unknown>
    );
    await attachSocietyTypeTitle(result);

    // Add workflow status (current, next, previous) using WorkflowUtilService
    try {
      const workflowStatus = await getWorkflowStatus(
        id,
        'LIQUIDATION',
        isHq
      );

      result.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
    } catch (workflowError: any) {
      logger.warn('Error fetching workflow status for liquidation:', {
        liquidationId: id,
        error: workflowError?.message
      });
      // Don't fail the entire request if workflow status fails
      result.workflowStatus = null;
    }

    try {
      await ensureLiquidationJtUploadsStamped(result);
      await attachRcsSignedDocuments(result);
    } catch (signedDocsErr: any) {
      logger.warn('Failed to attach RCS signed documents for liquidation', {
        id,
        error: signedDocsErr?.message,
      });
      result.rcsSignedDocuments = [];
    }

    try {
      result.previousCommentDocuments = await getLatestCommentDocuments(id, historyModuleKey);
    } catch (documentsErr: any) {
      logger.warn('Failed to get previous comment documents for liquidation', {
        id,
        error: documentsErr?.message
      });
      result.previousCommentDocuments = [];
    }

    await attachCompleteProcessingHistoryToDetail(result, id, historyModuleKey, {
      historyResources: ['LIQUIDATION', 'LIQUIDATION_RCS']
    });

    return result;
  } catch (error) {
    logger.error(`Error getting liquidation by ID ${id}:`, error);
    throw new Error('Failed to get liquidation' + (error as any)?.message);
  }
};

/**
 * Get all liquidations with filters and pagination
 */
export const getAll = async (filters: any = {}, userDistrictId?: string, userId?: string, userRole?: string, search?: string): Promise<{
  liquidations: Liquidation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  search: string | undefined;
  filters: any;
}> => {
  try {
    const {
      page = 1,
      limit = 10,
      liquidation_order_date_from,
      liquidation_order_date_to,
      society_id,
      is_applicant: isApplicantFilter,
      search: searchFromFilters,
      workflow_status: workflowStatusFilter,
      workflowstatus: workflowStatusLegacy,
      ...otherFilters
    } = filters;

    // Use search parameter from function or from filters
    const searchTerm = search || searchFromFilters;

    const offset = (page - 1) * limit;
    const where: any = {};
    if (searchTerm) {
      where[Op.or] = [
        { society_name: { [Op.like]: `%${searchTerm}%` } },
        { society_registration_number: { [Op.like]: `%${searchTerm}%` } }
      ];
    }

    // Role-based access control
    if (userRole === 'admin' || userRole === 'jt_rcs_district' || userRole === 'rcs_district' || userRole?.includes('_hq')) {
      // Admin users have access to all liquidations - no district restrictions
    } else if (userRole === 'applicant' && society_id) {
      // Applicants can only see their own society's liquidations
      where.society_id = society_id;
    } else if (userDistrictId) {
      // Registrars can see liquidations in their district
      where.society_id = {
        [Op.in]: Sequelize.literal(`(
          SELECT id FROM society_registrations 
          WHERE district_id = '${userDistrictId}'
        )`)
      };
    }

    // Add date filters if provided
    if (liquidation_order_date_from || liquidation_order_date_to) {
      where.date_of_liquidation_order = {};
      if (liquidation_order_date_from) {
        where.date_of_liquidation_order[Op.gte] = new Date(liquidation_order_date_from);
      }
      if (liquidation_order_date_to) {
        where.date_of_liquidation_order[Op.lte] = new Date(liquidation_order_date_to);
      }
    }

    // Filter by workflow type: is_applicant 1 = applicant flow, 0 = RCS flow
    if (isApplicantFilter !== undefined && isApplicantFilter !== '') {
      where.is_applicant = isApplicantFilter === 1 || isApplicantFilter === '1' || isApplicantFilter === true;
    }

    // Filter by workflow status (current workflow step). Accept workflow_status or workflowstatus.
    const workflowStatusValue = workflowStatusFilter ?? workflowStatusLegacy;
    if (workflowStatusValue !== undefined && workflowStatusValue !== '') {
      where.workflow_status = workflowStatusValue;
    }

    // Add other filters
    Object.keys(otherFilters).forEach(key => {
      if (otherFilters[key] !== undefined && otherFilters[key] !== '') {
        where[key] = otherFilters[key];
      }
    });

    const { count, rows } = await Liquidation.findAndCountAll({
      where,
      include: [
        {
          model: SocietyRegistration,
          as: 'society',
          attributes: ['id', 'district_id'],
        },
        {
          model: Status,
          as: 'statusObj',
          attributes: ['id', 'key', 'title'],
        },
        {
          model: SocietyType,
          as: 'societyType',
          attributes: ['id', 'title'],
        },
        {
          model: Media,
          as: 'minutesMeetingMedia',
          attributes: ['id', 'url'],
        },
        {
          model: Media,
          as: 'attendanceSheetMedia',
          attributes: ['id', 'url'],
        },
        {
          model: Media,
          as: 'circularNoticeMedia',
          attributes: ['id', 'url'],
        },
        {
          model: Media,
          as: 'creditorsListMedia',
          attributes: ['id', 'url'],
        },
        {
          model: Media,
          as: 'membersListMedia',
          attributes: ['id', 'url'],
        }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const totalPages = Math.ceil(count / limit);

    // Same workflowStatus shape as getById: use getWorkflowStatus per row
    const newRows = await Promise.all(
      rows.map(async (row) => {
        const plain = row.toJSON ? row.toJSON() : row.get({ plain: true });
        const isHq = plain.is_applicant === false;
        try {
          const workflowStatus = await getWorkflowStatus(plain.id, 'LIQUIDATION', isHq);
          plain.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
        } catch (workflowError: any) {
          logger.warn('Error fetching workflow status for liquidation in list:', {
            liquidationId: plain.id,
            error: workflowError?.message,
          });
          plain.workflowStatus = null;
        }
        return plain;
      })
    );
    const newFilters = {
      ...filters,
      search: searchTerm
    };

    return {
      liquidations: newRows,
      total: count,
      page: page,
      limit: limit,
      totalPages,
      search: searchTerm || '',
      filters: newFilters
    };
  } catch (error) {
    logger.error('Error getting all liquidations:', error);
    throw new Error('Failed to get liquidations');
  }
};
