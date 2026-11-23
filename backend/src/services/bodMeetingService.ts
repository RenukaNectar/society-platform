import { Op } from 'sequelize';

import GeneralBodyMeeting from '../models/GeneralBodyMeetings';
import Module from '../models/Module';
import ModuleWorkflow from '../models/ModuleWorkflow';
import SocietyRegistration from '../models/SocietyRegistration';
import logger from '../utils/logger';
import { AppError } from '../utils/errors';
import {
  formatWorkflowStatusForApi,
  getWorkflowStatus,
  getWorkflowIdByModuleAndSequence
} from './WorkflowUtilService';
import { getLatestCommentDocuments, attachCompleteProcessingHistoryToDetail } from './WorkflowCommentService';
import { findHistoryByReference } from './HistoryService';
import { getWorkflowsByModuleId } from './ModuleWorkflowService';
import { findStatusByKey } from './StatusService';
import { NOTIFICATIONS } from '../config/notifications';
import { notifyInspectorsInDistrict } from './NotificationService';
import { normalizeElectedBodMembersWithShareholderCategory } from './meetingBodMemberService';
import { enrichDeletedMembersWithMedia } from '../utils/enrichDeletedMembers';

const MODULE_KEY = 'BOD';
const MEETING_TYPE = 'BOD';

interface BodMeetingData {
  society_id: string;
  society_name: string;
  meeting_date: Date;
  chairman_name?: string | null;
  total_shareholders: number;
  attended_shareholders: number;
  media_id?: string | null;
  attendance_sheet_id?: string | null;
  minutes_of_meeting_id?: string | null;
  notice_id?: string | null;
  comments?: string | null;
  elected_bod_members?: any[] | null;
  deleted_members?: any[] | null;
  created_by: string | null;
}

export const createBodMeetingService = async (meetingData: BodMeetingData, createdBy: string | null) => {
  try {
    const workflowStatusId = await getWorkflowIdByModuleAndSequence(MODULE_KEY, 1);
    if (!workflowStatusId) {
      throw new AppError('First workflow step not found for BOD module.', 500);
    }

    const submittedStatus = await findStatusByKey('submitted');
    const { workflow_status, assigned_to_user_id, status, ...payload } = meetingData as any;

    const createData = {
      ...payload,
      // Prevent FK failures when optional media fields come as empty strings.
      media_id: payload.media_id || null,
      attendance_sheet_id: payload.attendance_sheet_id || null,
      minutes_of_meeting_id: payload.minutes_of_meeting_id || null,
      notice_id: payload.notice_id || null,
      elected_bod_members: normalizeElectedBodMembersWithShareholderCategory(
        payload.elected_bod_members
      ),
      created_by: createdBy as string,
      meeting_type: MEETING_TYPE,
      workflow_status: workflowStatusId,
      status: submittedStatus?.id || null
    };

    const meeting = await GeneralBodyMeeting.create(createData);

    // Elected members are written to `members` only after final RCS approval
    // (see WorkflowUtilService) so My-Society does not show them earlier.

    // Fire-and-forget notification: creation should not fail if notification fails.
    try {
      const societyReg = await SocietyRegistration.findByPk(meeting.society_id, {
        attributes: ['id', 'district_id']
      });
      const districtId = societyReg?.district_id as string | undefined;
      if (!districtId) {
        logger.warn('BOD meeting created but society has no district_id; skipping notification', {
          bodMeetingId: meeting.id,
          society_id: meeting.society_id
        });
        return meeting;
      }

      const notificationData = {
        title: NOTIFICATIONS.notifications.board_of_directors_meeting.created.title as any,
        description: `A new BOD meeting has been submitted in your district for society ${(meeting as any).society_name || ''}`.trim(),
        data: JSON.stringify({ bodMeeting: meeting }),
        redirect_path: NOTIFICATIONS.notifications.board_of_directors_meeting.created.path.replace('{id}', String(meeting.id)),
        created_by: meeting.created_by as string | undefined
      };

      await notifyInspectorsInDistrict(districtId, notificationData, ['drcs_arcs_district']);
      logger.info('drcs_arcs_district notifications sent successfully for BOD meeting', notificationData);
    } catch (notifyErr) {
      logger.error('Failed to send notification for new BOD meeting', notifyErr as Error);
    }

    return meeting;
  } catch (error) {
    logger.error('Error in createBodMeetingService:', error as Error);
    throw error as Error;
  }
};

