import logger from '../utils/logger';
import { AppError } from '../utils/errors';
import SpecialGeneralBoardMeeting from '../models/SpecialGeneralBoardMeeting';
import { Op } from 'sequelize';
import {
  formatWorkflowStatusForApi,
  getWorkflowIdByModuleAndSequence,
  getWorkflowStatus
} from './WorkflowUtilService';
import { findStatusByKey } from './StatusService';
import SocietyRegistration from '../models/SocietyRegistration';
import Media from '../models/Media';
import { normalizeElectedBodMembersWithShareholderCategory } from './meetingBodMemberService';
import { getDistrictById } from './DistrictService';
import { NOTIFICATIONS } from '../config/notifications';
import { notifyInspectorsInDistrict } from './NotificationService';
import { attachCompleteProcessingHistoryToDetail } from './WorkflowCommentService';
import { enrichDeletedMembersWithMedia } from '../utils/enrichDeletedMembers';




interface SpecialBoardMeetingData {
    society_id: string;
    society_name: string;
    meeting_date: Date;
    notice_id?: string;
    attendance_sheet_id?: string;
    minutes_of_meeting_id?: string;
    comments?: string;
    total_shareholders: number;
    attended_shareholders: number;
    elected_bod_members?: any[] | null;
    deleted_members?: any[] | null;
    created_by?: string | null;
}

export const createSpecialBoradMeetingService = async (boardMeetingData: SpecialBoardMeetingData, createdBy: string | null) => {
    try {
        const workflowStatusId = await getWorkflowIdByModuleAndSequence('SGBM', 1);
        if (!workflowStatusId) {
            logger.warn('First workflow step (sequence 1) not found for SGBM module; creating record without workflow_status. Please ensure workflow steps are seeded.');
        }

        const submittedStatus = await findStatusByKey('submitted');
        const initialStatusId = submittedStatus?.id || null;
        const { workflow_status, assigned_to_user_id, status, ...dataWithoutWorkflowFields } = boardMeetingData as any;
        const incomingMediaIds = [
            dataWithoutWorkflowFields.notice_id,
            dataWithoutWorkflowFields.attendance_sheet_id,
            dataWithoutWorkflowFields.minutes_of_meeting_id
        ].filter((id): id is string => typeof id === 'string' && id.trim().length > 0);

        const validMediaIdSet = new Set<string>();
        if (incomingMediaIds.length > 0) {
            const mediaRows = await Media.findAll({
                where: { id: incomingMediaIds },
                attributes: ['id']
            });
            for (const media of mediaRows) {
                validMediaIdSet.add(String(media.id));
            }
        }

        const sanitizeMediaId = (id?: string) =>
            id && validMediaIdSet.has(id) ? id : null;

        const newSpecialBoardMeeting = await SpecialGeneralBoardMeeting.create({
            ...dataWithoutWorkflowFields,
            notice_id: sanitizeMediaId(dataWithoutWorkflowFields.notice_id),
            attendance_sheet_id: sanitizeMediaId(dataWithoutWorkflowFields.attendance_sheet_id),
            minutes_of_meeting_id: sanitizeMediaId(dataWithoutWorkflowFields.minutes_of_meeting_id),
            elected_bod_members: normalizeElectedBodMembersWithShareholderCategory(
                dataWithoutWorkflowFields.elected_bod_members
            ),
            created_by: createdBy as string,
            workflow_status: workflowStatusId || null,
            status: initialStatusId
        });

        try {
            const societyReg = await SocietyRegistration.findByPk(newSpecialBoardMeeting.society_id, {
                attributes: ['id', 'district_id']
            });
            const districtId = societyReg?.district_id as string | undefined;
            if (!districtId) {
                logger.warn('SGBM created but society has no district_id; skipping notification', {
                    sgbmId: newSpecialBoardMeeting.id,
                    society_id: newSpecialBoardMeeting.society_id
                });
            } else {
                const district = await getDistrictById(districtId);
                if (!district?.id) {
                    throw new AppError('District not found', 404);
                }

                const notificationData = {
                    title: NOTIFICATIONS.notifications.special_general_board_meeting.created.title as any,
                    description: `A new special general board meeting has been submitted in your district for society ${newSpecialBoardMeeting.society_name}`,
                    data: JSON.stringify({ specialGeneralBoardMeeting: newSpecialBoardMeeting }),
                    redirect_path: NOTIFICATIONS.notifications.special_general_board_meeting.created.path.replace('{id}', String(newSpecialBoardMeeting.id)),
                    created_by: newSpecialBoardMeeting.created_by as string | undefined
                };

                await notifyInspectorsInDistrict(district.id, notificationData, [
                    'drcs_arcs_district'
                ]);
                logger.info('drcs_arcs_district notifications sent successfully for SGBM', notificationData);
            }
        } catch (error) {
            logger.error('Failed to send notification for new special board meeting', error as Error);
        }

        // Elected members are written to `members` / `bod_members` only after final RCS approval
        // (see WorkflowUtilService) so BOD Module and My Society do not show them earlier.

        return newSpecialBoardMeeting;
    } catch (error) {
        logger.error('Error in createSpecialBoradMeetingService:', error);
        throw error;
    }
};

const SGBM_DISTRICT_SCOPED_ROLES = ['drcs_arcs_district', 'jics_sics_district'];
const SGBM_ALL_DISTRICT_ACCESS_ROLES = [
    'drcs_arcs_hq',
    'jics_sics_hq',
    'rcs_district',
    'jt_rcs_district',
];

const assertApplicantSgbmAccess = async (
    meetingSocietyId: string,
    userId: string
): Promise<void> => {
    const societyReg = await SocietyRegistration.findOne({
        where: { created_by: userId },
        attributes: ['id'],
    });
    if (!societyReg?.id || String(meetingSocietyId) !== String(societyReg.id)) {
        throw new AppError('You do not have access to this Special Board Meeting', 403);
    }
};

