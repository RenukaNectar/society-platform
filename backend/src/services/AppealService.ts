import { Op, WhereOptions } from 'sequelize';
import Appeal from '../models/Appeal';
import User from '../models/user';
import Media from '../models/Media';
import SocietyRegistration from '../models/SocietyRegistration';
import { AppError } from '../utils/errors';
import AppealReview from '../models/AppealReview';
import Status from '../models/Status';
import { notifyRegistrarsInDistrict, notifyRolesInDistrict, sendNotification } from './NotificationService';
import { NOTIFICATIONS } from '../config';
import logger from '../utils/logger';
import { createActivity } from './ActiviesService';
import {
  formatWorkflowStatusForApi,
  getWorkflowIdByModuleAndSequence,
  getWorkflowStatus,
  parseWorkflowRoleIds
} from './WorkflowUtilService';
import { getLatestCommentDocuments, attachCompleteProcessingHistoryToDetail } from './WorkflowCommentService';
import { findHistoryByReference } from './HistoryService';
import { findStatusByKey } from './StatusService';
import ModuleWorkflow from '../models/ModuleWorkflow';
import Module from '../models/Module';
import Role from '../models/Role';
import NotificationTemplate from '../models/NotificationTemplate';

// Only expose the user data required to identify appeal actors. This keeps
// credentials and other account-only fields out of appeal API responses.
const APPEAL_USER_ATTRIBUTES = ['id', 'first_name', 'last_name'];

const SOCIETY_LOOKUP_ATTRIBUTES = [
  'id',
  'cooperative_society_name',
  'local_langauge_society_name',
  'registration_number',
] as const;

/** Attach society details by registration number for dashboards/details. */
const attachSocietyToAppealPayloads = async <T extends Record<string, any>>(
  appeals: T[],
): Promise<T[]> => {
  if (!Array.isArray(appeals) || appeals.length === 0) return appeals;

  const registrationNumbers = [
    ...new Set(
      appeals
        .map((appeal) => String(appeal?.society_registration_no || '').trim())
        .filter((value) => value.length > 0),
    ),
  ];

  if (registrationNumbers.length === 0) {
    return appeals.map((appeal) => ({
      ...appeal,
      society: appeal.society || null,
      society_name:
        appeal.society_name ||
        appeal.society?.cooperative_society_name ||
        null,
    }));
  }

  const societies = await SocietyRegistration.findAll({
    where: {
      registration_number: { [Op.in]: registrationNumbers },
    },
    attributes: [...SOCIETY_LOOKUP_ATTRIBUTES],
  });

  const societyByRegistrationNo = new Map<string, Record<string, any>>();
  for (const society of societies) {
    const json = society.toJSON ? society.toJSON() : (society as any);
    const registrationNo = String(json.registration_number || '').trim();
    if (registrationNo) {
      societyByRegistrationNo.set(registrationNo, json);
    }
  }

  return appeals.map((appeal) => {
    const registrationNo = String(appeal?.society_registration_no || '').trim();
    const society =
      appeal.society ||
      (registrationNo ? societyByRegistrationNo.get(registrationNo) || null : null);

    return {
      ...appeal,
      society,
      society_name:
        society?.cooperative_society_name ||
        society?.local_langauge_society_name ||
        appeal.society_name ||
        null,
    };
  });
};

export interface IAppealCreateData {
  appellant_type: string;
  name_of_appellant: string;
  society_registration_no?: string;
  contact_phone?: string;
  contact_email?: string;
  order_type?: string;
  specify_order_type?: string;
  order_number?: string | null;
  order_date?: Date | string | null;
  grounds_of_appeal?: string;
  relief_sought?: string;
  supporting_documents?: string;
  date_of_filing?: Date;
  e_signed?: boolean;
  status?: string;
}