export const getAllBodMeetingsService = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  society_id?: string,
  created_by?: string | null,
  userRole?: string,
  userDistrictId?: string | null,
  isHq?: boolean
) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = { meeting_type: MEETING_TYPE };
    const role = userRole || '';
    const districtScopedRoles = ['drcs_arcs_district', 'jics_sics_district'];
    const allDistrictAccessRoles = ['drcs_arcs_hq', 'jics_sics_hq', 'rcs_district', 'jt_rcs_district'];

    if (role === 'applicant' && created_by) {
      whereClause.created_by = created_by;
    } else if (districtScopedRoles.includes(role) && userDistrictId) {
      whereClause['$societyRegistration.district_id$'] = userDistrictId;
    } else if (
      role !== 'admin' &&
      role !== 'applicant' &&
      !allDistrictAccessRoles.includes(role) &&
      !isHq &&
      userDistrictId
    ) {
      // Keep previous safe default for unknown/non-HQ roles.
      whereClause['$societyRegistration.district_id$'] = userDistrictId;
    }

    if (society_id) {
      whereClause.society_id = society_id;
    }

    if (search) {
      whereClause[Op.or] = [
        { society_name: { [Op.iLike]: `%${search}%` } },
        { chairman_name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: meetings } = await GeneralBodyMeeting.findAndCountAll({
      where: whereClause,
      order: [['meeting_date', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
      include: [
        {
          association: 'workflowStatus',
          attributes: ['id', 'sequence', 'allowed_role_id', 'approval_status_id', 'reject_status_id', 'assigned_to'],
          required: false
        },
        {
          association: 'societyRegistration',
          attributes: ['id', 'cooperative_society_name', 'registration_number', 'district_id']
        },
        {
          association: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          association: 'statusDetails',
          attributes: ['id', 'key', 'title'],
          required: false
        },
        { association: 'media', attributes: ['id', 'url'] },
        { association: 'attendanceSheet', attributes: ['id', 'url'] },
        { association: 'minutesOfMeeting', attributes: ['id', 'url'] },
        { association: 'notice', attributes: ['id', 'url'] }
      ]
    });

    const totalPages = Math.ceil(count / limit);
    return {
      meetings,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    logger.error('Error in getAllBodMeetingsService:', error);
    throw error;
  }
};

export const getBodMeetingByIdService = async (
  id: string,
  userId?: string,
  userRole?: string,
  userDistrictId?: string | null,
  isHq?: boolean
) => {
  try {
    const meeting = await GeneralBodyMeeting.findOne({
      where: { id, meeting_type: MEETING_TYPE },
      include: [
        {
          association: 'workflowStatus',
          attributes: ['id', 'sequence', 'allowed_role_id', 'approval_status_id', 'reject_status_id', 'assigned_to', 'module_id'],
          required: false
        },
        {
          association: 'societyRegistration',
          attributes: ['id', 'cooperative_society_name', 'registration_number', 'district_id']
        },
        { association: 'creator', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { association: 'media', attributes: ['id', 'url'] },
        { association: 'attendanceSheet', attributes: ['id', 'url'] },
        { association: 'minutesOfMeeting', attributes: ['id', 'url'] },
        { association: 'notice', attributes: ['id', 'url'] },
        { association: 'byeLawsMedia', attributes: ['id', 'url'], required: false },
        { association: 'statusDetails', attributes: ['id', 'key', 'title'], required: false },
        { association: 'assignedToUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false }
      ]
    });

    if (!meeting) {
      throw new AppError('BOD meeting not found', 404);
    }

    if (userRole === 'applicant' && userId && meeting.created_by !== userId) {
      throw new AppError('You do not have access to this BOD meeting', 403);
    }

    const role = userRole || '';
    const districtScopedRoles = ['drcs_arcs_district', 'jics_sics_district'];
    const allDistrictAccessRoles = ['drcs_arcs_hq', 'jics_sics_hq', 'rcs_district', 'jt_rcs_district'];

    if (districtScopedRoles.includes(role) && userDistrictId) {
      const societyReg = (meeting as any).societyRegistration ?? meeting.get('societyRegistration');
      const societyDistrictId = societyReg?.district_id ?? null;
      if (societyDistrictId !== userDistrictId) {
        throw new AppError('You do not have access to this BOD meeting', 403);
      }
    } else if (
      role !== 'admin' &&
      role !== 'applicant' &&
      !allDistrictAccessRoles.includes(role) &&
      !isHq &&
      userDistrictId
    ) {
      const societyReg = (meeting as any).societyRegistration ?? meeting.get('societyRegistration');
      const societyDistrictId = societyReg?.district_id ?? null;
      if (societyDistrictId !== userDistrictId) {
        throw new AppError('You do not have access to this BOD meeting', 403);
      }
    }

    const result = meeting.toJSON ? meeting.toJSON() : meeting.get({ plain: true });

    try {
      const module = await Module.findOne({ where: { key: MODULE_KEY, active: true } });
      result.workflowLevels = module ? await getWorkflowsByModuleId(module.id) : [];
    } catch (workflowErr) {
      logger.warn('Failed to get workflow levels for BOD', { id, error: (workflowErr as Error)?.message });
      result.workflowLevels = [];
    }

    try {
      const workflowStatus = await getWorkflowStatus(id, MODULE_KEY, false);
      result.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
    } catch (workflowErr) {
      logger.warn('Failed to get workflow status for BOD', { id, error: (workflowErr as Error)?.message });
      result.workflowStatus = {
        current: null,
        next: null,
        previous: null,
        currentStatus: null,
        assignedToRole: null,
        assignedToUserIds: null,
        assignedToUserId: null,
        assignedUser: null
      };
    }

    try {
      result.previousCommentDocuments = await getLatestCommentDocuments(id, MODULE_KEY);
    } catch (documentsErr: any) {
      logger.warn('Failed to get previous comment documents for BOD', { id, error: documentsErr?.message });
      result.previousCommentDocuments = [];
    }

    try {
      result.history = await findHistoryByReference(id, MODULE_KEY);
    } catch (historyErr: any) {
      logger.warn('Failed to get history for BOD', { id, error: historyErr?.message });
      result.history = [];
    }

    await attachCompleteProcessingHistoryToDetail(result, id, MODULE_KEY);

    try {
      result.deleted_members = await enrichDeletedMembersWithMedia(result.deleted_members, {
        module: 'BOD',
        id,
      });
    } catch (deletedMembersErr: any) {
      logger.warn('Failed to enrich deleted_members media for BOD', {
        id,
        error: deletedMembersErr?.message,
      });
    }

    return result;
  } catch (error) {
    logger.error('Error in getBodMeetingByIdService:', error);
    throw error;
  }
};
