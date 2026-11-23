import { Op } from 'sequelize';
import SocietyRenewal from '../models/SocietyRenewal';
import SocietyRegistration from '../models/SocietyRegistration';
import User from '../models/user';
import Status from '../models/Status';
import Module from '../models/Module';
import ModuleWorkflow from '../models/ModuleWorkflow';
import Role from '../models/Role';
import NotificationTemplate from '../models/NotificationTemplate';
import { ISocietyRenewal, ISocietyRenewalCreate, ISocietyRenewalUpdate } from '../types';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { NOTIFICATIONS } from '../config';
import { findStatusByKey } from './StatusService';
import { findUserById } from './UserService';
import { mediaUpload } from './MediaService';
import {
  formatWorkflowStatusForApi,
  getWorkflowStatus,
  getWorkflowIdByModuleAndSequence,
  parseWorkflowRoleIds,
} from './WorkflowUtilService';
import { getLatestCommentDocuments, attachCompleteProcessingHistoryToDetail } from './WorkflowCommentService';
import { notifyRolesInDistrict } from './NotificationService';
import { createHistory } from './HistoryService';
import Media from '../models/Media';
import { getSocietyAddress } from '../utils/societyAddress';

const enrichRenewalDetail = async (renewal: SocietyRenewal): Promise<Record<string, unknown>> => {
  const json = renewal.toJSON() as unknown as Record<string, unknown>;
  json.societyAddress = await getSocietyAddress(String(json.society_id || renewal.society_id)).catch(
    () => null
  );
  try {
    const workflow = await getWorkflowStatus(renewal.id, 'SOCIETY_RENEWAL', false);
    json.workflowStatus = formatWorkflowStatusForApi(workflow);
    json.previousCommentDocuments = await getLatestCommentDocuments(renewal.id, 'SOCIETY_RENEWAL');
  } catch (err) {
    logger.warn('Failed to enrich renewal detail', {
      renewalId: renewal.id,
      error: (err as Error)?.message
    });
    json.workflowStatus = null;
    json.previousCommentDocuments = [];
  }
  await attachCompleteProcessingHistoryToDetail(json, renewal.id, 'SOCIETY_RENEWAL', {
    historyResources: ['SOCIETY_RENEWAL', 'society_renewal']
  });
  return json;
};