export interface IAppealFilters {
  page?: number;
  limit?: number;
  appellant_type?: string;
  status?: string;
  society_registration_no?: string;
  e_signed?: string;
  from?: string;
  to?: string;
  start_date?: string;
  end_date?: string;
}
// Create new appeal
export const createAppeal = async (data: IAppealCreateData, userId: string, req: any): Promise<any> => {
  try {
    //get latest status
    const getdefaultStatus = await Status.findOne({
      where: {
        key: 'submitted'
      }
    });

    // Set workflow_status to first workflow step for APPEAL (sequence 1)
    const workflowStatusId = await getWorkflowIdByModuleAndSequence('APPEAL', 1);
    if (workflowStatusId) {
      logger.info('Auto-setting workflow_status to first workflow step for appeal', {
        workflow_step_id: workflowStatusId,
        sequence: 1
      });
    } else {
      logger.warn('APPEAL sequence 1 workflow step NOT found. Ensure appeal workflow seeder has been run.', {
        module: 'APPEAL',
        sequence: 1
      });
    }

    // Resolve creator's district so workflow notifications can route by district
    const creator = await User.findByPk(userId, { attributes: ['district_id'] });
    const districtId = (creator as any)?.district_id || (req?.user?.district_id as string) || null;

    const { specify_order_type, ...appealData } = data;

    const createPayload: any = {
      ...appealData,
      order_type: data.order_type || null,
      specify_order_type: data.order_type === 'Other'
        ? specify_order_type?.trim() || null
        : null,
      order_number: data.order_number || null,
      order_date: data.order_date || null,
      created_by: userId,
      updated_by: userId,
      active: true,
      status: getdefaultStatus?.id,
      workflow_status: workflowStatusId || null,
      district_id: districtId
    };

    logger.info('Creating appeal with workflow payload', {
      workflow_status: createPayload.workflow_status,
      district_id: createPayload.district_id,
      status: createPayload.status
    });

    const appeal = await Appeal.create(createPayload);

    logger.info('Appeal created', {
      appealId: appeal.id,
      workflow_status_saved: (appeal as any).workflow_status,
      district_id_saved: (appeal as any).district_id
    });

    // Notify all users with the next workflow step's role in the same district.
    // Uses the `appeal_submit` notification template (from DB) and replaces placeholders.
    try {
      if (!districtId) {
        logger.warn('Appeal create notification skipped: no district_id for creator', {
          appealId: appeal.id,
          userId
        });
      } else {
        const appealModule = await Module.findOne({ where: { key: 'APPEAL', active: true } });
        const workflowStepWhere = appealModule
          ? { module_id: appealModule.id, active: true, is_hq: false }
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
        const nextRoleName = nextRole?.name;
        const nextRoleId = nextRole?.id;

        if (!nextRoleName) {
          logger.warn('Appeal create notification skipped: next workflow role not found', {
            appealId: appeal.id,
            module: 'APPEAL',
            sequence: 2,
            allowedRoleIds: nextRoleIds
          });
        } else {
          let templateTitle = NOTIFICATIONS.notifications.appeal.requested.title as string;
          let templateDescription = `A new appeal has been submitted by "${appeal.name_of_appellant}" for society "${appeal.society_registration_no || 'N/A'}"`;
          let templateId: string | undefined;

          try {
            const templateIdFromWorkflow = currentStep?.approval_notification_template_id || null;
            const template = templateIdFromWorkflow
              ? await NotificationTemplate.findByPk(templateIdFromWorkflow)
              : await NotificationTemplate.findOne({ where: { key: 'appeal_submit', active: true } });

            if (template && (template as any).active !== false) {
              templateTitle = template.title || templateTitle;
              templateDescription = template.description || templateDescription;
              templateId = template.id;
            }
          } catch (tplErr: any) {
            logger.warn('Failed to fetch appeal_submit notification template, using default text', {
              error: tplErr?.message
            });
          }

          const creatorUser = await User.findByPk(userId);
          const username = creatorUser?.getFullName?.() || creatorUser?.email || '';
          const societyLabel =
            appeal.name_of_appellant ||
            appeal.society_registration_no ||
            'Appeal';

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
                appeal_id: appeal.id,
                module_name: 'APPEAL',
                next_role: nextRoleName,
                next_role_id: nextRoleId,
                district_id: districtId
              }),
              redirect_path: NOTIFICATIONS.notifications.appeal.requested.path.replace('{id}', appeal.id),
              created_by: userId,
              notification_template_id: templateId
            } as any,
            [nextRoleName]
          );

          if (notification) {
            logger.info('Appeal create notification sent to next workflow role in district', {
              appealId: appeal.id,
              districtId,
              nextRoleName,
              templateId
            });
          }
        }
      }
    } catch (error: any) {
      logger.warn('Failed to send appeal create notification (non-fatal)', {
        appealId: appeal.id,
        error: error?.message
      });
    }

    // Log activity
    await createActivity({
      title: 'Appeal Created',
      description: `New appeal submitted by "${data.name_of_appellant}" for society "${data.society_registration_no || 'Unknown'}"`,
      data: {
        appeal_id: appeal.id,
        appellant_type: data.appellant_type,
        appellant_name: data.name_of_appellant,
        society_registration_no: data.society_registration_no,
        order_type: createPayload.order_type,
        specify_order_type: createPayload.specify_order_type,
        order_number: data.order_number,
        grounds_of_appeal: data.grounds_of_appeal,
        created_by: userId
      },
      reference_id: appeal.id,
      created_by: userId
    });

    // Attach workflow status (current, next, previous) for frontend
    const response: any = appeal.toJSON ? appeal.toJSON() : appeal;
    if (appeal.workflow_status) {
      try {
        const workflowStatus = await getWorkflowStatus(appeal.id, 'APPEAL', false);
        response.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
      } catch (workflowError: any) {
        logger.warn('Error fetching workflow status after appeal create:', {
          appealId: appeal.id,
          error: workflowError?.message
        });
        response.workflowStatus = {};
      }
    } else {
      response.workflowStatus = {};
    }

    return response;
  } catch (error) {
    logger.error('Error creating appeal:', error);
    throw new AppError('Failed to create appeal', 500);
  }
};
// Get all appeals with filters and pagination
export const getAppeals = async (filters: IAppealFilters, search?: string,
  authenticatedUser?: {
    district_id?: string; role?: string;
    userId?: string
  }): Promise<{
    appeals: Appeal[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
    };
  }> => {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;


    // Build where conditions
    const whereConditions: WhereOptions = {
      active: true
    };

    if (filters.appellant_type) {
      whereConditions.appellant_type = filters.appellant_type;
    }

    if (filters.status) {
      whereConditions.status = filters.status;
    }

    if (filters.society_registration_no) {
      whereConditions.society_registration_no = {
        [Op.like]: `%${filters.society_registration_no}%`
      };
    }

    if (filters.from && filters.to) {
      whereConditions.date_of_filing = {
        [Op.between]: [filters.from, filters.to]
      };
    }

    if (filters.e_signed) {
      whereConditions.e_signed = filters.e_signed;
    }

    if (search) {
      (whereConditions as any)[Op.or] = [
        { name_of_appellant: { [Op.like]: `%${search}%` } },
        { society_registration_no: { [Op.like]: `%${search}%` } },
        { order_number: { [Op.like]: `%${search}%` } },
        { order_type: { [Op.like]: `%${search}%` } },
        { relief_sought: { [Op.like]: `%${search}%` } }
      ];
    }


    // Role-based visibility:
    //  - applicant: only their own appeals (created_by)
    //  - admin / jt_rcs_district / rcs_district / super_admin: see ALL appeals (no district filter)
    //  - other workflow roles (drcs_arcs_district, jics_sics_district, etc.): scoped to their district
    const FULL_ACCESS_ROLES = ['admin', 'super_admin', 'jt_rcs_district', 'rcs_district'];

    if (authenticatedUser?.role === 'applicant' && authenticatedUser.userId) {
      (whereConditions as any).created_by = authenticatedUser.userId;
    } else if (
      authenticatedUser?.role &&
      !FULL_ACCESS_ROLES.includes(authenticatedUser.role) &&
      authenticatedUser?.district_id
    ) {
      (whereConditions as any).district_id = authenticatedUser.district_id;
    }

    // Get appeals with associations
    const { count, rows } = await Appeal.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: APPEAL_USER_ATTRIBUTES,
        },
        {
          model: User,
          as: 'updatedByUser',
          attributes: APPEAL_USER_ATTRIBUTES,
        },
        {
          model: User,
          as: 'statusUpdatedByUser',
          attributes: APPEAL_USER_ATTRIBUTES,
        },
        {
          model: Media,
          as: 'supportingDocumentFile'
        },
        {
          model: Status,
          as: 'appealStatus'
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);
    const plainAppeals = rows.map((row) => (row.toJSON ? row.toJSON() : row));
    const appealsWithSociety = await attachSocietyToAppealPayloads(plainAppeals);
    const appeals = await Promise.all(
      appealsWithSociety.map(async (plain: any) => {
        if (!plain?.id) return plain;
        try {
          const workflowStatus = await getWorkflowStatus(plain.id, 'APPEAL', false);
          plain.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
        } catch (workflowError: any) {
          logger.warn('Error fetching workflow status for appeal in list:', {
            appealId: plain.id,
            error: workflowError?.message
          });
          plain.workflowStatus = null;
        }
        return plain;
      })
    );

    return {
      appeals,
      pagination: {
        current_page: Number(page),
        total_pages: totalPages,
        total_items: count,
        items_per_page: Number(limit)
      }
    };
  } catch (error) {
    logger.error('Error getting appeals:', error);
    throw new AppError('Failed to retrieve appeals', 500);
  }
};

