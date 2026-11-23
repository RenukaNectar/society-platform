import Amendment from '../models/Amendment';
import SocietyRegistration from '../models/SocietyRegistration';
import User from '../models/user';
import Status from '../models/Status';
import Member from '../models/Member';
import Notification from '../models/Notification';
import { mediaUpload, overwriteMediaFileBuffer } from './MediaService';
import Media from '../models/Media';
import { generateSocietyCertificate } from './CertificateService';
import { stampCertificatePdfWithQr } from './CertificateDocumentService';
import {
  notifyInspectorsInDistrict,
  notifyRegistrarsInDistrict,
  notifyRolesInDistrict,
  sendNotification,
  getUsers
} from './NotificationService';
import Role from '../models/Role';
import { Op } from 'sequelize';
import { findUserById } from './UserService';
import District from '../models/District';
import SocietyType from '../models/SocietyType';
import SectorOfOperation from '../models/SectorOfOperation';
import { NOTIFICATIONS } from '../config';
import logger from '../utils/logger';
import { findStatusById, findStatusByKey } from './StatusService';
import { createActivity } from './ActiviesService';
import { sendNotificationEmail, sendNotificationEmailToMultipleUsers } from '../utils/email';
import {
  formatWorkflowStatusForApi,
  getWorkflowIdByModuleAndSequence,
  getWorkflowStatus,
  parseWorkflowRoleIds
} from './WorkflowUtilService';
import { getLatestCommentDocuments, attachCompleteProcessingHistoryToDetail } from './WorkflowCommentService';
import { resolveAndAttachByeLawsMediaForDetail } from './ModuleByeLawDocumentService';
import { findHistoryByReference } from './HistoryService';
import Module from '../models/Module';
import ModuleWorkflow from '../models/ModuleWorkflow';
import NotificationTemplate from '../models/NotificationTemplate';

export interface IAmendmentCreate {
  society_id: string;
  chairperson_name?: string;
  chairperson_address?: string;
  chairperson_contact?: string;
  signatory_name?: string;
  signatory_address?: string;
  signatory_contact?: string;
  members?: IMemberData[];
  resolution_extract?: string;
  general_body_meeting_date?: Date | string;
  notice_days?: number;
  notice_date?: Date | string;
  total_members?: number;
  quorum_required?: number;
  members_present?: number;
  members_voted?: number;
  votes_in_favour?: number;
  votes_against?: number;
  byelaw_number?: string;
  existing_byelaw?: string;
  new_proposed_byelaw?: string;
  media_id?: string;
  existing_byelaw_media_id?: string;
  new_proposed_byelaw_media_id?: string;
  circular_notice_media_id?: string;
  minutes_of_meeting_media_id?: string;
  attendance_sheet_media_id?: string;
  registration_number_of_previous_application?: string;
  amendment_reason?: string;
  proposed_byelaw_text?: string;
  deleted_members?: IDeletedMemberData[] | null;
  created_by?: string;
  status_id?: string;
}

export interface IAmendmentUpdate {
  chairperson_name?: string;
  chairperson_address?: string;
  chairperson_contact?: string;
  signatory_name?: string;
  signatory_address?: string;
  signatory_contact?: string;
  members?: IMemberData[];
  resolution_extract?: string;
  general_body_meeting_date?: Date | string;
  notice_days?: number;
  notice_date?: Date | string;
  total_members?: number;
  quorum_required?: number;
  members_present?: number;
  members_voted?: number;
  votes_in_favour?: number;
  votes_against?: number;
  byelaw_number?: string;
  existing_byelaw?: string;
  new_proposed_byelaw?: string;
  media_id?: string;
  existing_byelaw_media_id?: string;
  new_proposed_byelaw_media_id?: string;
  circular_notice_media_id?: string;
  minutes_of_meeting_media_id?: string;
  attendance_sheet_media_id?: string;
  registration_number_of_previous_application?: string;
  amendment_reason?: string;
  proposed_byelaw_text?: string;
  deleted_members?: IDeletedMemberData[] | null;
  certificate_number?: string;
  updated_by?: string;
  status_id?: string;
}

export interface IMemberData {
  id?: string;
  name: string;
  gender: string;
  category: string;
  designation: string;
}

export interface IDeletedMemberData {
  member_id?: string | null;
  name: string;
  mobile?: string | null;
  gender?: string | null;
  category?: string | null;
  designation?: string | null;
  deletion_reason: string;
  supporting_document_media_id: string;
  deleted_at?: string;
}

/**
 * Process members list and manage member records
 * 1. Update existing members if ID is provided
 * 2. Create new members if no ID or ID doesn't exist
 * 3. Deactivate members not in the request body
 */
async function processMembersList(
  members: IMemberData[],
  societyId: string,
  createdBy: string
): Promise<void> {
  try {
    // Get all existing active members for this society
    const existingMembers = await Member.findAll({
      where: {
        society_id: societyId,
        is_active: true
      }
    });

    // Create a map of existing members by ID for direct lookup
    const existingMembersByIdMap = new Map();
    // Create a map of existing members by name and designation for fallback lookup
    const existingMembersByNameMap = new Map();

    existingMembers.forEach(member => {
      existingMembersByIdMap.set(member.id, member);
      const key = `${member.name}-${member.designation}`;
      existingMembersByNameMap.set(key, member);
    });

    // Track which existing members are still active
    const stillActiveMembers = new Set();

    // Process each member in the request
    for (const memberData of members) {
      try {
        let memberToUpdate = null;
        let isNewMember = false;

        // First, check if ID is provided and member exists
        if (memberData.id && existingMembersByIdMap.has(memberData.id)) {
          // Update existing member by ID
          memberToUpdate = existingMembersByIdMap.get(memberData.id);
          stillActiveMembers.add(memberData.id);
        } else if (memberData.id) {
          // ID provided but member not found - this might be an error
          // Fall through to create new member
        }

        // If no member found by ID, check by name and designation
        if (!memberToUpdate) {
          const key = `${memberData.name}-${memberData.designation}`;
          if (existingMembersByNameMap.has(key)) {
            memberToUpdate = existingMembersByNameMap.get(key);
            stillActiveMembers.add(memberToUpdate.id);
          }
        }

        if (memberToUpdate) {
          // Update existing member
          await memberToUpdate.update({
            name: memberData.name,
            gender: memberData.gender,
            category: memberData.category,
            designation: memberData.designation,
            is_active: true,
            updated_by: createdBy
          });
        } else {
          // Create new member
          const newMember = await Member.create({
            name: memberData.name,
            gender: memberData.gender,
            category: memberData.category,
            designation: memberData.designation,
            society_id: societyId,
            is_active: true,
            created_by: createdBy
          });
        }
      } catch (memberError: any) {
        // Continue with other members even if one fails
      }
    }

    // Deactivate members not in the request body
    for (const existingMember of existingMembers) {
      if (!stillActiveMembers.has(existingMember.id)) {
        try {
          await existingMember.update({
            is_active: false,
            updated_by: createdBy
          });
        } catch (deactivationError: any) {
          // Continue with other members even if one fails
        }
      }
    }
  } catch (error: any) {
    // Don't throw error - just log it so the amendment creation doesn't fail
  }
}

/**
 * Process uploaded files for an amendment and return media IDs
 */