export const createSocietyRenewal = async (data: ISocietyRenewalCreate): Promise<ISocietyRenewal> => {
  try {
    // Set workflow_status to first workflow step for SOCIETY_RENEWAL (sequence 1)
    const workflowStatusId = await getWorkflowIdByModuleAndSequence('SOCIETY_RENEWAL', 1);
    if (workflowStatusId) {
      logger.info('Auto-setting workflow_status to first workflow step for renewal', {
        workflow_step_id: workflowStatusId,
        sequence: 1
      });
    }

    // Set status to first step status (renewal_challan_uploaded) when using workflow
    let initialStatusId: string | null = data.status || null;
    if (workflowStatusId) {
      const renewalChallanStatus = await findStatusByKey('renewal_challan_uploaded');
      if (renewalChallanStatus) {
        initialStatusId = renewalChallanStatus.id;
      }
    }

    // Check if society already has a renewal with the same status
    const existing = await SocietyRenewal.findOne({
      where: {
        society_id: data.society_id,
        status: initialStatusId
      }
    });
    if (existing) {
      throw new AppError('Society already has a renewal with the same status', 400);
    }

    // Remove workflow fields from input; we set them automatically
    const { workflow_status, assigned_to_user_id, status, ...dataWithoutWorkflowFields } = data;
    const createData = {
      ...dataWithoutWorkflowFields,
      status: initialStatusId,
      workflow_status: workflowStatusId,
      assigned_to_user_id: null
    };

    const renewal = await SocietyRenewal.create(createData);
    logger.info('Society renewal created successfully', { renewalId: renewal.id, societyId: renewal.society_id });

    // Notify all district officers for workflow step 2 (DRCS/ARCS) when applicant uploads challan.
    const society = await SocietyRegistration.findByPk(renewal.society_id, {
      attributes: ['id', 'district_id', 'cooperative_society_name'],
    });
    if (society?.district_id) {
      try {
        const module = await Module.findOne({ where: { key: 'SOCIETY_RENEWAL', active: true } });
        const workflowStepWhere = module
          ? { module_id: module.id, active: true, is_hq: false }
          : null;

        const currentStep = workflowStepWhere
          ? await ModuleWorkflow.findOne({ where: { ...workflowStepWhere, sequence: 1 } })
          : null;
        const nextStep = workflowStepWhere
          ? await ModuleWorkflow.findOne({ where: { ...workflowStepWhere, sequence: 2 } })
          : null;

        const nextRoleIds = parseWorkflowRoleIds(nextStep?.allowed_role_id);
        const nextRoles = nextRoleIds.length
          ? await Role.findAll({
              where: { id: { [Op.in]: nextRoleIds }, is_active: true },
              attributes: ['id', 'name'],
            })
          : [];
        const nextRoleNames = [...new Set(nextRoles.map((role) => role.name).filter(Boolean))];

        if (!nextRoleNames.length) {
          logger.warn('Workflow next step role not found, skipping renewal create notifications', {
            renewal_id: renewal.id,
            society_id: renewal.society_id,
            allowed_role_ids: nextRoleIds,
          });
        } else {
          let templateTitle = NOTIFICATIONS.notifications.society.renewal.created.title as string;
          let templateDescription = `A new society renewal has been submitted for ${society.cooperative_society_name || 'the society'} in your district.`;
          let templateId: string | undefined;

          try {
            const templateIdFromWorkflow = currentStep?.approval_notification_template_id || null;
            const template = templateIdFromWorkflow
              ? await NotificationTemplate.findByPk(templateIdFromWorkflow)
              : await NotificationTemplate.findOne({
                  where: { key: 'society_renewal_challan_uploaded', active: true },
                });

            if (template && (template as { active?: boolean }).active !== false) {
              templateTitle = template.title || templateTitle;
              templateDescription = template.description || templateDescription;
              templateId = template.id;
            }
          } catch (tplErr) {
            logger.warn('Failed to fetch society_renewal_challan_uploaded template', {
              error: tplErr instanceof Error ? tplErr.message : String(tplErr),
            });
          }

          const creatorUser = renewal.created_by ? await findUserById(renewal.created_by) : null;
          const username =
            `${creatorUser?.first_name || ''} ${creatorUser?.last_name || ''}`.trim() ||
            creatorUser?.email ||
            'Applicant';
          const societyLabel = society.cooperative_society_name || 'the society';

          const description = templateDescription
            .replace(/\{\{username\}\}/g, username)
            .replace(/\{\{SocietyName\}\}/g, societyLabel)
            .replace(/\{\{roleName\}\}/g, nextRoleNames.join(', '))
            .replace(/\{\{[^}]+\}\}/g, '');

          const notificationData = {
            title: templateTitle,
            description,
            data: JSON.stringify({
              renewal: renewal.toJSON(),
              society: society.toJSON ? society.toJSON() : society,
              next_roles: nextRoleNames,
            }),
            redirect_path: (NOTIFICATIONS.notifications.society.renewal.created.path as string).replace(
              '{id}',
              society.id || 'unknown',
            ),
            created_by: renewal.created_by,
            notification_template_id: templateId,
          };

          const notification = await notifyRolesInDistrict(
            society.district_id,
            notificationData as any,
            nextRoleNames,
          );

          logger.info('Renewal create notification sent to district officers', {
            district_id: society.district_id,
            roles: nextRoleNames,
            notified: !!notification,
          });
        }
      } catch (notificationError) {
        logger.warn('Failed to send renewal create notifications; renewal was created successfully', {
          renewal_id: renewal.id,
          society_id: renewal.society_id,
          district_id: society.district_id,
          error: notificationError instanceof Error ? notificationError.message : String(notificationError),
        });
      }
    } else {
      logger.warn('Society district not found, skipping renewal create notifications', {
        renewal_id: renewal.id,
        society_id: renewal.society_id,
      });
    }

    // history for society renewal creation
    await createHistory({
      resource: 'society_renewal',
      type: 'create',
      reference_id: renewal.id,
      created_by: renewal.created_by,
      comments: `Society renewal created for society: ${society?.cooperative_society_name || 'Unknown'}`,
      data: JSON.stringify({ renewal })
    });

    return renewal.toJSON() as ISocietyRenewal;
  } catch (error: any) {
    logger.error('Failed to create society renewal:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to create society renewal', 500);
  }
};