// Get appeal by ID
export const getAppealById = async (id: string): Promise<any> => {
  try {
    const appeal = await Appeal.findOne({
      where: {
        id,
        active: true
      },
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: APPEAL_USER_ATTRIBUTES,
        },
        {
          model: User,
          as: 'updatedByUser',
          attributes: APPEAL_USER_ATTRIBUTES,
        },
        {
          model: User,
          as: 'statusUpdatedByUser',
          attributes: APPEAL_USER_ATTRIBUTES,
        },
        {
          model: User,
          as: 'assignedToUser',
          required: false,
          attributes: APPEAL_USER_ATTRIBUTES,
        },
        {
          model: Media,
          as: 'supportingDocumentFile'
        },
        {
          model: Media,
          as: 'byeLawsMedia',
          required: false,
          attributes: ['id', 'url']
        },
        {
          model: Status,
          as: 'appealStatus'
        },
        {
          model: ModuleWorkflow,
          as: 'workflowStatus',
          required: false
        }
      ]
    });

    if (!appeal) {
      return null;
    }

    // Attach workflow status (current, next, previous) for frontend
    const response: any = appeal.toJSON ? appeal.toJSON() : appeal;
    if (appeal.workflow_status) {
      try {
        const workflowStatus = await getWorkflowStatus(appeal.id, 'APPEAL', false);
        response.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
      } catch (workflowError: any) {
        logger.warn('Error fetching workflow status for appeal details:', {
          appealId: appeal.id,
          error: workflowError?.message
        });
        response.workflowStatus = {};
      }
    } else {
      response.workflowStatus = {};
    }

    try {
      response.previousCommentDocuments = await getLatestCommentDocuments(appeal.id, 'APPEAL');
    } catch (documentsError: any) {
      logger.warn('Error fetching previous comment documents for appeal details:', {
        appealId: appeal.id,
        error: documentsError?.message
      });
      response.previousCommentDocuments = [];
    }

    try {
      response.history = await findHistoryByReference(appeal.id, 'APPEAL');
    } catch (historyError: any) {
      logger.warn('Error fetching history for appeal details:', {
        appealId: appeal.id,
        error: historyError?.message
      });
      response.history = [];
    }

    await attachCompleteProcessingHistoryToDetail(response, appeal.id, 'APPEAL');

    const [appealWithSociety] = await attachSocietyToAppealPayloads([response]);
    return appealWithSociety;
  } catch (error) {
    logger.error('Error getting appeal by ID:', error);
    throw new AppError('Failed to retrieve appeal', 500);
  }
};