async function processAmendmentFiles(
  files: { [fieldname: string]: Express.Multer.File[] },
  userId: string
): Promise<{ media_id?: string; existing_byelaw_media_id?: string; new_proposed_byelaw_media_id?: string }> {
  try {
    const result: { media_id?: string; existing_byelaw_media_id?: string; new_proposed_byelaw_media_id?: string } = {};

    // Process new_proposed_byelaw file
    if (files.new_proposed_byelaw && files.new_proposed_byelaw.length > 0) {
      const file = files.new_proposed_byelaw[0];

      if (file && file.originalname && file.mimetype && file.size && file.buffer) {
        // Use mediaUpload method from MediaService
        const media = await mediaUpload({
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          buffer: file.buffer,
          userId: userId
        }, userId);

        result.new_proposed_byelaw_media_id = media.id;
        // Also set the general media_id to the first uploaded file
        if (!result.media_id) {
          result.media_id = media.id;
        }
      }
    }

    // Process existing_byelaw file
    if (files.existing_byelaw && files.existing_byelaw.length > 0) {
      const file = files.existing_byelaw[0];

      if (file && file.originalname && file.mimetype && file.size && file.buffer) {
        // Use mediaUpload method from MediaService
        const media = await mediaUpload({
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          buffer: file.buffer,
          userId: userId
        }, userId);

        result.existing_byelaw_media_id = media.id;
        // Also set the general media_id to the first uploaded file
        if (!result.media_id) {
          result.media_id = media.id;
        }
      }
    }

    return result;
  } catch (error) {
    throw error;
  }
}

async function getAmendmentMedia(amendmentId: string) {
  try {
    const Amendment = require('../models/Amendment').default;
    const Media = require('../models/Media').default;

    const amendment = await Amendment.findByPk(amendmentId, {
      include: [
        {
          model: Media,
          as: 'existingByelawMedia',
          attributes: ['id', 'url', 'active']
        },
        {
          model: Media,
          as: 'newProposedByelawMedia',
          attributes: ['id', 'url', 'active']
        }
      ]
    });

    if (!amendment) {
      return null;
    }

    return {
      existingByelawMedia: amendment.existingByelawMedia,
      newProposedByelawMedia: amendment.newProposedByelawMedia
    };
  } catch (error) {
    throw error;
  }
}

function getAmendmentDistrictScope(user: any): { district_id: string } | null {
  if (!user?.district_id) {
    return null;
  }

  const roleName = user?.role?.name;
  const isHq = Boolean(user?.is_hq);
  const isCrossDistrictRole =
    roleName === 'rcs_district' || roleName === 'jt_rcs_district';
  const skipDistrictScope =
    isHq ||
    roleName === 'admin' ||
    roleName === 'super_admin' ||
    roleName === 'applicant' ||
    isCrossDistrictRole;

  if (skipDistrictScope) {
    return null;
  }

  return { district_id: user.district_id };
}

/**
 * Notify seq-2 role (drcs_arcs_district) after amendment submit / draft→submit.
 * Same pattern as Appeal / Election / Annual Filing.
 */
async function notifyAmendmentSubmittedToNextRole(params: {
  amendmentId: string;
  societyId: string;
  createdBy?: string | null;
  fallbackDistrictId?: string | null;
  logContext?: string;
}): Promise<void> {
  const {
    amendmentId,
    societyId,
    createdBy,
    fallbackDistrictId,
    logContext = 'amendment submit'
  } = params;

  let society =
    (await SocietyRegistration.findByPk(societyId)) ||
    (await SocietyRegistration.findOne({ where: { society_id: societyId } }));

  const districtId = society?.district_id || fallbackDistrictId || null;

  if (!districtId) {
    logger.warn(`Amendment ${logContext} notification skipped: no district_id`, { amendmentId });
    return;
  }

  const amendmentModule = await Module.findOne({ where: { key: 'AMENDMENT', active: true } });
  const workflowStepWhere = amendmentModule
    ? { module_id: amendmentModule.id, active: true, is_hq: false }
    : null;

  const currentStep = workflowStepWhere
    ? await ModuleWorkflow.findOne({ where: { ...workflowStepWhere, sequence: 1 } })
    : null;
  const nextStep = workflowStepWhere
    ? await ModuleWorkflow.findOne({ where: { ...workflowStepWhere, sequence: 2 } })
    : null;

  const nextRoleIds = parseWorkflowRoleIds(nextStep?.allowed_role_id);
  const nextRole = nextRoleIds.length
    ? await Role.findOne({ where: { id: nextRoleIds[0], is_active: true }, attributes: ['id', 'name'] })
    : null;
  const nextRoleName = nextRole?.name || 'drcs_arcs_district';
  const nextRoleId = nextRole?.id;

  if (!nextRole?.name) {
    logger.warn(`Amendment ${logContext}: workflow seq-2 role missing, falling back to drcs_arcs_district`, {
      amendmentId,
      allowedRoleIds: nextRoleIds
    });
  }

  let templateTitle = (NOTIFICATIONS.notifications as any)?.amendment?.requested?.title || 'Amendment Submitted';
  let templateDescription = `A new amendment request has been submitted for society "${society?.cooperative_society_name || 'N/A'}"`;
  let templateId: string | undefined;

  try {
    const templateIdFromWorkflow = currentStep?.approval_notification_template_id || null;
    const template = templateIdFromWorkflow
      ? await NotificationTemplate.findByPk(templateIdFromWorkflow)
      : await NotificationTemplate.findOne({ where: { key: 'amendment_submit', active: true } });

    if (template && (template as any).active !== false) {
      templateTitle = template.title || templateTitle;
      templateDescription = template.description || templateDescription;
      templateId = template.id;
    }
  } catch (tplErr: any) {
    logger.warn('Failed to fetch amendment_submit template', { error: tplErr?.message });
  }

  const creatorUser = createdBy ? await User.findByPk(createdBy) : null;
  const username = (creatorUser as any)?.getFullName?.() ||
    `${creatorUser?.first_name || ''} ${creatorUser?.last_name || ''}`.trim() ||
    creatorUser?.email || '';
  const societyLabel = society?.cooperative_society_name || societyId;

  const description = templateDescription
    .replace(/\{\{username\}\}/g, username)
    .replace(/\{\{SocietyName\}\}/g, societyLabel)
    .replace(/\{\{roleName\}\}/g, nextRoleName)
    .replace(/\{\{[^}]+\}\}/g, '');

  const notification = await notifyRolesInDistrict(
    districtId,
    {
      title: templateTitle as any,
      description,
      data: JSON.stringify({
        amendment_id: amendmentId,
        module_name: 'AMENDMENT',
        next_role: nextRoleName,
        next_role_id: nextRoleId,
        district_id: districtId
      }),
      redirect_path: ((NOTIFICATIONS.notifications as any)?.amendment?.requested?.path || '/amendments/{id}').replace('{id}', amendmentId),
      created_by: createdBy || undefined,
      notification_template_id: templateId
    } as any,
    [nextRoleName]
  );

  if (notification) {
    logger.info(`Amendment ${logContext} notification sent to next workflow role`, {
      amendmentId,
      districtId,
      nextRoleName
    });
  }
}

/** Applicant amendment UI: same document as other modules (JT upload or RCS-stamped). */
function applyAmendmentRcsObservationsAliases(detail: Record<string, any>): void {
  if (detail?.byeLawsMedia?.id) {
    detail.rcsObservationsMedia = detail.byeLawsMedia;
    return;
  }
  const rcsDoc = Array.isArray(detail.previousCommentDocuments)
    ? detail.previousCommentDocuments.find((d: { key?: string }) => d.key === 'rcs_observations')
    : null;
  if (rcsDoc?.mediaId) {
    const media = { id: rcsDoc.mediaId, url: rcsDoc.url || '' };
    detail.byeLawsMedia = media;
    detail.rcsObservationsMedia = media;
  }
}