const assertOfficerSgbmDistrictAccess = (
    societyDistrictId: string | null | undefined,
    userRole?: string,
    userDistrictId?: string | null,
    isHq?: boolean
): void => {
    const role = userRole || '';
    if (
        role === 'admin' ||
        role === 'super_admin' ||
        role === 'applicant' ||
        SGBM_ALL_DISTRICT_ACCESS_ROLES.includes(role) ||
        isHq
    ) {
        return;
    }

    if (SGBM_DISTRICT_SCOPED_ROLES.includes(role) && userDistrictId) {
        if (societyDistrictId !== userDistrictId) {
            throw new AppError('You do not have access to this Special Board Meeting', 403);
        }
        return;
    }

    if (userDistrictId && societyDistrictId !== userDistrictId) {
        throw new AppError('You do not have access to this Special Board Meeting', 403);
    }
};

export const getAllSpecialBoradMeetingsService = async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    society_id?: string,
    userId?: string | null,
    userRole?: string,
    userDistrictId?: string | null,
    isHq?: boolean
) => {
    try {
        const offset = (page - 1) * limit;
        const whereClause: any = {};
        const role = userRole || '';
        const emptyResult = {
            meetings: [] as SpecialGeneralBoardMeeting[],
            pagination: {
                totalItems: 0,
                totalPages: 0,
                currentPage: page,
                pageSize: limit,
            },
        };

        if (role === 'applicant' && userId) {
            const societyReg = await SocietyRegistration.findOne({
                where: { created_by: userId },
                attributes: ['id'],
            });
            if (!societyReg?.id) {
                return emptyResult;
            }
            whereClause.society_id = societyReg.id;
        } else if (SGBM_DISTRICT_SCOPED_ROLES.includes(role) && userDistrictId) {
            whereClause['$societyRegistration.district_id$'] = userDistrictId;
        } else if (
            role !== 'admin' &&
            role !== 'super_admin' &&
            role !== 'applicant' &&
            !SGBM_ALL_DISTRICT_ACCESS_ROLES.includes(role) &&
            !isHq &&
            userDistrictId
        ) {
            whereClause['$societyRegistration.district_id$'] = userDistrictId;
        }

        if (society_id && role !== 'applicant') {
            whereClause.society_id = society_id;
        }

        if (search) {
            whereClause.society_name = { [Op.iLike]: `%${search}%` };
        }

        const needsDistrictJoin =
            (SGBM_DISTRICT_SCOPED_ROLES.includes(role) && !!userDistrictId) ||
            (
                role !== 'admin' &&
                role !== 'super_admin' &&
                role !== 'applicant' &&
                !SGBM_ALL_DISTRICT_ACCESS_ROLES.includes(role) &&
                !isHq &&
                !!userDistrictId
            );

        const { count, rows: meetings } = await SpecialGeneralBoardMeeting.findAndCountAll({
            where: whereClause,
            order: [['meeting_date', 'DESC']],
            limit,
            offset,
            include: [
                {
                    association: 'societyRegistration',
                    attributes: ['id', 'cooperative_society_name', 'registration_number', 'district_id'],
                    required: needsDistrictJoin,
                },
                {
                    association: 'creator',
                    attributes: ['id', 'first_name', 'email']
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
                    association: 'statusDetails',
                    attributes: ['id', 'key', 'title'],
                    required: false
                }
            ]
        });
        const totalPages = Math.ceil(count / limit);
        return {
            meetings,
            pagination: {
                totalItems: count,
                totalPages,
                currentPage: page,
                pageSize: limit
            }
        };
    } catch (error) {
        logger.error('Error in getAllSpecialBoradMeetingsService:', error);
        throw error;
    }
};

export const getSpecialBoradMeetingByIdService = async (
    id: string,
    userId?: string,
    userRole?: string,
    userDistrictId?: string | null,
    isHq?: boolean
): Promise<any> => {
    try {
        const meeting = await SpecialGeneralBoardMeeting.findByPk(id, {
            include: [
                {
                    association: 'statusDetails',
                    attributes: ['id', 'key', 'title'],
                    required: false
                },
                {
                    association: 'societyRegistration',
                    attributes: ['id', 'cooperative_society_name', 'registration_number', 'district_id']
                },
                {
                    association: 'creator',
                    attributes: ['id', 'first_name', 'email']
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
                }
            ]
        });
        if (!meeting) {
            throw new AppError('Special Board Meeting not found', 404);
        }

        if (userRole === 'applicant' && userId) {
            await assertApplicantSgbmAccess(String(meeting.society_id), userId);
        } else if (userRole && userRole !== 'applicant') {
            const societyReg = (meeting as any).societyRegistration ?? meeting.get('societyRegistration');
            const societyDistrictId = societyReg?.district_id ?? null;
            assertOfficerSgbmDistrictAccess(societyDistrictId, userRole, userDistrictId, isHq);
        }

        const result: any = meeting.toJSON ? meeting.toJSON() : meeting.get({ plain: true });

        result.deleted_members = await enrichDeletedMembersWithMedia(result.deleted_members, {
            id,
            module: 'SGBM'
        });

        try {
            if (!result.workflow_status) {
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
                const workflowStatus = await getWorkflowStatus(id, 'SGBM', false);
                result.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
            }
        } catch (workflowErr: any) {
            logger.warn('Failed to get workflow status for SGBM', { id, error: workflowErr?.message });
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

        await attachCompleteProcessingHistoryToDetail(result, id, 'SGBM');

        return result;
    } catch (error) {
        logger.error('Error in getSpecialBoradMeetingByIdService:', error);
        throw error;
    }
};