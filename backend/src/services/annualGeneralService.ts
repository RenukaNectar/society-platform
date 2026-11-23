import { Op } from 'sequelize';

import GeneralBodyMeeting from '../models/GeneralBodyMeetings';
import Module from '../models/Module';
import ModuleWorkflow from '../models/ModuleWorkflow';
import Role from '../models/Role';
import SocietyRegistration from '../models/SocietyRegistration';
import Status from '../models/Status';
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
import { findStatusById, findStatusByKey } from './StatusService';
import { createHistory } from './HistoryService';
import { NOTIFICATIONS } from '../config/notifications';
import { notifyInspectorsInDistrict } from './NotificationService';
import { getDistrictById } from './DistrictService';
import { normalizeElectedBodMembersWithShareholderCategory } from './meetingBodMemberService';
import { enrichDeletedMembersWithMedia } from '../utils/enrichDeletedMembers';

const MODULE_KEY = 'AGM';
const MEETING_TYPE = 'AGM';
const EXCLUDED_AGM_STATUS_KEYS = ['rejected', 'reverted'] as const;

export type AgmCalendarYearEligibility = {
    calendarYear: number;
    canCreate: boolean;
    existingAgm: { id: string; meeting_date: Date } | null;
};

const getCalendarYearFromDate = (meetingDate: Date | string): number => {
    const date = new Date(meetingDate);
    if (Number.isNaN(date.getTime())) {
        throw new AppError('Invalid meeting date', 400);
    }
    return date.getFullYear();
};

const getCalendarYearRange = (calendarYear: number): { start: Date; end: Date } => ({
    start: new Date(calendarYear, 0, 1, 0, 0, 0, 0),
    end: new Date(calendarYear, 11, 31, 23, 59, 59, 999)
});

const getExcludedAgmStatusIds = async (): Promise<string[]> => {
    const ids: string[] = [];
    for (const key of EXCLUDED_AGM_STATUS_KEYS) {
        const status = await findStatusByKey(key);
        if (status?.id) ids.push(status.id);
    }
    return ids;
};

export const findBlockingAgmForCalendarYear = async (
    societyId: string,
    calendarYear: number,
    excludeAgmId?: string
) => {
    const excludedStatusIds = await getExcludedAgmStatusIds();
    const { start, end } = getCalendarYearRange(calendarYear);

    const whereClause: any = {
        society_id: societyId,
        meeting_type: MEETING_TYPE,
        active: true,
        meeting_date: { [Op.between]: [start, end] }
    };

    if (excludedStatusIds.length > 0) {
        whereClause[Op.and] = [
            {
                [Op.or]: [
                    { status: { [Op.notIn]: excludedStatusIds } },
                    { status: { [Op.is]: null } }
                ]
            }
        ];
    }

    if (excludeAgmId) {
        whereClause.id = { [Op.ne]: excludeAgmId };
    }

    return GeneralBodyMeeting.findOne({
        where: whereClause,
        attributes: ['id', 'meeting_date'],
        order: [['meeting_date', 'DESC']]
    });
};

export const getAgmCalendarYearEligibility = async (
    societyId: string,
    calendarYear: number = new Date().getFullYear()
): Promise<AgmCalendarYearEligibility> => {
    if (!societyId) {
        throw new AppError('Society ID is required', 400);
    }
    if (!Number.isInteger(calendarYear) || calendarYear < 1900 || calendarYear > 2100) {
        throw new AppError('Invalid calendar year', 400);
    }

    const existingAgm = await findBlockingAgmForCalendarYear(societyId, calendarYear);

    return {
        calendarYear,
        canCreate: !existingAgm,
        existingAgm: existingAgm
            ? {
                id: existingAgm.id,
                meeting_date: existingAgm.meeting_date
            }
            : null
    };
};

export const assertAgmOncePerCalendarYear = async (
    societyId: string,
    meetingDate: Date | string,
    excludeAgmId?: string
): Promise<void> => {
    const calendarYear = getCalendarYearFromDate(meetingDate);
    const existingAgm = await findBlockingAgmForCalendarYear(societyId, calendarYear, excludeAgmId);

    if (existingAgm) {
        throw new AppError(
            `An Annual General Meeting has already been recorded for ${calendarYear}. Only one AGM is allowed per calendar year (1 January to 31 December).`,
            409
        );
    }
};