/** Resolve rcs_observations → byeLawsMedia for applicant amendment window / list / detail. */
async function enrichAmendmentRcsObservationsForApplicant(
  detail: Record<string, any>,
  amendmentId: string
): Promise<void> {
  try {
    if (!Array.isArray(detail.previousCommentDocuments)) {
      try {
        detail.previousCommentDocuments = await getLatestCommentDocuments(amendmentId, 'AMENDMENT');
      } catch {
        detail.previousCommentDocuments = [];
      }
    }
    await resolveAndAttachByeLawsMediaForDetail(detail, amendmentId, 'AMENDMENT');
    applyAmendmentRcsObservationsAliases(detail);
  } catch (err: any) {
    logger.warn('Failed to enrich amendment RCS observations for applicant', {
      amendmentId,
      error: err?.message || String(err)
    });
    applyAmendmentRcsObservationsAliases(detail);
  }
}

/**
 * Create a new amendment
  */
export async function createAmendment(data: IAmendmentCreate, req?: any): Promise<Amendment | { message: string }> {
  try {

    let pendingStatus: any;
    if (data?.status_id) {
      let isStatusExist = await findStatusById(data?.status_id)
      if (isStatusExist && isStatusExist?.id) {
        pendingStatus = isStatusExist
      } else {
        pendingStatus = await findStatusByKey('submitted') || await findStatusByKey('pending')
      }
    } else {
      pendingStatus = await findStatusByKey('submitted') || await findStatusByKey('pending')
    }

    // Ensure we have a valid status
    if (!pendingStatus || !pendingStatus.id) {
      throw new Error('Unable to find a valid status for the amendment');
    }

    // Set workflow_status to first workflow step (sequence 1) for AMENDMENT
    let workflowStatusId: string | null = null;
    try {
      workflowStatusId = await getWorkflowIdByModuleAndSequence('AMENDMENT', 1);
      if (!workflowStatusId) {
        logger.warn('AMENDMENT sequence 1 workflow step NOT found. Ensure amendment workflow seeder has been run.');
      }
    } catch (workflowErr: any) {
      logger.warn('Failed to resolve AMENDMENT workflow step 1', { error: workflowErr?.message });
    }

    const { id: _clientId, amendment_id: _amendmentId, ...createFields } = data as IAmendmentCreate & {
      id?: string;
      amendment_id?: string;
    };

    const amendment = await Amendment.create({
      ...createFields,
      status_id: pendingStatus.id,
      workflow_status: workflowStatusId,
      existing_byelaw_media_id: data.existing_byelaw_media_id || null,
      new_proposed_byelaw_media_id: data.new_proposed_byelaw_media_id || null
    } as any);

    
    // Process uploaded files if any
    if (req?.files && Object.keys(req.files).length > 0) {
      try {
        const mediaIds = await processAmendmentFiles(
          req.files,
          data.created_by || ''
        );

        // Update amendment with media IDs
        if (Object.keys(mediaIds).length > 0) {
          await amendment.update(mediaIds);
        }
      } catch (fileError) {
        // Don't fail the amendment creation if file processing fails
      }
    }

    // Process members_list if provided
    if (data.members && data.members.length > 0) {
      try {
        await processMembersList(
          data.members,
          data.society_id,
          data.created_by || ''
        );
      } catch (membersError) {
        // Don't fail the amendment creation if members processing fails
      }
    }

    // Notify next workflow step's role users in the same district (same pattern as Appeal/Election/Annual Filing).
    if (data?.created_by && pendingStatus?.key !== 'draft') {
      try {
        await notifyAmendmentSubmittedToNextRole({
          amendmentId: amendment.id,
          societyId: data.society_id,
          createdBy: data.created_by,
          fallbackDistrictId: (req?.user?.district_id as string) || null,
          logContext: 'create'
        });
      } catch (notificationError: any) {
        logger.error('Failed to send notification for new amendment', notificationError);
      }
    }

    // Log activity
    try {
      const society = await SocietyRegistration.findByPk(data.society_id);
      await createActivity({
        title: 'Amendment Created',
        description: `New amendment submitted for society "${society?.cooperative_society_name || 'Unknown'}"`,
        data: {
          amendment_id: amendment.id,
          society_id: data.society_id,
          society_name: society?.cooperative_society_name,
          chairperson_name: data.chairperson_name,
          byelaw_number: data.byelaw_number,
          amendment_reason: data.amendment_reason,
          created_by: data.created_by
        },
        reference_id: amendment.id,
        created_by: data.created_by || 'system'
      });
    } catch (activityError) {
      logger.error('Failed to log amendment creation activity:', activityError);
    }

    return amendment;
  } catch (error) {
    throw error;
  }
}

/**
 * Get amendment by ID with associations
 */
export async function getAmendmentById(id: string, userId?: string): Promise<any | null> {
  try {
    logger.info('Fetching amendment by ID', { amendment_id: id, userId });

    // Get user details including district from database if userId is provided
    let user = null;
    if (userId) {
      user = await findUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
    }

    const societyDistrictScope = getAmendmentDistrictScope(user);

    // Force setup associations if they're not set up
    if (!Amendment.associations || Object.keys(Amendment.associations).length === 0) {
      Amendment.belongsTo(Status, { foreignKey: 'status_id', as: 'status' });
      Amendment.belongsTo(SocietyRegistration, { foreignKey: 'society_id', as: 'society' });
      Amendment.belongsTo(User, { foreignKey: 'created_by', as: 'createdByUser' });
      Amendment.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedByUser' });
    }

    let amendment: any = await Amendment.findByPk(id, {
      include: [
        { model: Status, as: 'status', required: false },
        {
          model: SocietyRegistration,
          as: 'society',
          required: Boolean(societyDistrictScope),
          attributes: [
            'id',
            'society_id',
            'cooperative_society_name',
            'local_langauge_society_name',
            'registration_number',
            'contact_person',
            'email',
            'mobile',
            'status',
            'district_id'
          ],
          ...(societyDistrictScope ? { where: societyDistrictScope } : {})
        },
        {
          model: User,
          as: 'createdByUser',
          required: false,
          attributes: ['id', 'first_name', 'last_name', 'email', 'district_id']
        },
        { model: User, as: 'updatedByUser', required: false, attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: Media, as: 'existingByelawMedia', required: false },
        { model: Media, as: 'newProposedByelawMedia', required: false },
        { model: Media, as: 'circularNoticeMedia', required: false },
        { model: Media, as: 'minutesOfMeetingMedia', required: false },
        { model: Media, as: 'attendanceSheetMedia', required: false },
        { model: Media, as: 'districtDrcsArcsRecommendationMedia', required: false },
        { model: Media, as: 'meetingNoticeAgendaMedia', required: false },
        { model: Media, as: 'copyOfNoticeFormGMedia', required: false },
        { model: Media, as: 'byeLawsMedia', required: false, attributes: ['id', 'url'] },


      ]
    });

    if (!amendment) {
      return null;
    }

    // Fetch members list
    const membersList = await Member.findAll({
      where: { society_id: amendment.society_id, is_active: true },
      raw: true
    });

    const result: any = {
      ...amendment.get({ plain: true }),
      members: membersList
    };

    // Enrich deleted_members with supporting document media URLs
    try {
      const deletedMembers = Array.isArray(result.deleted_members) ? result.deleted_members : [];
      const mediaIds = deletedMembers
        .map((item: any) => item?.supporting_document_media_id)
        .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0);

      if (mediaIds.length > 0) {
        const mediaRows = await Media.findAll({
          where: { id: mediaIds },
          attributes: ['id', 'url', 'file_name', 'original_name']
        });
        const mediaById = new Map(mediaRows.map((row) => [String(row.id), row.get({ plain: true })]));
        result.deleted_members = deletedMembers.map((item: any) => ({
          ...item,
          supportingDocumentMedia: item?.supporting_document_media_id
            ? mediaById.get(String(item.supporting_document_media_id)) || null
            : null
        }));
      }
    } catch (deletedMembersErr: any) {
      logger.warn('Failed to enrich deleted_members media for amendment', {
        id,
        error: deletedMembersErr?.message
      });
    }

    // Attach workflowStatus (current/next/previous) for frontend
    try {
      if (amendment.workflow_status) {
        const workflowStatus = await getWorkflowStatus(amendment.id, 'AMENDMENT', false);
        result.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
      } else {
        result.workflowStatus = {};
      }
    } catch (workflowErr: any) {
      logger.warn('Failed to get workflow status for amendment', { id, error: workflowErr?.message });
      result.workflowStatus = {};
    }

    try {
      result.previousCommentDocuments = await getLatestCommentDocuments(id, 'AMENDMENT');
    } catch (docsErr: any) {
      logger.warn('Failed to get previous comment documents for amendment', { id, error: docsErr?.message });
      result.previousCommentDocuments = [];
    }

    try {
      result.history = await findHistoryByReference(id, 'AMENDMENT');
    } catch (historyErr: any) {
      logger.warn('Failed to get history for amendment', { id, error: historyErr?.message });
      result.history = [];
    }

    await attachCompleteProcessingHistoryToDetail(result, id, 'AMENDMENT');
    // Stamp QR + RCS signature onto approved byelaws and attach byeLawsMedia.
    // The society list already does this; the details page uses this getter.
    await enrichAmendmentRcsObservationsForApplicant(result, id);

    return result;

  } catch (error: any) {
    throw error;
  }
}