// Review appeal / record hearing
export const reviewAppealService = async (id: string, reviewData: any, userId: string): Promise<AppealReview> => {
  try {
    const appeal = await Appeal.findByPk(id);
    if (!appeal) {
      throw new AppError('Appeal not found', 404);
    }

    const statusKey = reviewData.status || 'hearing_required';
    const statusRecord =
      (await findStatusByKey(statusKey)) ||
      (await Status.findOne({
        where: {
          [Op.or]: [{ key: statusKey }, { id: statusKey }],
        },
      }));

    if (!statusRecord) {
      throw new AppError(`Status "${statusKey}" not found`, 400);
    }

    const { status: _statusInput, ...reviewFields } = reviewData;

    const review = await AppealReview.create({
      appeal_id: appeal.id,
      ...reviewFields,
      status: statusRecord.id,
      status_updated_by: userId,
      status_updated_at: new Date(),
      created_by: userId,
      updated_by: userId,
    });

    await Appeal.update(
      {
        status: statusRecord.id,
        status_updated_by: userId,
        status_updated_at: new Date(),
      },
      { where: { id: appeal.id } }
    );

    try {
      await createActivity({
        title: 'Appeal Reviewed',
        description: `Appeal hearing recorded by officer`,
        data: { appeal, review, userId },
        created_by: userId,
        reference_id: appeal.id
      });

      try {
        const createdByUser = await User.findByPk(appeal.created_by as string);
        if (createdByUser) {
          await sendNotification([appeal.created_by as string], {
            title: NOTIFICATIONS.notifications.appeal.reviewed.title as any,
            description: `A hearing has been scheduled for your appeal.`,
            data: JSON.stringify({ appeal, review }),
            redirect_path: NOTIFICATIONS.notifications.appeal.reviewed.path.replace('{id}', appeal.id),
            created_by: userId
          });
        }
      } catch (error) {
        logger.error('Error sending notification for appeal review:', error);
      }
    } catch (error) {
      logger.error('Error creating activity for appeal review:', error);
    }

    return review;
  } catch (error: any) {
    logger.error('Error reviewing appeal:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error?.message || 'Failed to review appeal', 500);
  }
};


export const getAppealsReviewList = async (id: string): Promise<AppealReview[]> => {
  const reviews = await AppealReview.findAll({
    where: {
      appeal_id: id
    }
  });
  return reviews;
};

// status change
export const statusChange = async (id: string, status: string, userId: string): Promise<Appeal> => {
  const appeal = await Appeal.findByPk(id);
  if (!appeal) {
    throw new AppError('Appeal not found', 404);
  }
  await Appeal.update({ status, status_updated_by: userId, status_updated_at: new Date() }, { where: { id: appeal.id } });
  // send notifications to the created by user
  try {
    const createdByUser = await User.findByPk(appeal.created_by as string)
    if (createdByUser) {
      await notifyRegistrarsInDistrict(createdByUser.district_id as string, {
        title: NOTIFICATIONS.notifications.appeal.approved.title as any,
        description: `The status of your appeal has been changed to ${status}`,
        data: JSON.stringify({ appeal }),
        redirect_path: NOTIFICATIONS.notifications.appeal.approved.path.replace('{id}', appeal.id),
        created_by: userId
      }, ['registrar'])
    }
  } catch (error) {
    logger.error('Error sending status change notification:', error);
  }
  return appeal;

};