export const deleteSocietyRenewal = async (
  id: string,
  userId: string,
): Promise<void> => {
  try {
    const renewal = await SocietyRenewal.findByPk(id, {
      include: [
        {
          model: Status,
          as: 'statusDetails',
          attributes: ['id', 'key', 'title'],
        },
        {
          model: ModuleWorkflow,
          as: 'workflowStatus',
          attributes: ['id', 'sequence'],
        },
      ],
    });

    if (!renewal) {
      throw new AppError('Society renewal not found', 404);
    }

    const user = await findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.role || user.role.name !== 'applicant') {
      throw new AppError('Only applicants can remove renewal challan', 403);
    }

    const renewalData = renewal.toJSON() as any;
    if (renewalData.created_by !== userId) {
      throw new AppError('You can only remove your own renewal challan', 403);
    }

    const statusKey = renewalData.statusDetails?.key;
    if (statusKey !== 'renewal_challan_uploaded') {
      throw new AppError(
        'Renewal challan cannot be removed after workflow action has started',
        400,
      );
    }

    const firstWorkflowStepId = await getWorkflowIdByModuleAndSequence(
      'SOCIETY_RENEWAL',
      1,
    );
    if (
      firstWorkflowStepId &&
      renewalData.workflow_status &&
      renewalData.workflow_status !== firstWorkflowStepId
    ) {
      throw new AppError(
        'Renewal challan cannot be removed after workflow action has started',
        400,
      );
    }

    const society = await SocietyRegistration.findByPk(renewal.society_id, {
      attributes: ['id', 'cooperative_society_name'],
    });

    await renewal.destroy();

    await createHistory({
      resource: 'society_renewal',
      type: 'delete',
      reference_id: id,
      created_by: userId,
      comments: `Renewal challan removed for society: ${society?.cooperative_society_name || 'Unknown'}`,
      data: JSON.stringify({ renewal_id: id, society_id: renewal.society_id }),
    });

    logger.info('Society renewal deleted successfully', { renewalId: id });
  } catch (error: any) {
    logger.error('Failed to delete society renewal:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete society renewal', 500);
  }
};

export const updateSocietyRenewal = async (id: string, data: ISocietyRenewalUpdate): Promise<ISocietyRenewal> => {
  try {
    const renewal = await SocietyRenewal.findByPk(id);
    if (!renewal) {
      throw new AppError('Society renewal not found', 404);
    }

    await renewal.update(data);
    logger.info('Society renewal updated successfully', { renewalId: id });

    const updatedRenewal = await SocietyRenewal.findByPk(id, {
      include: [
        {
          model: Status,
          as: 'statusDetails',
          attributes: ['id', 'key', 'title']
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
        {
          model: SocietyRegistration,
          as: 'society',
          attributes: ['id', 'society_id', 'cooperative_society_name']
        }
      ]
    });

    return updatedRenewal?.toJSON() as ISocietyRenewal;
  } catch (error: any) {
    logger.error('Failed to update society renewal:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update society renewal', 500);
  }
};

export const getAllSocietyRenewals = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  filters?: any,
  authenticatedUser?: { userId?: string; role?: string; district_id?: string | null; is_hq?: boolean }
) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    // Status filter
    if (filters?.status) {
      whereClause.status = filters.status;
    }

    // Society ID filter
    if (filters?.society_id) {
      whereClause.society_id = filters.society_id;
    }

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { society_id: { [Op.like]: `%${search}%` } }
      ];
    }

    // Date range filter
    if (filters?.from || filters?.to) {
      whereClause.created_at = {};
      if (filters?.from) {
        const fromDate = new Date(filters.from);
        if (!isNaN(fromDate.getTime())) {
          whereClause.created_at[Op.gte] = fromDate;
        }
      }
      if (filters?.to) {
        const toDate = new Date(filters.to);
        if (!isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          whereClause.created_at[Op.lte] = toDate;
        }
      }
    }

    // Role-based filtering
    if (authenticatedUser) {
      const userRole = authenticatedUser.role;
      const isHq = authenticatedUser.is_hq || false;

      if (userRole === 'admin') {
        // Admin users can see all renewals (no additional filter)
        logger.info('Admin user - allowing access to all renewals');
      } else if (userRole === 'applicant') {
        // Applicants can only see renewals for societies they own
        if (authenticatedUser.userId) {
          whereClause['$society.created_by$'] = authenticatedUser.userId;
          logger.info('Applied applicant filter', { society_created_by: authenticatedUser.userId });
        } else {
          logger.warn('Applicant user ID not provided, returning empty result');
          return {
            renewals: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false
            }
          };
        }
      } else {
        const isCrossDistrictRole =
          userRole === 'rcs_district' || userRole === 'jt_rcs_district';
        // For other roles (registrars, inspectors, etc.)
        if (isHq || isCrossDistrictRole) {
          // HQ and RCS / JT RCS district roles: all districts (no district filter)
          logger.info('HQ or RCS/JT RCS district role - allowing access to all renewals');
        } else {
          // Non-HQ users: apply district-based filtering
          if (authenticatedUser.district_id) {
            whereClause['$society.district_id$'] = authenticatedUser.district_id;
            logger.info('Applied user district filter', { district_id: authenticatedUser.district_id });
          } else {
            // If no user district provided, return empty result for security
            logger.warn('No user district provided, returning empty result for security');
            return {
              renewals: [],
              pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0,
                hasNext: false,
                hasPrev: false
              }
            };
          }
        }
      }
    }

    // Determine if society include should be required (for district filtering or applicant filtering)
    const isCrossDistrictRole =
      authenticatedUser?.role === 'rcs_district' ||
      authenticatedUser?.role === 'jt_rcs_district';
    const requireSociety = !!(authenticatedUser &&
      authenticatedUser.role !== 'admin' &&
      authenticatedUser.role !== 'super_admin' &&
      !authenticatedUser.is_hq &&
      !isCrossDistrictRole &&
      (authenticatedUser.role === 'applicant' || authenticatedUser.district_id));

    const { count, rows } = await SocietyRenewal.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Status,
          as: 'statusDetails',
          attributes: ['id', 'key', 'title']
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
        {
          model: SocietyRegistration,
          as: 'society',
          attributes: ['id', 'society_id', 'cooperative_society_name', 'local_langauge_society_name', 'registration_number', 'district_id', 'created_by'],
          required: requireSociety
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);
    const renewals = await Promise.all(rows.map((renewal) => enrichRenewalDetail(renewal)));

    return {
      renewals,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error: any) {
    logger.error('Failed to get all society renewals:', error);
    throw new AppError('Failed to get all society renewals', 500);
  }
};