interface AnnualGeneralMeetingData {
    society_id: string;
    society_name: string;
    meeting_date: Date;
    chairman_name: string;
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

export const createAnnualGeneralMeetingService = async (agmData: AnnualGeneralMeetingData, createdBy: string | null) => {
    try {
        await assertAgmOncePerCalendarYear(agmData.society_id, agmData.meeting_date);

        // Set workflow_status to first workflow step (sequence 1) for AGM
        const workflowStatusId = await getWorkflowIdByModuleAndSequence(MODULE_KEY, 1);
        if (!workflowStatusId) {
            throw new AppError('First workflow step (sequence 1) not found for AGM module. Please ensure workflow steps are seeded.', 500);
        }

        // Set status to first step status (submitted) when using workflow
        let initialStatusId: string | null = null;
        if (workflowStatusId) {
            const submittedStatus = await findStatusByKey('submitted');
            if (submittedStatus) {
                initialStatusId = submittedStatus.id;
            }
        }

        // Remove workflow fields from data if provided (we set them automatically)
        const { workflow_status, assigned_to_user_id, status, ...dataWithoutWorkflowFields } = agmData as any;

        const createData = {
            ...dataWithoutWorkflowFields,
            elected_bod_members: normalizeElectedBodMembersWithShareholderCategory(
                dataWithoutWorkflowFields.elected_bod_members
            ),
            created_by: createdBy as string,
            meeting_type: MEETING_TYPE,
            workflow_status: workflowStatusId, // Always set to first workflow step
            status: initialStatusId // Set to submitted status
        };

        const newAnnualGeneralMeeting = await GeneralBodyMeeting.create(createData);
        logger.info('Annual General Meeting created successfully with workflow step 1', {
            agmId: newAnnualGeneralMeeting.id,
            workflow_status: workflowStatusId,
            status: initialStatusId
        });

        // Elected members are written to `members` only after final RCS approval
        // (see WorkflowUtilService) so My-Society does not show them earlier.

        // Notify next-step role in the society's district (first arg must be district_id, not society_registration id)
        try {
            // GeneralBodyMeeting.create() does not include associations, so resolve district_id via SocietyRegistration
            const societyReg = await SocietyRegistration.findByPk(newAnnualGeneralMeeting.society_id, {
                attributes: ['id', 'district_id']
            });
            const districtId = societyReg?.district_id as string | undefined;
            if (!districtId) {
                logger.warn('AGM created but society has no district_id; skipping notification', {
                    agmId: newAnnualGeneralMeeting.id,
                    society_id: newAnnualGeneralMeeting.society_id
                });
                return newAnnualGeneralMeeting;
            }

            // Optional: verify district exists (keeps old intent, but doesn't crash on missing association)
            const district = await getDistrictById(districtId);
            if (!district?.id) {
                throw new AppError('District not found', 404);
            }
            const notificationData = {
                title: NOTIFICATIONS.notifications.annual_general_meeting.created.title as any,
                description: `A new annual general meeting has been submitted in your district for society ${newAnnualGeneralMeeting.society_name}`,
                data: JSON.stringify({ annualGeneralMeeting: newAnnualGeneralMeeting }),
                redirect_path: NOTIFICATIONS.notifications.annual_general_meeting.created.path.replace('{id}', newAnnualGeneralMeeting.id),
                created_by: newAnnualGeneralMeeting.created_by as string | undefined
            };
            await notifyInspectorsInDistrict(district.id, notificationData, [
                'drcs_arcs_district'
            ]);
            logger.info('drcs_arcs_district notifications sent successfully', notificationData);
        } catch (error) {
            logger.error('Failed to send notification for new annual general meeting', error as Error);
        }

        return newAnnualGeneralMeeting;
    } catch (error) {
        logger.error('Error in createAnnualGeneralMeetingService:', error as Error);
        throw error as Error;
    }
};

const RESUBMIT_ALLOWED_STATUS_KEYS = ['rejected', 'reverted', 'resubmit'] as const;

export const resubmitAnnualGeneralMeetingService = async (
    id: string,
    agmData: Partial<AnnualGeneralMeetingData>,
    userId: string
) => {
    try {
        const meeting = await GeneralBodyMeeting.findOne({
            where: { id, meeting_type: MEETING_TYPE, active: true }
        });

        if (!meeting) {
            throw new AppError('Annual General Meeting not found', 404);
        }

        if (meeting.created_by !== userId) {
            throw new AppError('Only the applicant who submitted this AGM can correct and re-submit it', 403);
        }

        const currentStatus = meeting.status ? await findStatusById(meeting.status) : null;
        if (!currentStatus || !RESUBMIT_ALLOWED_STATUS_KEYS.includes(currentStatus.key as typeof RESUBMIT_ALLOWED_STATUS_KEYS[number])) {
            throw new AppError(
                'AGM can only be corrected and re-submitted when it has been returned for rectification (rejected or reverted)',
                403
            );
        }

        let resubmittedStatus = await findStatusByKey('resubmitted');
        if (!resubmittedStatus) {
            resubmittedStatus = await findStatusByKey('resubmit');
        }
        if (!resubmittedStatus) {
            throw new AppError('Resubmitted status not found', 500);
        }

        const workflowStatusId = await getWorkflowIdByModuleAndSequence(MODULE_KEY, 1);
        if (!workflowStatusId) {
            throw new AppError('First workflow step (sequence 1) not found for AGM module. Please ensure workflow steps are seeded.', 500);
        }

        const meetingDate = agmData.meeting_date ?? meeting.meeting_date;
        const societyId = agmData.society_id ?? meeting.society_id;
        await assertAgmOncePerCalendarYear(societyId, meetingDate, id);

        const {
            workflow_status: _discardWorkflowStatus,
            assigned_to_user_id: _discardAssignedTo,
            status: _discardStatus,
            created_by: _discardCreatedBy,
            meeting_type: _discardMeetingType,
            ...updatePayload
        } = agmData as any;

        await meeting.update({
            ...updatePayload,
            ...(updatePayload.elected_bod_members !== undefined
                ? {
                    elected_bod_members: normalizeElectedBodMembersWithShareholderCategory(
                        updatePayload.elected_bod_members
                    ),
                }
                : {}),
            status: resubmittedStatus.id,
            workflow_status: workflowStatusId,
            assigned_to_user_id: null,
        });

        // Do not upsert into `members` on resubmit — only after final RCS approval.

        // Slim snapshot only — full getById payload (history/workflowLevels/etc.) exceeds history.data TEXT.
        try {
            await createHistory({
                resource: MODULE_KEY,
                type: 'resubmit',
                reference_id: id,
                created_by: userId,
                comments: `Annual General Meeting corrected and re-submitted for society: ${meeting.society_name}`,
                data: JSON.stringify({
                    annualGeneralMeeting: {
                        id: meeting.id,
                        society_id: meeting.society_id,
                        society_name: meeting.society_name,
                        meeting_date: meeting.meeting_date,
                        status: resubmittedStatus.id,
                        status_key: resubmittedStatus.key,
                        workflow_status: workflowStatusId,
                        previous_status_key: currentStatus.key,
                    },
                }),
            });
        } catch (historyErr) {
            logger.error('Failed to create history for AGM resubmit (AGM already updated)', historyErr as Error);
        }

        try {
            const societyReg = await SocietyRegistration.findByPk(meeting.society_id, {
                attributes: ['id', 'district_id']
            });
            const districtId = societyReg?.district_id as string | undefined;
            if (districtId) {
                const notificationData = {
                    title: 'Annual General Meeting Resubmitted',
                    description: `An annual general meeting has been corrected and re-submitted for society ${meeting.society_name}`,
                    data: JSON.stringify({
                        annualGeneralMeeting: {
                            id: meeting.id,
                            society_id: meeting.society_id,
                            society_name: meeting.society_name,
                        },
                    }),
                    redirect_path: NOTIFICATIONS.notifications.annual_general_meeting.created.path.replace('{id}', meeting.id),
                    created_by: userId
                };
                await notifyInspectorsInDistrict(districtId, notificationData, ['drcs_arcs_district']);
            }
        } catch (notifyErr) {
            logger.error('Failed to send notification for AGM resubmit', notifyErr as Error);
        }

        const updatedMeeting = await getAnnualGeneralMeetingByIdService(id, userId, 'applicant');

        logger.info('Annual General Meeting resubmitted successfully', {
            agmId: id,
            userId,
            previousStatusKey: currentStatus.key
        });

        return updatedMeeting;
    } catch (error) {
        logger.error('Error in resubmitAnnualGeneralMeetingService:', error as Error);
        throw error;
    }
};

export const getAllAnnualGeneralMeetingsService = async (
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

        // Build where clause for search, society_id, and role-based filtering
        const whereClause: any = { meeting_type: MEETING_TYPE };
        const isCrossDistrictRole =
            userRole === 'rcs_district' || userRole === 'jt_rcs_district';

        // Applicant: only their own AGMs
        if (userRole === 'applicant' && created_by) {
            whereClause.created_by = created_by;
        } else if (
            userRole !== 'admin' &&
            userRole !== 'applicant' &&
            !isHq &&
            !isCrossDistrictRole &&
            userDistrictId
        ) {
            // Other district-scoped roles: same district only; RCS/JT RCS district = all districts
            whereClause['$societyRegistration.district_id$'] = userDistrictId;
        }
        // admin, is_hq, or cross-district RCS roles: no extra filter (show all)

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
            order: [['meeting_date', 'DESC']],
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
                {
                    association: 'media',
                    attributes: ['id', 'url']
                },
                {
                    association: 'attendanceSheet',
                    attributes: ['id', 'url']
                },
                {
                    association: 'minutesOfMeeting',
                    attributes: ['id', 'url']
                },
                {
                    association: 'notice',
                    attributes: ['id', 'url']
                },
                {
                    association: 'issuedProceedingsDocument',
                    attributes: ['id', 'url'],
                    required: false
                }
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
        logger.error('Error in getAllAnnualGeneralMeetingsService:', error);
        throw error;
    }
};

