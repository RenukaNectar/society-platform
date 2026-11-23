import { Op, WhereOptions } from 'sequelize';
import ElectionRequest from '../models/ElectionRequest';
import SocietyRegistration from '../models/SocietyRegistration';
import User from '../models/user';
import Status from '../models/Status';
import Activity from '../models/Activity';
import logger from '../utils/logger';
import Media from '../models/Media';
import District from '../models/District';
import { notifyInspectorsInDistrict, notifyRegistrarsInDistrict, notifyRolesInDistrict, sendNotification, getUsers } from './NotificationService';
import { NOTIFICATIONS } from '../config';
import { createActivity } from './ActiviesService';
import {
  formatWorkflowStatusForApi,
  getWorkflowIdByModuleAndSequence,
  getWorkflowStatus,
  parseWorkflowRoleIds
} from './WorkflowUtilService';
import { findHistoryByReference } from './HistoryService';
import { extractDocumentMediaIds, attachCompleteProcessingHistoryToDetail } from './WorkflowCommentService';
import Module from '../models/Module';
import ModuleWorkflow from '../models/ModuleWorkflow';
import Role from '../models/Role';
import NotificationTemplate from '../models/NotificationTemplate';


interface CreateElectionRequestData {
  society_registration_id: string;
  last_election_held_date: Date | null;
  last_elected_committee_expiry_date: Date | null;
  reason_for_election_request: 'Regular Term' | 'Early Dissolution' | 'Court Order' | 'Other';
  proposed_election_date: Date;
  proposed_venue: string;
  number_of_members_eligible_to_vote: number;
  member_list_media_id?: string;
  meeting_resolution_copy_media_id?: string;
  previous_election_report_media_id?: string;
  additional_notes?: string;
  created_by?: string;
}