export const getSocietyRenewalsBySocietyId = async (societyId: string) => {
  try {
    const renewals = await SocietyRenewal.findAll({
      where: { society_id: societyId },
      include: [
        {
          model: Status,
          as: 'statusDetails',
          attributes: ['id', 'key', 'title']
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
        {
          model: SocietyRegistration,
          as: 'society',
          attributes: [
            'id',
            'society_id',
            'cooperative_society_name',
            'local_langauge_society_name',
            'registration_number',
            'district_id',
            'state_id',
            'certificate_media_id',
            'notification_media_id',
            'certificate_issue_date',
            'catificate_issued_by',
            'full_address',
          ],
          required: false,
          include: [
            {
              model: User,
              as: 'catificateIssuedByUser',
              attributes: ['id', 'first_name', 'last_name'],
              required: false,
            },
            {
              model: Media,
              as: 'certificateMedia',
              attributes: ['id', 'url', 'active', 'created_at'],
              required: false,
            },
            {
              model: Media,
              as: 'notificationMedia',
              attributes: ['id', 'url', 'active'],
              required: false,
            },
          ],
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const result = await Promise.all(renewals.map((renewal) => enrichRenewalDetail(renewal)));

    return result;
  } catch (error: any) {
    logger.error('Failed to get society renewals by society ID:', error);
    throw new AppError('Failed to get society renewals by society ID', 500);
  }
};

export type RenewalChallanReceipt = {
  id: string;
  url: string;
  status_key: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
};

/** Latest renewal challan URL — same source as renewals module (`renewal.challan_url`). */
export const resolveLatestRenewalChallanReceipt = async (
  societyRegistrationId: string,
): Promise<RenewalChallanReceipt | null> => {
  const latestRenewalWithChallan = await SocietyRenewal.findOne({
    where: {
      society_id: societyRegistrationId,
      challan_url: { [Op.ne]: null },
    },
    include: [
      {
        model: Status,
        as: 'statusDetails',
        attributes: ['id', 'key', 'title'],
      },
    ],
    order: [
      ['submit_date', 'DESC'],
      ['updated_at', 'DESC'],
      ['created_at', 'DESC'],
    ],
  });

  if (!latestRenewalWithChallan?.challan_url) {
    return null;
  }

  const statusDetails = (latestRenewalWithChallan as any).statusDetails;

  return {
    id: latestRenewalWithChallan.id,
    url: latestRenewalWithChallan.challan_url,
    status_key: statusDetails?.key || null,
    created_at:
      latestRenewalWithChallan.submit_date ||
      latestRenewalWithChallan.created_at,
    updated_at: latestRenewalWithChallan.updated_at,
  };
};