export const getAnnualGeneralMeetingByIdService = async (
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
                    association: 'societyRegistration',
                    attributes: ['id', 'cooperative_society_name', 'registration_number', 'district_id']
                },
                {
                    association: 'creator',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
                {
                    association: 'media',
                    attributes: ['id', 'url']
                },
                {
                    association: 'attendanceSheet',
                    attributes: ['id', 'url']
                },
                {
                    association: 'minutesOfMeeting',
                    attributes: ['id', 'url']
                },
                {
                    association: 'notice',
                    attributes: ['id', 'url']
                },
                {
                    association: 'byeLawsMedia',
                    attributes: ['id', 'url'],
                    required: false
                },
                {
                    association: 'issuedProceedingsDocument',
                    attributes: ['id', 'url'],
                    required: false
                },
                {
                    association: 'statusDetails',
                    attributes: ['id', 'key', 'title'],
                    required: false
                },
                {
                    association: 'workflowStatus',
                    attributes: ['id', 'sequence', 'allowed_role_id', 'approval_status_id', 'reject_status_id', 'assigned_to', 'module_id'],
                    required: false
                },
                {
                    association: 'assignedToUser',
                    attributes: ['id', 'first_name', 'last_name', 'email'],
                    required: false
                }
            ]
        });
        if (!meeting) {
            throw new AppError('Annual General Meeting not found', 404);
        }
        // Applicant: only their own meetings
        if (userRole === 'applicant' && userId && meeting.created_by !== userId) {
            throw new AppError('You do not have access to this Annual General Meeting', 403);
        }
        const isCrossDistrictRoleDetail =
            userRole === 'rcs_district' || userRole === 'jt_rcs_district';
        if (
            userRole !== 'admin' &&
            userRole !== 'applicant' &&
            !isHq &&
            !isCrossDistrictRoleDetail &&
            userDistrictId
        ) {
            const societyReg = (meeting as any).societyRegistration ?? meeting.get('societyRegistration');
            const societyDistrictId = societyReg?.district_id ?? null;
            if (societyDistrictId !== userDistrictId) {
                throw new AppError('You do not have access to this Annual General Meeting', 403);
            }
        }

        const result = meeting.toJSON ? meeting.toJSON() : meeting.get({ plain: true });

        result.deleted_members = await enrichDeletedMembersWithMedia(result.deleted_members, {
            id,
            module: MODULE_KEY
        });

        // Attach workflowLevels (all workflow steps for AGM module) and workflowStatus (current/next/previous)
        try {
            const module = await Module.findOne({ where: { key: 'AGM', active: true } });
            if (module) {
                const workflowLevels = await getWorkflowsByModuleId(module.id);
                result.workflowLevels = workflowLevels;
            } else {
                result.workflowLevels = [];
            }
        } catch (workflowErr) {
            logger.warn('Failed to get workflow levels for AGM', { id, error: (workflowErr as Error)?.message });
            result.workflowLevels = [];
        }

        try {
            // Check if workflow_status association is null, return empty workflowStatus
            if (!result.workflowStatus) {
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
            } else {
                const workflowStatus = await getWorkflowStatus(id, MODULE_KEY, false);
                result.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
            }
        } catch (workflowErr) {
            logger.warn('Failed to get workflow status for AGM', { id, error: (workflowErr as Error)?.message });
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
            logger.warn('Failed to get previous comment documents for AGM', { id, error: documentsErr?.message });
            result.previousCommentDocuments = [];
        }

        try {
            result.history = await findHistoryByReference(id, MODULE_KEY);
        } catch (historyErr: any) {
            logger.warn('Failed to get history for AGM', { id, error: historyErr?.message });
            result.history = [];
        }

        await attachCompleteProcessingHistoryToDetail(result, id, MODULE_KEY);

        return result;
    } catch (error) {
        logger.error('Error in getAnnualGeneralMeetingByIdService:', error);
        throw error;
    }
};