interface ElectionRequestFilters {
  society_registration_id?: string;
  status_id?: string;
  reason_for_election_request?: string;
  proposed_election_date?: string;
  assigned_officer_id?: string;
  created_by?: string;
  district_id?: string;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

/**
 * Helper function to get user's district from their created society if they don't have one directly assigned
 */
const getUserDistrictFromSociety = async (userId: string): Promise<string | null> => {
  try {
    const userSociety = await SocietyRegistration.findOne({
      where: { created_by: userId },
      attributes: ['district_id']
    });
    
    if (userSociety?.district_id) {
      logger.info('Found user district from society', {
        userId,
        districtId: userSociety.district_id
      });
      return userSociety.district_id;
    }
    
    logger.info('No society found for user', { userId });
    return null;
  } catch (error) {
    logger.error('Error finding user society for district fallback', error);
    return null;
  }
};

const formatDocumentLabel = (key: string): string =>
  key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

/**
 * Create a new election request
 */
export const createElectionRequest = async (data: CreateElectionRequestData): Promise<{ success: boolean; message: string; data?: ElectionRequest }> => {
  const startTime = Date.now();
  try {
    logger.info('Creating election request', {
      society_registration_id: data.society_registration_id,
      proposed_election_date: data.proposed_election_date,
      reason_for_election_request: data.reason_for_election_request
    });

    // Align with the ELECTION workflow seeder: sequence 1 (applicant submit) sets status = 'submitted'.
    const submittedStatus = await Status.findOne({
      where: { key: 'submitted' }
    });

    if (!submittedStatus) {
      logger.error('Submitted status not found in statuses table');
      return {
        success: false,
        message: 'Submitted status not found in statuses table'
      };
    }

    // Pin the election request to the initial workflow step (sequence 1 of ELECTION module)
    // so it can be progressed via the generic workflow engine (approve/reject/back).
    const workflowStatusId = await getWorkflowIdByModuleAndSequence('ELECTION', 1);
    if (!workflowStatusId) {
      logger.warn('ELECTION sequence 1 workflow step NOT found. Ensure election workflow seeder has been run.', {
        module: 'ELECTION',
        sequence: 1
      });
    }

    // Resolve the district used to route workflow notifications. Prefer the society's
    // district (since elections are intrinsically tied to a society); fall back to the
    // creator's district if the society has none on record.
    const societyRegistration = await SocietyRegistration.findByPk(data.society_registration_id);
    let districtId: string | null = societyRegistration?.district_id || null;
    if (!districtId && data.created_by) {
      const creator = await User.findByPk(data.created_by, { attributes: ['district_id'] });
      districtId = (creator as any)?.district_id || null;
    }

    const electionRequest = await ElectionRequest.create({
      ...data,
      status_id: submittedStatus.id,
      submission_date: new Date(),
      approval_order_issued: false,
      district_id: districtId,
      workflow_status: workflowStatusId || null,
      assigned_to_user_id: null
    } as any);

    // Notify all users with the next workflow step's role in the same district.
    // Uses the workflow step's configured notification template (or the `election_request_submit` template fallback)
    // and replaces {{username}}, {{SocietyName}}, {{roleName}} placeholders.
    try {
      if (!districtId) {
        logger.warn('Election create notification skipped: no district_id for society/creator', {
          electionRequestId: electionRequest.id,
          userId: data.created_by
        });
      } else {
        const electionModule = await Module.findOne({ where: { key: 'ELECTION', active: true } });
        const workflowStepWhere = electionModule
          ? { module_id: electionModule.id, active: true, is_hq: false }
          : null;

        // `currentStep` = sequence 1 (applicant submit). The applicant just completed
        // this step, so its `approval_notification_template_id` (election_request_submit)
        // drives the notification text ("Election Request Submitted ...").
        const currentStep = workflowStepWhere
          ? await ModuleWorkflow.findOne({ where: { ...workflowStepWhere, sequence: 1 } })
          : null;
        // `nextStep` = sequence 2 (DRCS/ARCS District). Used only to determine the
        // recipient role for the notification.
        const nextStep = workflowStepWhere
          ? await ModuleWorkflow.findOne({ where: { ...workflowStepWhere, sequence: 2 } })
          : null;

        const nextRoleIds = parseWorkflowRoleIds(nextStep?.allowed_role_id);
        const nextRole = nextRoleIds.length
          ? await Role.findOne({ where: { id: nextRoleIds[0], is_active: true }, attributes: ['id', 'name'] })
          : null;
        const nextRoleName = nextRole?.name;
        const nextRoleId = nextRole?.id;

        if (!nextRoleName) {
          logger.warn('Election create notification skipped: next workflow role not found', {
            electionRequestId: electionRequest.id,
            module: 'ELECTION',
            sequence: 2,
            allowedRoleIds: nextRoleIds
          });
        } else {
          let templateTitle = NOTIFICATIONS.notifications.election.requested.title as string;
          let templateDescription = `A new election request has been submitted for society "${societyRegistration?.cooperative_society_name || 'Unknown'}" (Proposed Date: ${data.proposed_election_date})`;
          let templateId: string | undefined;

          try {
            const templateIdFromWorkflow = currentStep?.approval_notification_template_id || null;
            const template = templateIdFromWorkflow
              ? await NotificationTemplate.findByPk(templateIdFromWorkflow)
              : await NotificationTemplate.findOne({ where: { key: 'election_request_submit', active: true } });

            if (template && (template as any).active !== false) {
              templateTitle = template.title || templateTitle;
              templateDescription = template.description || templateDescription;
              templateId = template.id;
            }
          } catch (tplErr: any) {
            logger.warn('Failed to fetch election_request_submit notification template, using default text', {
              error: tplErr?.message
            });
          }

          const creatorUser = data.created_by ? await User.findByPk(data.created_by) : null;
          const username = creatorUser?.getFullName?.() || creatorUser?.email || '';
          const societyLabel = societyRegistration?.cooperative_society_name || 'Election Request';

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
                election_request_id: electionRequest.id,
                module_name: 'ELECTION',
                next_role: nextRoleName,
                next_role_id: nextRoleId,
                district_id: districtId
              }),
              redirect_path: NOTIFICATIONS.notifications.election.requested.path.replace('{id}', electionRequest.id),
              created_by: data.created_by,
              notification_template_id: templateId
            } as any,
            [nextRoleName]
          );

          if (notification) {
            logger.info('Election create notification sent to next workflow role in district', {
              electionRequestId: electionRequest.id,
              districtId,
              nextRoleName,
              templateId
            });
          }
        }
      }
    } catch (notificationError: any) {
      logger.warn('Failed to send notifications for election request (non-fatal)', {
        election_request_id: electionRequest.id,
        error: notificationError?.message || notificationError
      });
    }

    // Log activity
    await createActivity({
      title: 'Election Request Created',
      description: `New election request submitted for society "${societyRegistration?.cooperative_society_name || 'Unknown'}" for ${data.reason_for_election_request}`,
      data: {
        election_request_id: electionRequest.id,
        society_id: data.society_registration_id,
        society_name: societyRegistration?.cooperative_society_name,
        reason_for_election_request: data.reason_for_election_request,
        proposed_election_date: data.proposed_election_date,
        proposed_venue: data.proposed_venue,
        number_of_members_eligible_to_vote: data.number_of_members_eligible_to_vote,
        created_by: data.created_by
      },
      reference_id: electionRequest.id,
      created_by: data.created_by || 'system'
    });

    // Attach workflow status (current, next, previous) for frontend
    const response: any = electionRequest.toJSON ? electionRequest.toJSON() : electionRequest;
    if (electionRequest.workflow_status) {
      try {
        const workflowStatus = await getWorkflowStatus(electionRequest.id, 'ELECTION', false);
        response.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
      } catch (workflowError: any) {
        logger.warn('Error fetching workflow status after election create:', {
          electionRequestId: electionRequest.id,
          error: workflowError?.message
        });
        response.workflowStatus = {};
      }
    } else {
      response.workflowStatus = {};
    }

    return {
      success: true,
      message: 'Election request created successfully',
      data: response
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Error creating election request', {
      error: error.message,
      duration,
      data
    });
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Get election request by ID
 */