/**
 * Get all amendments with pagination and filters
 */
export async function getAmendments(
  page: number = 1,
  limit: number = 10,
  filters: {
    society_id?: string;
    current_stage?: string;
    created_by?: string;
    status?: string;
    from?: string;
    to?: string;
  } = {},
  userId?: string,
  search?: string
): Promise<{ amendments: Amendment[]; total: number; page: number; limit: number; totalPages: number }> {
  try {
    logger.info('Fetching amendments with filters', { page, limit, filters, userId });

    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (filters.society_id) whereClause.society_id = filters.society_id;
    if (filters.created_by) whereClause.created_by = filters.created_by;
    if (filters.status) whereClause.status_id = filters.status;
//  date range filters
    if (filters.from || filters.to) whereClause.created_at = {};
    if (filters.from) whereClause.created_at[Op.gte] = new Date(filters.from);
    if (filters.to) whereClause.created_at[Op.lte] = new Date(filters.to);
//  search filters
    if(search){
      whereClause[Op.or] = [
        { society_id: search },
        { chairperson_name: { [Op.like]: `%${search}%` } },
        { chairperson_address: { [Op.like]: `%${search}%` } },
        { chairperson_contact: { [Op.like]: `%${search}%` } },
        { signatory_name: { [Op.like]: `%${search}%` } },
        { signatory_address: { [Op.like]: `%${search}%` } },
        { signatory_contact: { [Op.like]: `%${search}%` } },
        { registration_number_of_previous_application: { [Op.like]: `%${search}%` } }
      ];
    }


    // Get user details including district from database if userId is provided
    let user = null;
    if (userId) {
      user = await findUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Role-based access control
      if (user?.role?.name === 'applicant') {
        // Applicants can only see their own amendments
        whereClause.created_by = userId;
      }
      // For registrars, we'll filter by district in the include section
    }

    const societyDistrictScope = getAmendmentDistrictScope(user);

    logger.debug('Where clause for amendments query', { whereClause });

    // Force setup associations if they're not set up
    if (!Amendment.associations || Object.keys(Amendment.associations).length === 0) {
      Amendment.belongsTo(Status, { foreignKey: 'status_id', as: 'status' });
      Amendment.belongsTo(SocietyRegistration, { foreignKey: 'society_id', as: 'society' });
      Amendment.belongsTo(User, { foreignKey: 'created_by', as: 'createdByUser' });
      Amendment.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedByUser' });
    }

    const status = await Status.findOne({ where: { key: 'draft' } }) as any;
    if (!status || !status.id) {
      throw new Error('Unable to find draft status');
    }
    const amendmentQueryWhere = {
      ...whereClause,
      status_id: { [Op.ne]: status.id }
    };

    // Count and fetch against the same district-scoped query
    const totalCount = await Amendment.count({
      where: amendmentQueryWhere,
      include: societyDistrictScope ? [
        {
          model: SocietyRegistration,
          as: 'society',
          required: true,
          attributes: [],
          where: societyDistrictScope
        }
      ] : undefined,
      distinct: true,
      col: 'id'
    });

    const amendments = await Amendment.findAll({
      where: amendmentQueryWhere,
      include: [
        {
          model: Status,
          as: 'status',
          required: false
        },
        {
          model: SocietyRegistration,
          as: 'society',
          required: Boolean(societyDistrictScope),
          attributes: ['id', 'society_id', 'cooperative_society_name', 'local_langauge_society_name', 'registration_number', 'contact_person', 'email', 'mobile', 'status', 'district_id'],
          ...(societyDistrictScope ? { where: societyDistrictScope } : {})
        },
        {
          model: User,
          as: 'createdByUser',
          required: false,
          attributes: ['id', 'first_name', 'last_name', 'email', 'district_id']
        },
        {
          model: User,
          as: 'updatedByUser',
          required: false,
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        // Include media associations for bylaws (only if columns exist)
        {
          model: Media,
          as: 'existingByelawMedia',
          required: false
        },
        {
          model: Media,
          as: 'newProposedByelawMedia',
          required: false
        },
        {
          model: Media,
          as: 'byeLawsMedia',
          required: false,
          attributes: ['id', 'url']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(totalCount / limit);

    const amendmentsPlain = await Promise.all(
      amendments.map(async (row) => {
        const plain: any = row.get({ plain: true });
        await enrichAmendmentRcsObservationsForApplicant(plain, plain.id);
        return plain;
      })
    );

    return {
      amendments: amendmentsPlain as any,
      total: totalCount,
      page,
      limit,
      totalPages
    };
  } catch (error) {
    throw error;
  }
}
/**
 * Update amendment
 */
export async function updateAmendment(
  id: string,
  data: IAmendmentUpdate,
  req?: any,
  options?: { submit?: boolean }
): Promise<any> {
  try {
    const submit = options?.submit !== false;

    const amendment = await Amendment.findByPk(id, {
      include: [
        { model: Status, as: 'status', required: false }
      ]
    });
    if (!amendment) {
      return null;
    }

    const priorStatusKey = amendment.status?.key ?? null;

    if (submit) {
      // Determine the appropriate status based on current status
      let targetStatusId: string;
      if (amendment.status && amendment.status.key === 'draft') {
        const pendingStatus =
          (await findStatusByKey('pending')) || (await findStatusByKey('submitted'));
        if (!pendingStatus?.id) {
          throw new Error('Unable to find pending status');
        }
        targetStatusId = pendingStatus.id;
      } else {
        const resubmitStatus =
          (await findStatusByKey('resubmitted')) ||
          (await findStatusByKey('resubmit')) ||
          (await findStatusByKey('submitted'));
        if (!resubmitStatus?.id) {
          throw new Error('Unable to find resubmit status');
        }
        targetStatusId = resubmitStatus.id;
      }

      let workflowStatusId: string | null = null;
      try {
        workflowStatusId = await getWorkflowIdByModuleAndSequence('AMENDMENT', 1);
      } catch (workflowErr: any) {
        logger.warn('Failed to resolve AMENDMENT workflow step 1 on submit', {
          error: workflowErr?.message
        });
      }

      const { id: _id, amendment_id: _amendmentId, ...updateFields } = data as IAmendmentUpdate & {
        id?: string;
        amendment_id?: string;
      };

      await amendment.update({
        ...updateFields,
        status_id: targetStatusId,
        ...(workflowStatusId
          ? { workflow_status: workflowStatusId, assigned_to_user_id: null }
          : {}),
      });
    } else {
      // Draft save: persist fields only, keep current status (usually draft).
      const { status_id: _ignoredStatus, ...draftFields } = data;
      await amendment.update(draftFields);
    }

    // Process uploaded files if any
    if (req?.files && Object.keys(req.files).length > 0) {
      try {
        const mediaIds = await processAmendmentFiles(
          req.files,
          data.updated_by || ''
        );

        // Update amendment with media IDs
        if (Object.keys(mediaIds).length > 0) {
          await amendment.update(mediaIds);
        }
      } catch (fileError) {
        // Don't fail the amendment update if file processing fails
      }
    }

    // Process members_list if provided
    if (data.members && data.members.length > 0) {
      await processMembersList(
        data.members,
        amendment.society_id,
        data.updated_by || amendment.created_by || ''
      );
    }

    // Send notifications only when submitting (not on draft save)
    try {
      if (!submit) {
        await amendment.reload({ include: [{ model: Status, as: 'status', required: false }] });
        return amendment;
      }

      const action = priorStatusKey === 'draft' ? 'submitted' : 'resubmitted';
      const actionText = action === 'submitted' ? 'submitted' : 're-submitted';
      const actorId = data.updated_by || amendment.created_by || '';

      // Resolve society for activity log (PK first, then business society_id)
      const society =
        (await SocietyRegistration.findByPk(amendment.society_id)) ||
        (await SocietyRegistration.findOne({ where: { society_id: amendment.society_id } }));

      // Draft→submit / resubmit: notify drcs_arcs_district (seq-2), same as create & other modules
      await notifyAmendmentSubmittedToNextRole({
        amendmentId: amendment.id,
        societyId: amendment.society_id,
        createdBy: actorId,
        fallbackDistrictId: (req?.user?.district_id as string) || society?.district_id || null,
        logContext: priorStatusKey === 'draft' ? 'draft-submit' : 'resubmit'
      });

      if (society) {
        await createActivity({
          title: 'Amendment Status Updated',
          description: `Amendment has been ${actionText} for society: ${society.cooperative_society_name || 'N/A'}`,
          data: { amendment, society, action },
          created_by: actorId,
          reference_id: amendment.id
        });
      }

    } catch (notificationError) {
      logger.error('Failed to send notification for updated amendment', notificationError);
    }

    return amendment;
  } catch (error) {
    throw error;
  }
}
/**
 * Get amendments by society ID
 */
export async function getAmendmentsBySociety(societyId: string, userId?: string): Promise<Amendment[]> {
  try {
    // Get user details including district from database if userId is provided
    let user = null;
    if (userId) {
      user = await findUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
    }

    const societyDistrictScope = getAmendmentDistrictScope(user);

    const includeArray: any[] = [
      ...(societyDistrictScope ? [{
        model: SocietyRegistration,
        as: 'society',
        attributes: [],
        where: societyDistrictScope,
        required: true
      }] : []),
      { model: User, as: 'updatedByUser' }
    ];

    includeArray.push({
      model: User,
      as: 'createdByUser',
      attributes: ['id', 'first_name', 'last_name', 'email', 'district_id'],
      required: false
    });

    includeArray.push(
      { model: Status, as: 'status', required: false },
      {
        model: Media,
        as: 'byeLawsMedia',
        required: false,
        attributes: ['id', 'url']
      }
    );

    const amendments = await Amendment.findAll({
      where: { society_id: societyId },
      include: includeArray,
      order: [['created_at', 'DESC']]
    });

    const enriched: any[] = [];
    for (const amendment of amendments) {
      try {
        const media = await getAmendmentMedia(amendment.id);
        (amendment as any).media = media;
      } catch (mediaError) {
        (amendment as any).media = [];
      }

      const plain: any = amendment.get({ plain: true });
      await enrichAmendmentRcsObservationsForApplicant(plain, amendment.id);
      enriched.push(plain);
    }

    return enriched as any;
  } catch (error) {
    throw error;
  }
}

/**
 * Update amendment status
 */
export async function updateAmendmentStatus(id: string, statusId: string, updatedBy: string, req?: any, user?: any): Promise<Amendment | null> {
  try {
    // Force setup associations if they're not set up
    if (!Amendment.associations || Object.keys(Amendment.associations).length === 0) {
      Amendment.belongsTo(Status, { foreignKey: 'status_id', as: 'status' });
      Amendment.belongsTo(SocietyRegistration, { foreignKey: 'society_id', as: 'society' });
      Amendment.belongsTo(User, { foreignKey: 'created_by', as: 'createdByUser' });
      Amendment.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedByUser' });
    }

    const amendment = await Amendment.findOne({
      where: { id },
      include: [
        {
          model: SocietyRegistration,
          as: 'society',
          include: [
            {
              model: District,
              as: 'district',
              attributes: ['id', 'name'],
              required: false
            }
          ] as any
        }
      ]
    });
    if (!amendment) {
      return null;
    }

    await amendment.update({
      status_id: statusId,
      updated_by: updatedBy,
      status_changed_at: new Date(),
      status_changed_by: updatedBy
    });
    const status = await Status.findByPk(statusId);



    // ✅ New logic: update society_registration if Approved + Registrar
    if (status?.key === 'approved' && user?.role?.name === 'registrar') {

      logger.info('Status is approved and role is registrar, updating society_registration fields', {
        amendment_id: id,
        society_id: amendment.society_id
      });

      await SocietyRegistration.update(
        {
          society_type: req?.body?.society_type || null,
          sector_of_operation: req?.body?.sector_of_operation || null
        },
        { where: { id: amendment.society_id } }
      );
    }

    // Check if society data exists before generating certificate
    if (!amendment.society) {
      // Try to fetch society data separately
      const societyData = await SocietyRegistration.findByPk(amendment.society_id);
      if (!societyData) {
        throw new Error('Society not found in database');
      }

      // Attach society data to amendment object
      (amendment as any).society = societyData;
    }

    // Additional validation: Check if all required society fields exist
    const requiredFields = [
      'cooperative_society_name', 'local_langauge_society_name', 'registration_number',
      'date_registration', 'cooperative_society_type_id', 'registration_authoritie_id',
      'state_id', 'district_id', 'block_id', 'full_address', 'contact_person', 'mobile', 'email'
    ];

    const missingFields = requiredFields.filter(field => !amendment.society[field]);
    if (missingFields.length > 0) {
      // Some required fields are missing, but continue
    }

    let certificateData: Buffer;
    try {
      // Final safety check before calling generateSocietyCertificate
      if (!amendment.society || typeof amendment.society !== 'object') {
        throw new Error('Society data is not properly loaded');
      }

      const districtName = (amendment.society as any).district?.name || 'N/A';

      certificateData = await generateSocietyCertificate({
        societyId: amendment.society_id,
        societyName: amendment.society.cooperative_society_name || 'N/A',
        localLanguageName: amendment.society.local_langauge_society_name || 'N/A',
        registrationNumber: amendment.society.registration_number || 'N/A',
        dateOfRegistration: amendment.society.date_registration || 'N/A',
        societyType: amendment.society.cooperative_society_type_id || 'N/A',
        registrationAuthority: amendment.society.registration_authoritie_id || 'N/A',
        state: amendment.society.state_id || 'N/A',
        district: districtName,
        block: amendment.society.block_id || 'N/A',
        address: districtName,
        contactPerson: amendment.society.contact_person || 'N/A',
        mobile: amendment.society.mobile || 'N/A',
        email: amendment.society.email || 'N/A'
      });
    } catch (certificateError) {
      throw new Error(`Failed to generate certificate: ${certificateError instanceof Error ? certificateError.message : String(certificateError)}`);
    }

    let mediaUploaded;
    try {
      mediaUploaded = await mediaUpload({
        originalname: 'certificate.pdf',
        mimetype: 'application/pdf',
        size: certificateData.length,
        buffer: certificateData,
        userId: updatedBy
      }, updatedBy);

      try {
        const baseUrl = String(process.env.API_URL || '').replace(/\/+$/, '');
        const qrDownloadUrl = baseUrl
          ? `${baseUrl}/api/v1/public/media/${mediaUploaded.id}/download`
          : undefined;
        const issuer = await findUserById(updatedBy);
        const stamped = await stampCertificatePdfWithQr(
          {
            originalname: 'certificate.pdf',
            mimetype: 'application/pdf',
            size: certificateData.length,
            buffer: certificateData,
            userId: updatedBy
          },
          {
            societyRegistrationId: amendment.society_id,
            mediaId: mediaUploaded.id,
            certificateType: 'amendment',
            uploadedByUserId: updatedBy,
            uploadedByName: issuer
              ? `${issuer.first_name || ''} ${issuer.last_name || ''}`.trim() || undefined
              : undefined,
            qrDownloadUrl
          }
        );
        await overwriteMediaFileBuffer(mediaUploaded.id, stamped.buffer, updatedBy);
      } catch (stampErr: any) {
        logger.warn('Amendment certificate QR stamping failed', {
          amendmentId: id,
          mediaId: mediaUploaded.id,
          error: stampErr?.message || String(stampErr)
        });
      }

      await SocietyRegistration.update({
        certificate_media_id: mediaUploaded.id,
        certificate_issue_date: new Date()
      }, { where: { id: amendment.society_id } });
    } catch (mediaError) {
      throw new Error(`Failed to upload certificate media: ${mediaError instanceof Error ? mediaError.message : String(mediaError)}`);
    }

    // Determine notification based on updatedBy role and statusId
    try {
      const updatedUser = await User.findByPk(updatedBy, {
        include: [
          { model: Role, as: 'role', attributes: ['id', 'name', 'description'] }
        ]
      });

      if (!updatedUser || !updatedUser.role) return amendment;

      const statusDetails = await Status.findByPk(statusId);
      if (!statusDetails) return amendment;

      const statusKey = statusDetails.key || 'unknown';
      const statusTitle = statusDetails.title || 'Unknown Status';

      const applicantUserId = amendment.created_by || '';
      const districtId = (amendment as any).society?.district_id || 'default';


      await createActivity({
        title: 'Amendment Status Updated',
        description: `Amendment status updated by ${updatedUser.role.name} to ${statusKey}`,
        data: { amendment, statusDetails },
        created_by: updatedBy,
        reference_id: amendment.id
      });

      // Common notification payload
      const baseNotification = {
        title: `${(NOTIFICATIONS.notifications as any)?.amendment?.updated?.title || 'Amendment Updated'}`,
        description: `Amendment status updated by ${updatedUser.role.name} to ${statusKey}`,
        redirect_path: (NOTIFICATIONS.notifications as any)?.amendment?.updated?.path?.replace?.('{id}', amendment.id) || `/amendments/${amendment.id}`,
        data: { amendment, society: (amendment as any).society, statusKey },
        created_by: updatedBy
      };

      // send notification using switch case same as the society status update 
      switch (statusKey) {
        case 'rejected':
          // Status field_inspector_rejected: notify applicant
          if (applicantUserId) {
            const rejectionNotification = {
              ...baseNotification,
              title: 'Amendment - Field Inspector Rejected',
              description: `Your amendment request has been rejected by field inspector: ${(amendment as any).society?.cooperative_society_name || 'N/A'}`,
              created_by: updatedBy
            };
            await sendNotification(applicantUserId, rejectionNotification);
            
            // Send notification email to applicant
            const applicant = await findUserById(applicantUserId);
            if (applicant && applicant?.email) {
              await sendNotificationEmail(applicant?.email, rejectionNotification.title as any, rejectionNotification.description as any, baseNotification.redirect_path as any);
            }
            
            logger.info('Amendment rejection notification sent to applicant', { amendment_id: id, applicant_id: applicantUserId });
          }
          break;

        case 'approved':
          // Status field_inspector_approved: notify applicant and senior inspector
          if (applicantUserId) {
            const approvalNotification = {
              ...baseNotification,
              title: 'Amendment - Field Inspector Approved',
              description: `Your amendment request has been approved by field inspector: ${(amendment as any).society?.cooperative_society_name || 'N/A'}`,
              created_by: updatedBy
            };
            await sendNotification(applicantUserId, approvalNotification);
            
            // Send notification email to applicant
            const applicant = await findUserById(applicantUserId);
            if (applicant && applicant?.email) {
              await sendNotificationEmail(applicant?.email, approvalNotification.title as any, approvalNotification.description as any, baseNotification.redirect_path as any);
            }
            
            logger.info('Amendment approval notification sent to applicant', { amendment_id: id, applicant_id: applicantUserId });
          }
          
          // Notify senior inspector in the district
          try {
            await notifyInspectorsInDistrict(districtId, {
              ...baseNotification,
              title: 'Amendment - Field Inspector Approved',
              description: `Amendment request field inspector approved: ${(amendment as any).society?.cooperative_society_name || 'N/A'}`,
              created_by: updatedBy
            }, ['arcs']);
            
            // Send notification email to senior inspectors
            const arcs = await getUsers({ districtId, roleNames: ['arcs'] });
            const arcsEmails = arcs.map((i: any) => i.email).filter(Boolean);
            if (arcsEmails.length > 0) {
              await sendNotificationEmailToMultipleUsers(arcsEmails, 'Amendment - Field Inspector Approved' as any, 
                `Amendment request field inspector approved: ${(amendment as any).society?.cooperative_society_name || 'N/A'}`, baseNotification.redirect_path as any);
            }
            
            logger.info('Amendment field inspector approval notification sent to arcs', { amendment_id: id, district_id: districtId });
          } catch (error) {
            logger.warn('Failed to notify arcs about amendment field inspector approval', { amendment_id: id, district_id: districtId, error });
          }
          break;

        case 'ARC_approved':
          // Status ARCS_approved: notify applicant
          if (applicantUserId) {
            const dealingAssistantApprovedNotification = {
              ...baseNotification,
              title: 'Amendment - ARCS Approved',
              description: `Your amendment request has been approved by dealing assistant: ${(amendment as any).society?.cooperative_society_name || 'N/A'}`,
            created_by: updatedBy
            };
            await sendNotification(applicantUserId, dealingAssistantApprovedNotification);

            // send notification email to applicant
            const applicant = await findUserById(applicantUserId);
            if (applicant && applicant?.email) {
              await sendNotificationEmail(applicant?.email, dealingAssistantApprovedNotification.title as any, dealingAssistantApprovedNotification.description as any, baseNotification.redirect_path as any);
            }
            logger.info('Dealing assistant approved notification sent to applicant', { amendment_id: id, applicant_id: applicantUserId });

            // send notification to senior inspector
            try {
              await notifyInspectorsInDistrict(districtId, dealingAssistantApprovedNotification, ['senior_inspector']);
            } catch (error) {
              logger.warn('Failed to notify senior inspector about dealing assistant approval', { amendment_id: id, district_id: districtId, error });
            }
          }
        break;

        case 'ARC_rejected':
          // Status ARCS_rejected: notify applicant
          if (applicantUserId) {
            const dealingAssistantRejectedNotification = {
              ...baseNotification,
              title: 'Amendment - ARC Rejected',
              description: `Your amendment request has been rejected by dealing assistant: ${(amendment as any).society?.cooperative_society_name || 'N/A'}`,
              created_by: updatedBy
            };
            await sendNotification(applicantUserId, dealingAssistantRejectedNotification);
          }
        break;

        case 'senior_inspector_approved':
          // Status senior_inspector_approved: notify applicant and deputy registrar
          if (applicantUserId) {
            const seniorInspectorApprovedNotification = {
              ...baseNotification,
              title: 'Amendment - Senior Inspector Approved',
              description: `Your amendment request has been approved by senior inspector: ${(amendment as any).society?.cooperative_society_name || 'N/A'}`,
              created_by: updatedBy
            };
            await sendNotification(applicantUserId, seniorInspectorApprovedNotification);
            
            // Send notification email to applicant
            const applicant = await findUserById(applicantUserId);
            if (applicant && applicant?.email) {
              await sendNotificationEmail(applicant?.email, seniorInspectorApprovedNotification.title as any, seniorInspectorApprovedNotification.description as any, baseNotification.redirect_path as any);
            }

            // send notification to deputy registrar
            try {
              await notifyRegistrarsInDistrict(districtId, seniorInspectorApprovedNotification, ['deputy_registrar','joint_registrar','registrar']);
            } catch (error) {
              logger.warn('Failed to notify deputy registrar about amendment senior inspector approval', { amendment_id: id, district_id: districtId, error });
            }
            
            logger.info('Amendment senior inspector approved notification sent to applicant', { amendment_id: id, applicant_id: applicantUserId });
          }

          break;

        case 'senior_inspector_rejected':
          // Status senior_inspector_rejected: notify applicant
          if (applicantUserId) {
            const seniorInspectorRejectedNotification = {
              ...baseNotification,
              title: 'Amendment - Senior Inspector Rejected',
              description: `Your amendment request has been rejected by senior inspector: ${(amendment as any).society?.cooperative_society_name || 'N/A'}`,
              created_by: updatedBy
            };
            await sendNotification(applicantUserId, seniorInspectorRejectedNotification);
            
            // Send notification email to applicant
            const applicant = await findUserById(applicantUserId);
            if (applicant && applicant?.email) {
              await sendNotificationEmail(applicant?.email, seniorInspectorRejectedNotification.title as any, seniorInspectorRejectedNotification.description as any, baseNotification.redirect_path as any);
            }
            
            logger.info('Amendment senior inspector rejected notification sent to applicant', { amendment_id: id, applicant_id: applicantUserId });
          }
          break;

        case 'deputy_registrar_approved':
          // Status deputy_registrar_approved: notify applicant and registrar
          if (applicantUserId) {
            const deputyRegistrarApprovedNotification = {
              ...baseNotification,
              title: 'Amendment - Deputy Registrar Approved',
              description: `Your amendment request has been approved by deputy registrar: ${(amendment as any).society?.cooperative_society_name || 'N/A'}`,
              created_by: updatedBy
            };
            await sendNotification(applicantUserId, deputyRegistrarApprovedNotification);
            
            // Send notification email to applicant
            const applicant = await findUserById(applicantUserId);
            if (applicant && applicant?.email) {
              await sendNotificationEmail(applicant?.email, deputyRegistrarApprovedNotification.title as any, deputyRegistrarApprovedNotification.description as any, baseNotification.redirect_path as any);
            }
            
            logger.info('Amendment deputy registrar approved notification sent to applicant', { amendment_id: id, applicant_id: applicantUserId });
          }

          // Notify registrar in the district
          try {
            await notifyRegistrarsInDistrict(districtId, {
              ...baseNotification,
              title: 'Amendment - Deputy Registrar Approved',
              description: `Amendment request deputy registrar approved: ${(amendment as any).society?.cooperative_society_name || 'N/A'}`,
              created_by: updatedBy
            }, ['registrar']);
            
            // Send notification email to registrars
            const registrars = await getUsers({ districtId, roleNames: ['registrar'] });
            const registrarEmails = registrars.map((i: any) => i.email).filter(Boolean);
            if (registrarEmails.length > 0) {
              await sendNotificationEmailToMultipleUsers(registrarEmails, 'Amendment - Deputy Registrar Approved' as any, 
                `Amendment request deputy registrar approved: ${(amendment as any).society?.cooperative_society_name || 'N/A'}`, baseNotification.redirect_path as any);
            }
            
            logger.info('Amendment deputy registrar approval notification sent to registrar', { amendment_id: id, district_id: districtId });
          } catch (error) {
            logger.warn('Failed to notify registrar about amendment deputy registrar approval', { amendment_id: id, district_id: districtId, error });
          }
          break;

        case 'deputy_registrar_rejected':
          // Status deputy_registrar_rejected: notify applicant
          if (applicantUserId) {
            const deputyRegistrarRejectedNotification = {
              ...baseNotification,
              title: 'Amendment - Deputy Registrar Rejected',
              description: `Your amendment request has been rejected by deputy registrar: ${(amendment as any).society?.cooperative_society_name || 'N/A'}`,
              created_by: updatedBy
            };
            await sendNotification(applicantUserId, deputyRegistrarRejectedNotification);
            
            // Send notification email to applicant
            const applicant = await findUserById(applicantUserId);
            if (applicant && applicant?.email) {
              await sendNotificationEmail(applicant?.email, deputyRegistrarRejectedNotification.title as any, deputyRegistrarRejectedNotification.description as any, baseNotification.redirect_path as any);
            }
            
            logger.info('Amendment deputy registrar rejected notification sent to applicant', { amendment_id: id, applicant_id: applicantUserId });
          }
          break;

        case 'registrar_approved':
          // Status registrar_approved: notify applicant
          if (applicantUserId) {
            const registrarApprovedNotification = {
              ...baseNotification,
              title: 'Amendment - Registrar Approved',
              description: `Your amendment request has been approved by registrar: ${(amendment as any).society?.cooperative_society_name || 'N/A'}`,
              created_by: updatedBy
            };
            await sendNotification(applicantUserId, registrarApprovedNotification);
            
            // Send notification email to applicant
            const applicant = await findUserById(applicantUserId);
            if (applicant && applicant?.email) {
              await sendNotificationEmail(applicant?.email, registrarApprovedNotification.title as any, registrarApprovedNotification.description as any, baseNotification.redirect_path as any);
            }
            
            logger.info('Amendment registrar approved notification sent to applicant', { amendment_id: id, applicant_id: applicantUserId });
          }
          break;

        case 'registrar_rejected':
          // Status registrar_rejected: notify applicant
          if (applicantUserId) {
            const registrarRejectedNotification = {
              ...baseNotification,
              title: 'Amendment - Registrar Rejected',
              description: `Your amendment request has been rejected by registrar: ${(amendment as any).society?.cooperative_society_name || 'N/A'}`,
              created_by: updatedBy
            };
            await sendNotification(applicantUserId, registrarRejectedNotification);
            
            // Send notification email to applicant
            const applicant = await findUserById(applicantUserId);
            if (applicant && applicant?.email) {
              await sendNotificationEmail(applicant?.email, registrarRejectedNotification.title as any, registrarRejectedNotification.description as any, baseNotification.redirect_path as any);
            }
            
            logger.info('Amendment registrar rejected notification sent to applicant', { amendment_id: id, applicant_id: applicantUserId });
          }
          break;

        default:
          // For other status types, use role-based notification logic
          if (['field_inspector', 'senior_inspector'].includes(updatedUser.role.name)) {
            // Inspector changed status: notify registrars
            try {
              await notifyInspectorsInDistrict(districtId, {
                ...baseNotification,
                title: `Amendment Status Updated by Inspector`,
                description: `Amendment request status updated by inspector: ${(amendment as any).society?.cooperative_society_name || 'N/A'}`
              }, ['field_inspector', 'senior_inspector']);
              logger.info('Amendment inspector status update notification sent to registrars', { amendment_id: id, district_id: districtId, status: statusKey });
            } catch (error) {
              logger.warn('Failed to notify registrars about amendment inspector status update', { amendment_id: id, district_id: districtId, error });
            }
          } else if (['arcs', 'deputy_registrar', 'registrar'].includes(updatedUser.role.name)) {
            // Registrar changed status: notify inspectors
            try {
              await notifyInspectorsInDistrict(districtId, {
                ...baseNotification,
                title: `Amendment Status Updated by Registrar`,
                description: `Amendment request status updated by registrar: ${(amendment as any).society?.cooperative_society_name || 'N/A'}`
              }, ['field_inspector', 'senior_inspector']);
              logger.info('Amendment registrar status update notification sent to inspectors', { amendment_id: id, district_id: districtId, status: statusKey });
            } catch (error) {
              logger.warn('Failed to notify inspectors about amendment registrar status update', { amendment_id: id, district_id: districtId, error });
            }
          } else {
            // Other roles: notify applicant
            if (applicantUserId) {
              const generalNotification = {
                ...baseNotification,
                title: `Amendment Status Updated`,
                description: `Amendment request status has been updated: ${(amendment as any).society?.cooperative_society_name || 'N/A'}`
              };
              await sendNotification(applicantUserId, generalNotification);
              logger.info('General amendment status update notification sent to applicant', { amendment_id: id, applicant_id: applicantUserId, status: statusKey });
            }
          }
          break;
      }

      logger.info('Amendment status update notifications completed successfully', {
        amendment_id: id,
        status: statusKey,
        changed_by_role: updatedUser.role.name
      });
      
    } catch (notificationError) {
      logger.error('Failed to send notification for amendment status update', notificationError);
    }


    return amendment;
  } catch (error) {
    throw error;
  }
}

/**
 * Get amendment details by user ID
 */
export async function getAmendmentDetailsByUserId(userId: string): Promise<any | null> {
  try {
    // Force setup associations if they're not set up
    if (!Amendment.associations || Object.keys(Amendment.associations).length === 0) {
      Amendment.belongsTo(Status, { foreignKey: 'status_id', as: 'status' });
      Amendment.belongsTo(SocietyRegistration, { foreignKey: 'society_id', as: 'society' });
      Amendment.belongsTo(User, { foreignKey: 'created_by', as: 'createdByUser' });
      Amendment.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedByUser' });
    }

    let amendments = await Amendment.findAll({
      where: { created_by: userId },
      include: [
        {
          model: Status,
          as: 'status'
        },
        {
          model: SocietyRegistration,
          as: 'society',
          attributes: ['id', 'cooperative_society_name', 'registration_number', 'society_id', 'local_langauge_society_name', 'society_type', 'sector_of_operation', 'district_id'],
          include: [
            {
              model: District,
              as: 'district',
              required: false,
              attributes: ['id', 'name']
            },
            {
              model: SocietyType,
              as: 'societyType',
              required: false,
              attributes: ['id', 'title']
            },
            {
              model: SectorOfOperation,
              as: 'sectorOfOperation',
              required: false,
              attributes: ['id', 'name']
            },
          ]
        },
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        // Include media associations for bylaws
        {
          model: Media,
          as: 'existingByelawMedia',
          required: false
        },
        {
          model: Media,
          as: 'newProposedByelawMedia',
          required: false
        },
        {
          model: Media,
          as: 'circularNoticeMedia',
          required: false
        },
        {
          model: Media,
          as: 'minutesOfMeetingMedia',
          required: false
        },
        {
          model: Media,
          as: 'attendanceSheetMedia',
          required: false
        },
        {
          model: Media,
          as: 'meetingNoticeAgendaMedia',
          required: false
        },
        {
          model: Media,
          as: 'copyOfNoticeFormGMedia',
          required: false
        },
        {
          model: Media,
          as: 'districtDrcsArcsRecommendationMedia',
          required: false
        },
        {
          model: Media,
          as: 'byeLawsMedia',
          required: false,
          attributes: ['id', 'url']
        }

      ],
      order: [['created_at', 'DESC']],
    });

    if (!amendments || amendments.length === 0) {
      return [];
    }

    // Fetch members list for each amendment's society (same byeLawsMedia resolution as getAmendmentById)
    const amendmentsWithMembers = await Promise.all(
      amendments.map(async (amendment) => {
        const membersList = await Member.findAll({
          where: { society_id: amendment.society_id, is_active: true },
          raw: true
        });

        const item: any = {
          ...amendment.get({ plain: true }),
          members: membersList
        };

        try {
          if (amendment.workflow_status) {
            const workflowStatus = await getWorkflowStatus(amendment.id, 'AMENDMENT', false);
            item.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
          } else {
            item.workflowStatus = {};
          }
        } catch {
          item.workflowStatus = {};
        }

        try {
          item.previousCommentDocuments = await getLatestCommentDocuments(amendment.id, 'AMENDMENT');
        } catch {
          item.previousCommentDocuments = [];
        }

        await attachCompleteProcessingHistoryToDetail(item, amendment.id, 'AMENDMENT');
        applyAmendmentRcsObservationsAliases(item);

        return item;
      })
    );

    return amendmentsWithMembers;
  } catch (error) {
    throw error;
  }
} 