export const getElectionRequestById = async (id: string): Promise<any | null> => {
  try {
    const electionRequest = await ElectionRequest.findByPk(id, {
      include: [
        {
          model: SocietyRegistration,
          as: 'societyRegistration',
          attributes: ['id', 'cooperative_society_name', 'registration_number', 'district_id'],
          include: [
            {
              model: District,
              as: 'district',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: Status,
          as: 'status',
          attributes: ['id', 'title', 'key']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'updatedBy',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'assignedOfficer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'assignedToUser',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false
        },
        {
          model: Media,
          as: 'memberListMedia'
        },
        {
          model: Media,
          as: 'meetingResolutionCopyMedia'
        },
        {
          model: Media,
          as: 'previousElectionReportMedia'
        },
        {
          model: Media,
          as: 'byeLawsMedia',
          required: false,
          attributes: ['id', 'url']
        }
      ]
    });

    if (!electionRequest) {
      return null;
    }

    // Attach workflow status (current, next, previous) for the frontend
    const response: any = electionRequest.toJSON ? electionRequest.toJSON() : electionRequest;
    if (electionRequest.workflow_status) {
      try {
        const workflowStatus = await getWorkflowStatus(electionRequest.id, 'ELECTION', false);
        response.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
      } catch (workflowError: any) {
        logger.warn('Error fetching workflow status for election request details:', {
          electionRequestId: electionRequest.id,
          error: workflowError?.message
        });
        response.workflowStatus = {};
      }
    } else {
      response.workflowStatus = {};
    }

    try {
      response.history = await findHistoryByReference(electionRequest.id, 'ELECTION');
    } catch (historyError: any) {
      logger.warn('Error fetching election history for details:', {
        electionRequestId: electionRequest.id,
        error: historyError?.message
      });
      response.history = [];
    }

    try {
      const activities = await Activity.findAll({
        where: { reference_id: electionRequest.id },
        order: [['created_at', 'DESC']],
        limit: 25
      });

      const latestCommentWithDocs = activities.find((activity: any) => {
        const data = activity?.data || {};
        return data?.moduleName === 'ELECTION'
          && typeof data?.comments === 'string'
          && data.comments.trim().length > 0
          && data?.documents
          && typeof data.documents === 'object'
          && Object.keys(data.documents).length > 0;
      }) as any;

      if (latestCommentWithDocs?.data?.documents) {
        const mappedDocs = extractDocumentMediaIds(latestCommentWithDocs.data.documents);
        const mediaIds = Array.from(new Set(mappedDocs.map(doc => doc.mediaId)));

        if (mediaIds.length > 0) {
          const mediaRows = await Media.findAll({
            where: { id: { [Op.in]: mediaIds }, active: true },
            attributes: ['id', 'url']
          });

          const mediaUrlMap = new Map<string, string>();
          for (const row of mediaRows as any[]) {
            if (row?.id && row?.url) mediaUrlMap.set(row.id, row.url);
          }

          response.previousCommentDocuments = mappedDocs
            .map(doc => ({
              key: doc.key,
              label: formatDocumentLabel(doc.key),
              mediaId: doc.mediaId,
              url: mediaUrlMap.get(doc.mediaId) || null
            }))
            .filter((doc: any) => Boolean(doc.url));
        } else {
          response.previousCommentDocuments = [];
        }
      } else {
        response.previousCommentDocuments = [];
      }
    } catch (documentsError: any) {
      logger.warn('Error fetching previous comment documents for election details:', {
        electionRequestId: electionRequest.id,
        error: documentsError?.message
      });
      response.previousCommentDocuments = [];
    }

    await attachCompleteProcessingHistoryToDetail(response, electionRequest.id, 'ELECTION');

    return response;
  } catch (error: any) {
    logger.error('Error getting election request by ID', { error: error.message, id });
    throw new Error(`Failed to get election request: ${error.message}`);
  }
};

/**
 * Get all election requests with filters and pagination
 */
export const getElectionRequests = async (
  filters: ElectionRequestFilters = {}, 
  authenticatedUser?: { district_id?: string; role?: string; userId?: string },
  searchParam?: string
): Promise<{
  electionRequests: ElectionRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const startTime = Date.now();
  try {
    const {
      society_registration_id,
      status_id,
      reason_for_election_request,
      proposed_election_date,
      assigned_officer_id,
      created_by,
      district_id,
      page = 1,
      limit = 10,
      from,
      to
    } = filters;
    const search = searchParam as string;
  
    const whereConditions: WhereOptions = {};

    // Role-based visibility (mirrors AppealService):
    //  - applicant: only their own election requests (created_by)
    //  - admin / super_admin / jics_sics_hq / drcs_arcs_hq / jt_rcs_district /
    //    rcs_district : see ALL election requests (no district filter) — these are
    //    HQ / state-level approval roles in the ELECTION workflow.
    //  - any other workflow role (drcs_arcs_district, jics_sics_district, etc.):
    //    scoped to the district they belong to.
    const FULL_ACCESS_ROLES = [
      'admin',
      'super_admin',
      'jics_sics_hq',
      'drcs_arcs_hq',
      'jt_rcs_district',
      'rcs_district'
    ];

    if (authenticatedUser?.role === 'applicant') {
      logger.info('User is applicant - filtering by created_by');
      if (authenticatedUser.userId) {
        whereConditions.created_by = authenticatedUser.userId;
      } else {
        logger.warn('Applicant user ID not provided, returning empty result');
        return {
          electionRequests: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        };
      }
    } else if (
      authenticatedUser?.role &&
      FULL_ACCESS_ROLES.includes(authenticatedUser.role)
    ) {
      logger.info('Full-access role - no district filter applied', {
        role: authenticatedUser.role
      });
    } else {
      // Any other workflow role: scope by district. Prefer election_requests.district_id
      // (populated on create/resubmit); fall back to joined society_registrations.district_id
      // for legacy rows, and finally to the user's created society district.
      logger.info('User has workflow role - applying district-based filtering', {
        role: authenticatedUser?.role
      });
      const districtFilter =
        authenticatedUser?.district_id ||
        (district_id as string | undefined) ||
        null;

      if (districtFilter) {
        (whereConditions as any)[Op.and] = [
          ...(((whereConditions as any)[Op.and] as any[]) || []),
          {
            [Op.or]: [
              { district_id: districtFilter },
              { '$societyRegistration.district_id$': districtFilter }
            ]
          }
        ];
      } else if (authenticatedUser?.userId) {
        logger.info('No direct district, trying to get from created society');
        const societyDistrictId = await getUserDistrictFromSociety(authenticatedUser.userId);
        if (societyDistrictId) {
          (whereConditions as any)[Op.and] = [
            ...(((whereConditions as any)[Op.and] as any[]) || []),
            {
              [Op.or]: [
                { district_id: societyDistrictId },
                { '$societyRegistration.district_id$': societyDistrictId }
              ]
            }
          ];
        } else {
          logger.warn('No district filter provided and user is not admin, returning empty result for security');
          return {
            electionRequests: [],
            total: 0,
            page,
            limit,
            totalPages: 0
          };
        }
      } else {
        logger.warn('No district filter provided and user is not admin, returning empty result for security');
        return {
          electionRequests: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        };
      }
    }

    logger.info('Final where conditions', { whereConditions });

    // Apply other filters
    if (society_registration_id) {
      whereConditions.society_registration_id = society_registration_id;
    }

    if (status_id) {
      whereConditions.status_id = status_id;
    }

    if (reason_for_election_request) {
      whereConditions.reason_for_election_request = reason_for_election_request;
    }

    if (proposed_election_date) {
      whereConditions.proposed_election_date = proposed_election_date;
    }

    if (assigned_officer_id) {
      whereConditions.assigned_officer_id = assigned_officer_id;
    }

    if (created_by) {
      whereConditions.created_by = created_by;
    }

    if (from) {
      whereConditions.created_at[Op.gte] = new Date(from);
    }

    if (to) {
      whereConditions.created_at[Op.lte] = new Date(to);
    }

    if (from || to) {
      whereConditions.created_at = {};
    }



    const offset = (page - 1) * limit;

    let finalWhereConditions = whereConditions;
    
    // If search is provided, create OR conditions for better search results
    if (search) {
      finalWhereConditions = {
        [Op.or]: [
          // Society registration fields
          { '$societyRegistration.cooperative_society_name$': { [Op.like]: `%${search}%` } },
          { '$societyRegistration.registration_number$': { [Op.like]: `%${search}%` } },
          // Election request fields
          { reason_for_election_request: { [Op.like]: `%${search}%` } },
          { proposed_election_date: { [Op.like]: `%${search}%` } },
          // User fields
          { '$assignedOfficer.first_name$': { [Op.like]: `%${search}%` } },
          { '$assignedOfficer.last_name$': { [Op.like]: `%${search}%` } },
          { '$createdBy.first_name$': { [Op.like]: `%${search}%` } },
          { '$createdBy.last_name$': { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const { count, rows } = await ElectionRequest.findAndCountAll({
      where: finalWhereConditions,
      include: [
        {
          model: SocietyRegistration,
          as: 'societyRegistration',
          required: true, // This ensures INNER JOIN and filters out records without society
          attributes: ['id', 'cooperative_society_name', 'registration_number', 'district_id'],
          include: [
            {
              model: District,
              as: 'district',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: Status,
          as: 'status',
          attributes: ['id', 'title', 'key']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'updatedBy',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'assignedOfficer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Media,
          as: 'memberListMedia'
        },
        {
          model: Media,
          as: 'meetingResolutionCopyMedia'
        },
        {
          model: Media,
          as: 'previousElectionReportMedia'
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const duration = Date.now() - startTime;
    return {
      electionRequests: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Error fetching election requests', {
      error: error.message,
      duration,
      filters
    });
    throw new Error(`Failed to get election requests: ${error.message}`);
  }
};

/**
 * Get election requests by society registration ID
 */
export const getElectionRequestsBySociety = async (societyRegistrationId: string): Promise<ElectionRequest[]> => {
  try {
    const electionRequests = await ElectionRequest.findAll({
      where: { society_registration_id: societyRegistrationId },
      include: [
        {
          model: Status,
          as: 'status',
          attributes: ['id', 'title', 'key']
        },
        {
          model: User,
          as: 'assignedOfficer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return electionRequests;
  } catch (error: any) {
    logger.error('Error getting election requests by society', {
      error: error.message,
      society_registration_id: societyRegistrationId
    });
    throw new Error(`Failed to get election requests by society: ${error.message}`);
  }
};

/**
 * Send hierarchical notifications based on election request status
 * Implements the role-based notification flow:
 * 1. submitted -> notify JICS/JACS
 * 2. jics_jacs_approved -> notify SICS/SACS
 */
const sendHierarchicalNotificationsForElection = async (
  electionRequest: ElectionRequest,
  newStatusKey: string,
  oldStatusKey: string,
  remarks?: string,
  updatedBy?: string
): Promise<void> => {
  try {
    const districtId = electionRequest.societyRegistration?.district_id;
    if (!districtId) {
      logger.warn('No district ID found for hierarchical notifications', {
        election_request_id: electionRequest.id
      });
      return;
    }

    const notificationData = {
      title: NOTIFICATIONS.notifications.election.requested.title as any,
      description: `Election request for ${electionRequest.societyRegistration?.cooperative_society_name} (Proposed Date: ${electionRequest.proposed_election_date}) status has been updated from ${oldStatusKey} to ${newStatusKey}.${remarks ? ` Remarks: ${remarks}` : ''}`,
      data: JSON.stringify({ electionRequest, society: electionRequest.societyRegistration }),
      redirect_path: NOTIFICATIONS.notifications.election.requested.path.replace('{id}', electionRequest.id),
      created_by: updatedBy
    };

    let targetRoles: string[] = [];

    // Determine which roles to notify based on the new status
    switch (newStatusKey) {
      case 'submitted':
        // When submitted, notify JICS/JACS
        targetRoles = ['jics_jacs'];
        break;
      
      case 'jics_jacs_approved':
        // When JICS/JACS approves, notify SICS/SACS
        targetRoles = ['sics_sacs'];
        break;
      
      case 'jics_jacs_rejected':
      case 'sics_sacs_rejected':
        // For rejections, notify only the applicant
        // The applicant notification is already handled above, so no additional roles needed
        targetRoles = [];
        break;
      
      default:
        // For other statuses, notify field inspectors and senior inspectors
        targetRoles = ['field_inspector', 'senior_inspector'];
        break;
    }

    if (targetRoles.length > 0) {
      // Get users with the target roles in the district
      const userIds = await getUsers({
        districtId,
        roleNames: targetRoles,
        isActive: true
      });

      if (userIds.length > 0) {
        await sendNotification(userIds, notificationData as any);
        logger.info('Hierarchical notification sent for election request', {
          election_request_id: electionRequest.id,
          new_status: newStatusKey,
          target_roles: targetRoles,
          notified_users: userIds.length,
          district_id: districtId
        });
      } else {
        logger.warn('No users found for hierarchical notification', {
          election_request_id: electionRequest.id,
          new_status: newStatusKey,
          target_roles: targetRoles,
          district_id: districtId
        });
      }
    }

  } catch (error) {
    logger.error('Error sending hierarchical notifications for election request', {
      election_request_id: electionRequest.id,
      new_status: newStatusKey,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Update election request status with notifications
 */
export const updateElectionRequestStatus = async (
  id: string,
  statusId: string,
  updatedBy: string,
  remarks?: string
): Promise<{ success: boolean; message: string; data?: ElectionRequest }> => {
  const startTime = Date.now();
  try {
    logger.info('Updating election request status', {
      election_request_id: id,
      status_id: statusId,
      updated_by: updatedBy
    });

    const electionRequest = await ElectionRequest.findByPk(id, {
      include: [
        {
          model: SocietyRegistration,
          as: 'societyRegistration',
          attributes: ['id', 'cooperative_society_name', 'district_id']
        },
        {
          model: Status,
          as: 'status',
          attributes: ['id', 'title', 'key']
        }
      ]
    });

    if (!electionRequest) {
      logger.error('Election request not found', { election_request_id: id });
      return {
        success: false,
        message: 'Election request not found'
      };
    }

    // Get the new status
    const newStatus = await Status.findByPk(statusId);
    if (!newStatus) {
      logger.error('Status not found', { status_id: statusId });
      return {
        success: false,
        message: 'Status not found'
      };
    }

    const oldStatus = electionRequest.status?.key || 'unknown';

    // Update the election request
    await electionRequest.update({
      status_id: statusId,
      updated_by: updatedBy,
      additional_notes: remarks ? `${electionRequest.additional_notes || ''}\n\nStatus Update (${new Date().toISOString()}): ${remarks}`.trim() : electionRequest.additional_notes,
      rejection_reason: remarks,
      rejection_date: newStatus.key.includes('rejected') ? new Date() : undefined
    });

    // Send notifications after successful status update
    try {
      // Send notification to applicant (creator) about status change
      if (electionRequest.created_by) {
        const notificationData = {
          title: NOTIFICATIONS.notifications.election.requested.title as any,
          description: `Your election request for ${electionRequest.societyRegistration?.cooperative_society_name} (Proposed Date: ${electionRequest.proposed_election_date}) status has been updated from ${oldStatus} to ${newStatus.key}.${remarks ? ` Remarks: ${remarks}` : ''}`,
          data: JSON.stringify({ electionRequest, society: electionRequest.societyRegistration }),
          redirect_path: NOTIFICATIONS.notifications.election.requested.path.replace('{id}', electionRequest.id),
          created_by: updatedBy
        }
        await sendNotification(electionRequest.created_by, notificationData as any);
        logger.info('Applicant notification sent for status update', {
          election_request_id: electionRequest.id,
          old_status: oldStatus,
          new_status: newStatus.key
        });
      }

      // Send hierarchical role-based notifications based on status
      if (electionRequest.societyRegistration?.district_id) {
        await sendHierarchicalNotificationsForElection(
          electionRequest,
          newStatus.key,
          oldStatus,
          remarks,
          updatedBy
        );
      }

      await createActivity({
        title: 'Election Request Status Updated',
        description: `Election request status updated from ${oldStatus} to ${newStatus.key}.${remarks ? ` Remarks: ${remarks}` : ''}`,
        data: { electionRequest, society: electionRequest.societyRegistration },
        created_by: updatedBy,
        reference_id: electionRequest.id
      });

    } catch (notificationError) {
      logger.error('Error sending notifications', { error: notificationError });
    }

    return {
      success: true,
      message: 'Election request status updated successfully',
      data: electionRequest
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in updateElectionRequestStatus service', {
      election_request_id: id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    });
    return {
      success: false,
      message: `Failed to update election request status: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Update (resubmit) an election request.
 *
 * When an applicant edits a previously rejected / reverted election request:
 *  1. Persist the edited fields.
 *  2. Set status = 'resubmitted' (matches the convention used across other modules).
 *  3. Restart the workflow from sequence 1 of the ELECTION module and clear any
 *     per-user assignment so the approval queue restarts cleanly.
 *  4. Notify all users with the next workflow step's role in the same district,
 *     using the `election_request_resubmitted` template (falls back to
 *     `election_request_submit`).
 */
export const updateElectionRequest = async (
  id: string,
  updateData: Partial<CreateElectionRequestData>,
  updatedBy: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const electionRequest = await ElectionRequest.findByPk(id);
    if (!electionRequest) {
      return {
        success: false,
        message: 'Election request not found'
      };
    }

    // Validate dates if they're being updated
    if (updateData.proposed_election_date && new Date(updateData.proposed_election_date) <= new Date()) {
      return {
        success: false,
        message: 'Proposed election date must be in the future'
      };
    }

    if (updateData.last_election_held_date && updateData.last_elected_committee_expiry_date) {
      if (new Date(updateData.last_election_held_date) >= new Date(updateData.last_elected_committee_expiry_date)) {
        return {
          success: false,
          message: 'Last election held date must be before committee expiry date'
        };
      }
    }

    // Resolve the 'resubmitted' status (fall back to legacy 'resubmit' key if present).
    let resubmittedStatus = await Status.findOne({ where: { key: 'resubmitted' } });
    if (!resubmittedStatus) {
      resubmittedStatus = await Status.findOne({ where: { key: 'resubmit' } });
    }
    if (!resubmittedStatus) {
      logger.error('Resubmitted status not found in statuses table');
      return {
        success: false,
        message: 'Resubmitted status not found in statuses table'
      };
    }

    // Restart workflow from sequence 1 of ELECTION.
    const workflowStatusId = await getWorkflowIdByModuleAndSequence('ELECTION', 1);
    if (!workflowStatusId) {
      logger.warn('ELECTION sequence 1 workflow step NOT found during resubmit. Ensure election workflow seeder has been run.', {
        module: 'ELECTION',
        sequence: 1
      });
    }

    await electionRequest.update({
      ...updateData,
      status_id: resubmittedStatus.id,
      workflow_status: workflowStatusId || null,
      assigned_to_user_id: null,
      submission_date: new Date(),
      rejection_reason: undefined,
      rejection_date: undefined,
      updated_by: updatedBy
    } as any);

    // Notify next workflow role (same pattern as create).
    try {
      const societyRegistration = await SocietyRegistration.findByPk(electionRequest.society_registration_id);
      let districtId: string | null =
        electionRequest.district_id || societyRegistration?.district_id || null;

      if (!districtId && electionRequest.created_by) {
        const creator = await User.findByPk(electionRequest.created_by, { attributes: ['district_id'] });
        districtId = (creator as any)?.district_id || null;
      }

      if (!districtId) {
        logger.warn('Election resubmit notification skipped: no district_id available', {
          electionRequestId: electionRequest.id
        });
      } else {
        const electionModule = await Module.findOne({ where: { key: 'ELECTION', active: true } });
        const workflowStepWhere = electionModule
          ? { module_id: electionModule.id, active: true, is_hq: false }
          : null;
        const nextStep = workflowStepWhere
          ? await ModuleWorkflow.findOne({ where: { ...workflowStepWhere, sequence: 2 } })
          : null;

        const nextRoleIds = parseWorkflowRoleIds(nextStep?.allowed_role_id);
        const nextRole = nextRoleIds.length
          ? await Role.findOne({ where: { id: nextRoleIds[0], is_active: true }, attributes: ['id', 'name'] })
          : null;
        const nextRoleName = nextRole?.name;
        const nextRoleId = nextRole?.id;

        if (!nextRoleName) {
          logger.warn('Election resubmit notification skipped: next workflow role not found', {
            electionRequestId: electionRequest.id,
            module: 'ELECTION',
            sequence: 2,
            allowedRoleIds: nextRoleIds
          });
        } else {
          let templateTitle = 'Election Request Resubmitted';
          let templateDescription = `An election request has been resubmitted for society "${societyRegistration?.cooperative_society_name || 'Unknown'}"`;
          let templateId: string | undefined;

          try {
            const template =
              (await NotificationTemplate.findOne({ where: { key: 'election_request_resubmitted', active: true } })) ||
              (await NotificationTemplate.findOne({ where: { key: 'election_request_submit', active: true } }));

            if (template && (template as any).active !== false) {
              templateTitle = template.title || templateTitle;
              templateDescription = template.description || templateDescription;
              templateId = template.id;
            }
          } catch (tplErr: any) {
            logger.warn('Failed to fetch election resubmit notification template, using default text', {
              error: tplErr?.message
            });
          }

          const editorUser = await User.findByPk(updatedBy);
          const username = editorUser?.getFullName?.() || editorUser?.email || '';
          const societyLabel = societyRegistration?.cooperative_society_name || 'Election Request';

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
                election_request_id: electionRequest.id,
                module_name: 'ELECTION',
                next_role: nextRoleName,
                next_role_id: nextRoleId,
                district_id: districtId,
                action: 'resubmitted'
              }),
              redirect_path: NOTIFICATIONS.notifications.election.requested.path.replace('{id}', electionRequest.id),
              created_by: updatedBy,
              notification_template_id: templateId
            } as any,
            [nextRoleName]
          );

          if (notification) {
            logger.info('Election resubmit notification sent to next workflow role in district', {
              electionRequestId: electionRequest.id,
              districtId,
              nextRoleName,
              templateId
            });
          }
        }
      }
    } catch (notificationError: any) {
      logger.warn('Failed to send resubmit notifications for election request (non-fatal)', {
        election_request_id: electionRequest.id,
        error: notificationError?.message || notificationError
      });
    }

    await createActivity({
      title: 'Election Request Resubmitted',
      description: `Election request resubmitted by ${updatedBy}`,
      data: { electionRequest, status: electionRequest.status_id },
      created_by: electionRequest.created_by,
      reference_id: electionRequest.id
    });

    // Attach workflow status (current, next, previous) for the frontend.
    const response: any = electionRequest.toJSON ? electionRequest.toJSON() : electionRequest;
    if (electionRequest.workflow_status) {
      try {
        const workflowStatus = await getWorkflowStatus(electionRequest.id, 'ELECTION', false);
        response.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
      } catch (workflowError: any) {
        logger.warn('Error fetching workflow status after election resubmit:', {
          electionRequestId: electionRequest.id,
          error: workflowError?.message
        });
        response.workflowStatus = {};
      }
    } else {
      response.workflowStatus = {};
    }

    return {
      success: true,
      message: 'Election request resubmitted successfully',
      data: response
    };
  } catch (error: any) {
    logger.error('Error updating election request', { error: error.message, id });
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Delete election request
 */
export const deleteElectionRequest = async (id: string, deletedBy: string): Promise<{ success: boolean; message: string }> => {
  try {
    const electionRequest = await ElectionRequest.findByPk(id);
    if (!electionRequest) {
      return {
        success: false,
        message: 'Election request not found'
      };
    }

    // Only allow deletion if status is pending
    if (electionRequest.status_id) {
      const status = await Status.findByPk(electionRequest.status_id);
      if (status && status.key !== 'pending') {
        return {
          success: false,
          message: 'Cannot delete election request that is not in pending status'
        };
      }
    }

    await electionRequest.destroy();

    return {
      success: true,
      message: 'Election request deleted successfully'
    };
  } catch (error: any) {
    logger.error('Error deleting election request', { error: error.message, id });
    return {
      success: false,
      message: error.message
    };
  }
};
