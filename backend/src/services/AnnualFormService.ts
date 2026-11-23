import { Op } from 'sequelize';
import AnnualForm from '../models/AnnualForm';
import Status from '../models/Status';
import Media from '../models/Media';
import User from '../models/user';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { findStatusByKey, findStatusById, getAllStatuses } from './StatusService';
import { IAuthRequest } from '../types';
import { createHistory, findHistoryByReference } from './HistoryService';
import SocietyRegistration from '../models/SocietyRegistration';
import { findUserById } from './UserService';
import { notifyInspectorsInDistrict, notifyRegistrarsInDistrict, notifyRolesInDistrict } from './NotificationService';
import { NOTIFICATIONS } from '../config';
import { getDistrictById } from './DistrictService';
import { getSocietyByUserId } from './SocietyRegistrationService';
import { canManageAmendments } from '../middleware/rbac';
import MisappropriationLevel from '../models/MisappropriationLevel';
import CostOfManagementType from '../models/CostOfManagementType';
import ArbitrationAuthority from '../models/ArbitrationAuthority';
import { getAllDistricts } from './DistrictService';
import { createActivity } from './ActiviesService';
import {
  formatWorkflowStatusForApi,
  getWorkflowIdByModuleAndSequence,
  getWorkflowStatus,
  parseWorkflowRoleIds
} from './WorkflowUtilService';
import { getLatestCommentDocuments, attachCompleteProcessingHistoryToDetail } from './WorkflowCommentService';
import Module from '../models/Module';
import ModuleWorkflow from '../models/ModuleWorkflow';
import Role from '../models/Role';
import NotificationTemplate from '../models/NotificationTemplate';

// Helper function to find and assign a valid district
const findValidDistrict = async (society: any, userId: string) => {
  try {
    // First try to get the district by the current district_id
    if (society.district_id) {
      try {
        const district = await getDistrictById(society.district_id);
        if (district) {
          logger.info('Valid district found for society:', { 
            society_id: society.id, 
            district_id: society.district_id, 
            district_name: district.name 
          });
          return district;
        }
      } catch (districtError) {
        logger.warn('Invalid district_id found for society, will try to find alternative:', { 
          society_id: society.id, 
          invalid_district_id: society.district_id 
        });
      }
    }

    // If no valid district found, try to find a default district
    const allDistricts = await getAllDistricts(1, 100);
    if (allDistricts.districts && allDistricts.districts.length > 0) {
      const defaultDistrict = allDistricts.districts[0];
      if (defaultDistrict) {
        logger.info('Assigning default district to society:', { 
          society_id: society.id, 
          default_district_id: defaultDistrict.id, 
          default_district_name: defaultDistrict.name 
        });
        
        // Update the society with the valid district_id
        await SocietyRegistration.update(
          { district_id: defaultDistrict.id },
          { where: { id: society.id } }
        );
        
        // Update the society object for this request
        society.district_id = defaultDistrict.id;
        
        return defaultDistrict;
      }
    }
    
    throw new AppError('No districts available in the system', 500);
  } catch (error) {
    logger.error('Error finding valid district:', error);
    throw error;
  }
};

/** HQ / state-level roles and is_hq users see all annual filings (mirrors Election listing). */
const ANNUAL_FILING_FULL_ACCESS_ROLES = new Set([
  'admin',
  'super_admin',
  'jics_sics_hq',
  'drcs_arcs_hq',
  'jt_rcs_district',
  'rcs_district'
]);

const shouldScopeAnnualFormsByDistrict = (user: any): boolean => {
  if (!user?.district_id) {
    return false;
  }
  const roleName = user?.role?.name;
  if (roleName === 'applicant') {
    return false;
  }
  if (Boolean(user?.is_hq)) {
    return false;
  }
  if (roleName && ANNUAL_FILING_FULL_ACCESS_ROLES.has(roleName)) {
    return false;
  }
  return true;
};

/** After a forward or return, workflow_status is the step that now holds the file. */
const attachCurrentHolderRoles = async (rows: any[]) => {
  const held = rows.filter((row) => {
    const key = row?.statusDetails?.key;
    return (
      (key === 'rejected' || key === 'reverted' || key === 'forwarded') &&
      row?.workflow_status
    );
  });
  if (held.length === 0) return;

  const workflowIds = [...new Set(held.map((row) => row.workflow_status))];
  const workflows = await ModuleWorkflow.findAll({
    where: { id: { [Op.in]: workflowIds } },
    attributes: ['id', 'allowed_role_id']
  });

  const roleIdByWorkflow = new Map<string, string>();
  const roleIds = new Set<string>();
  for (const workflow of workflows) {
    const roleId = parseWorkflowRoleIds(workflow.allowed_role_id)[0];
    if (!roleId) continue;
    roleIdByWorkflow.set(workflow.id, roleId);
    roleIds.add(roleId);
  }
  if (roleIds.size === 0) return;

  const roles = await Role.findAll({
    where: { id: { [Op.in]: [...roleIds] } },
    attributes: ['id', 'name', 'description']
  });
  const roleById = new Map(roles.map((role) => [role.id, role]));

  for (const row of held) {
    const role = roleById.get(roleIdByWorkflow.get(row.workflow_status) || '');
    if (!role) continue;
    row.workflowStatus = {
      ...(row.workflowStatus || {}),
      current: {
        ...(row.workflowStatus?.current || {}),
        allowedRole: {
          id: role.id,
          name: role.name,
          description: role.description
        }
      }
    };
  }
};

export const getAllAnnualForms = async (page: number = 1, limit: number = 10, filters?: any, search?: string, userId?: string) => {
  try {
    if (!userId) {
      throw new Error('User Not Found');
    }

    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (filters.status) whereClause.status = filters.status;
    if (filters.society_id) whereClause.society_id = filters.society_id;
    if (filters.from || filters.to) whereClause.created_at = {};
    if (filters.from) whereClause.created_at[Op.gte] = new Date(filters.from);
    if (filters.to) whereClause.created_at[Op.lte] = new Date(filters.to);

    if (search) {
      whereClause[Op.or] = [
        { society_id: { [Op.like]: `%${search}%` } },
        { financial_year: { [Op.like]: `%${search}%` } },
        {registration_number: { [Op.like]: `%${search}%` } },
        {society_name: { [Op.like]: `%${search}%` } }
      ];
    }

    // Get user details including district from database
    const user = await findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Debug logging
    logger.info('Annual forms listing access', {
      role: user?.role?.name,
      district_id: user?.district_id,
      is_hq: user?.is_hq,
      districtScoped: shouldScopeAnnualFormsByDistrict(user)
    });

    // Role-based access control
    if (user?.role?.name === 'applicant') {
      // Applicants can only see their own annual forms
      whereClause.created_by = userId;
    }
    // District officers are scoped below; HQ / RCS / admin see all filings

    // Build the include array
    const includeArray: any[] = [
      {
        model: Status,
        as: 'statusDetails',
        attributes: ['id', 'title', 'key']
      },
      {
        model: SocietyRegistration,
        as: 'society',
        attributes: ['id', 'society_id']
      },
      {
        model: Media,
        as: 'balanceSheetAnnualForms',
        attributes: ['id', 'url', 'active']
      },
      {
        model: CostOfManagementType,
        as: 'costOfManagementTypeAnnualForms',
        attributes: ['id', 'name']
      },
      {
        model: MisappropriationLevel,
        as: 'misappropriationLevelAnnualForms',
        attributes: ['id', 'name']
      },
      {
        model: ArbitrationAuthority,
        as: 'arbitrationAuthorityAnnualForms',
        attributes: ['id', 'name']
      }
    ];

    includeArray.push({
      model: User,
      as: 'statusChangedByUser',
      attributes: ['id', 'first_name', 'last_name', 'email'],
      required: false,
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
          required: false,
        },
      ],
    });

    // District-scoped officers only; HQ / RCS / admin see all filings
    if (shouldScopeAnnualFormsByDistrict(user)) {
      includeArray.push({
        model: User,
        as: 'createdByUser',
        attributes: ['id', 'first_name', 'last_name', 'email', 'district_id'],
        where: {
          district_id: user.district_id
        },
        required: true
      });
    } else {
      includeArray.push({
        model: User,
        as: 'createdByUser',
        attributes: ['id', 'first_name', 'last_name', 'email', 'district_id']
      });
    }

    const { count, rows } = await AnnualForm.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: includeArray
    });

    const totalPages = Math.ceil(count / limit);

    // Map status information and format user data
    const newRows = rows?.map((item: any) => {
      const plain = item.toJSON ? item.toJSON() : item;
      if (plain.statusDetails) {
        plain.status = plain.statusDetails.title;
      }

      // Debug logging for createdByUser
      logger.info(`Annual form ${plain.id}: createdByUser =`, plain.createdByUser);

      // Format created_by information
      if (plain.createdByUser) {
        plain.created_by = `${plain.createdByUser.first_name || ''} ${plain.createdByUser.last_name || ''}`.trim();
        plain.created_by_user_id = plain.createdByUser.id;
        plain.created_by_email = plain.createdByUser.email;
      } else {
        plain.created_by = 'Unknown User';
        plain.created_by_user_id = null;
        plain.created_by_email = null;
      }

      return plain;
    });

    await attachCurrentHolderRoles(newRows || []);

    return {
      annualForms: newRows,
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
    logger.error('Error in getAllAnnualForms:', error);
    throw new AppError(error.message || 'Failed to fetch annual forms', 500);
  }
};

export const getAnnualFormById = async (id: string, userId?: string) => {
  try {
    if (!userId) {
      throw new AppError('User Not Found', 500);
    }

    // Get user details including district from database
    const user = await findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Build the include array
    const includeArray: any[] = [
      {
        model: Status,
        as: 'statusDetails',
        attributes: ['id', 'title', 'key']
      },
      {
        model: User,
        as: 'updatedByUser',
        attributes: ['id', 'first_name', 'last_name', 'email']
      },
      {
        model: SocietyRegistration,
        as: 'society'
      },
      {
        model: Media,
        as: 'balanceSheetAnnualForms'
      },
      {
        model: Media,
        as: 'surplusPlanAnnualForms'
      },
      {
        model: Media,
        as: 'byelawAmendmentsAnnualForms'
      },
      {
        model: Media,
        as: 'generalBodyConstitutionAnnualForms'
      },
      {
        model: Media,
        as: 'byeLawsMedia',
        required: false,
        attributes: ['id', 'url']
      },
      {
        model: CostOfManagementType,
        as: 'costOfManagementTypeAnnualForms'
      },
      {
        model: MisappropriationLevel,
        as: 'misappropriationLevelAnnualForms'
      },
      {
        model: ArbitrationAuthority,
        as: 'arbitrationAuthorityAnnualForms'
      }
    ];

    if (shouldScopeAnnualFormsByDistrict(user)) {
      includeArray.push({
        model: User,
        as: 'createdByUser',
        attributes: ['id', 'first_name', 'last_name', 'email', 'district_id'],
        where: {
          district_id: user.district_id
        },
        required: true
      });
    } else {
      includeArray.push({
        model: User,
        as: 'createdByUser',
        attributes: ['id', 'first_name', 'last_name', 'email', 'district_id']
      });
    }

    includeArray.push({
      model: User,
      as: 'statusChangedByUser',
      attributes: ['id', 'first_name', 'last_name', 'email'],
      required: false,
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
          required: false,
        },
      ],
    });

    // Add workflow associations
    includeArray.push({
      model: ModuleWorkflow,
      as: 'workflowStatus',
      required: false
    });

    const annualForm = await AnnualForm.findByPk(id, {
      include: includeArray
    });

    if (!annualForm) {
      throw new AppError('Annual form not found', 404);
    }

    // Format created_by information for consistency
    const annualFormData = annualForm.toJSON() as any;
    if (annualFormData.createdByUser) {
      annualFormData.created_by = `${annualFormData.createdByUser.first_name || ''} ${annualFormData.createdByUser.last_name || ''}`.trim();
    } else {
      annualFormData.created_by = 'Unknown User';
    }

    // Attach workflowStatus (current/next/previous) for frontend
    try {
      if (annualForm.workflow_status) {
        const workflowStatus = await getWorkflowStatus(annualForm.id, 'ANNUAL_FILING', false);
        annualFormData.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
      } else {
        annualFormData.workflowStatus = {};
      }
    } catch (workflowErr: any) {
      logger.warn('Failed to get workflow status for annual form', { id, error: workflowErr?.message });
      annualFormData.workflowStatus = {};
    }

    try {
      annualFormData.previousCommentDocuments = await getLatestCommentDocuments(id, 'ANNUAL_FILING');
    } catch (docsErr: any) {
      logger.warn('Failed to get previous comment documents for annual form', { id, error: docsErr?.message });
      annualFormData.previousCommentDocuments = [];
    }

    try {
      annualFormData.history = await findHistoryByReference(id, 'ANNUAL_FILING');
    } catch (historyErr: any) {
      logger.warn('Failed to get history for annual form', { id, error: historyErr?.message });
      annualFormData.history = [];
    }

    await attachCompleteProcessingHistoryToDetail(annualFormData, id, 'ANNUAL_FILING');

    return annualFormData;
  } catch (error: any) {
    logger.error('Error in getAnnualFormById:', error);
    throw new AppError(error.message || 'Failed to fetch annual form', 500);
  }
};

export const createAnnualForm = async (annualFormData: any, req: IAuthRequest) => {
  try {
    const userId = req?.user?.userId as string;
    if (!userId) {
      throw new AppError('User Not Found', 500);
    }

    // Check if annual form already exists for this society and financial year
    const existingForm = await AnnualForm.findOne({
      where: {
        society_id: annualFormData.society_id,
        financial_year: annualFormData.financial_year
      }
    });

    if (existingForm) {
      throw new AppError('Annual form already exists for this society and financial year', 400);
    }

    const submittedStatus = await findStatusByKey('submitted') || await findStatusByKey('pending');
    if (submittedStatus) {
      annualFormData.status = submittedStatus.id;
    }

    // Set workflow_status to first workflow step (sequence 1) for ANNUAL_FILING
    let workflowStatusId: string | null = null;
    try {
      workflowStatusId = await getWorkflowIdByModuleAndSequence('ANNUAL_FILING', 1);
      if (!workflowStatusId) {
        logger.warn('ANNUAL_FILING sequence 1 workflow step NOT found. Ensure annual filing workflow seeder has been run.');
      }
    } catch (workflowErr: any) {
      logger.warn('Failed to resolve ANNUAL_FILING workflow step 1', { error: workflowErr?.message });
    }
    annualFormData.workflow_status = workflowStatusId;

    annualFormData.created_by = userId;
    annualFormData.updated_by = userId;

    // Coerce empty strings to null to prevent FK constraint violations
    for (const [key, val] of Object.entries(annualFormData)) {
      if (typeof val === 'string' && val.trim() === '') {
        annualFormData[key] = null;
      }
    }

    const newAnnualForm = await AnnualForm.create(annualFormData);

    // Fetch the society to get district_id
    const society = await SocietyRegistration.findByPk(annualFormData.society_id);
    if (!society) {
      throw new AppError('Society not found', 404);
    }

    if (!society.district_id) {
      throw new AppError('Society district not found', 400);
    }

    // Notify next workflow step's role users in the same district
    try {
      const districtId = society?.district_id || (req?.user?.district_id as string) || null;

      if (!districtId) {
        logger.warn('Annual form create notification skipped: no district_id', { annualFormId: newAnnualForm.id });
      } else {
        const annualFilingModule = await Module.findOne({ where: { key: 'ANNUAL_FILING', active: true } });
        const workflowStepWhere = annualFilingModule
          ? { module_id: annualFilingModule.id, active: true, is_hq: false }
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
          logger.warn('Annual form create notification skipped: next workflow role not found', {
            annualFormId: newAnnualForm.id,
            module: 'ANNUAL_FILING',
            sequence: 2,
            allowedRoleIds: nextRoleIds
          });
        } else {
          let templateTitle = NOTIFICATIONS.notifications.society.annual_filing.submitted.title as any;
          let templateDescription = `A new annual filing has been submitted for society "${society?.cooperative_society_name || 'N/A'}" for financial year ${annualFormData.financial_year}`;
          let templateId: string | undefined;

          try {
            const templateIdFromWorkflow = currentStep?.approval_notification_template_id || null;
            const template = templateIdFromWorkflow
              ? await NotificationTemplate.findByPk(templateIdFromWorkflow)
              : await NotificationTemplate.findOne({ where: { key: 'annual_filing_submit', active: true } });

            if (template && (template as any).active !== false) {
              templateTitle = template.title || templateTitle;
              templateDescription = template.description || templateDescription;
              templateId = template.id;
            }
          } catch (tplErr: any) {
            logger.warn('Failed to fetch annual_filing_submit template', { error: tplErr?.message });
          }

          const creatorUser = await findUserById(userId);
          const username = `${creatorUser?.first_name || ''} ${creatorUser?.last_name || ''}`.trim() || creatorUser?.email || '';
          const societyLabel = society?.cooperative_society_name || annualFormData.society_id;

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
                annual_form_id: newAnnualForm.id,
                module_name: 'ANNUAL_FILING',
                next_role: nextRoleName,
                next_role_id: nextRoleId,
                district_id: districtId
              }),
              redirect_path: NOTIFICATIONS.notifications.society.annual_filing.submitted.path.replace('{id}', newAnnualForm.id),
              created_by: userId,
              notification_template_id: templateId
            } as any,
            [nextRoleName]
          );

          if (notification) {
            logger.info('Annual form create notification sent to next workflow role', {
              annualFormId: newAnnualForm.id,
              districtId,
              nextRoleName
            });
          }
        }
      }
    } catch (error: any) {
      logger.error('Failed to send notification for new annual form', error);
    }
    // Log the operation
    await createHistory({
      resource: 'annual_forms',
      type: 'create',
      reference_id: newAnnualForm.id,
      created_by: userId,
      comments: `Annual form created for society ${annualFormData.society_id}`
    });

    logger.info(`Annual form created successfully with ID: ${newAnnualForm.id}`);
    
    // Log activity
    await createActivity({
      title: 'Annual Form Created',
      description: `New annual form submitted for society "${society?.cooperative_society_name || 'Unknown'}" for financial year ${annualFormData.financial_year}`,
      data: {
        annual_form_id: newAnnualForm.id,
        society_id: annualFormData.society_id,
        society_name: society?.cooperative_society_name,
        financial_year: annualFormData.financial_year,
        total_members: annualFormData.total_members,
        total_share_capital: annualFormData.total_share_capital,
        created_by: userId
      },
      reference_id: newAnnualForm.id,
      created_by: userId
    });
    
    return newAnnualForm;
  } catch (error: any) {
    logger.error('Error in createAnnualForm:', error);
    
    // If it's already an AppError, re-throw it as is
    if (error instanceof AppError) {
      throw error;
    }
    
    // For other errors, wrap in AppError
    throw new AppError(error.message || 'Failed to create annual form', 500);
  }
};

export const updateAnnualFormStatus = async (id: string, statusData: { status: string; remarks?: string }, req: IAuthRequest) => {
  try {
    const userId = req?.user?.userId as string;
    if (!userId) {
      throw new AppError('User Not Found', 500);
    }

    const annualForm = await AnnualForm.findByPk(id);
    if (!annualForm) {
      throw new AppError('Annual form not found', 404);
    }

    // Validate status
    const status = await findStatusById(statusData.status);
    if (!status) {
      throw new AppError('Invalid status', 400);
    }

    const oldValues = {
      status: annualForm.status,
      status_changed_by: annualForm.status_changed_by,
      status_changed_at: annualForm.status_changed_at
    };

    // Update status
    await annualForm.update({
      status: statusData.status,
      status_changed_by: userId,
      status_changed_at: new Date(),
      updated_by: userId
    });

    // Log the operation
    await createHistory({
      resource: 'annual_forms',
      type: 'status_change',
      reference_id: id,
      created_by: userId,
      comments: `Annual form status updated to ${statusData.status}`
    });

    logger.info(`Annual form status updated successfully for ID: ${id} to status: ${statusData.status}`);
    return annualForm;
  } catch (error: any) {
    logger.error('Error in updateAnnualFormStatus:', error);
    throw new AppError(error.message || 'Failed to update annual form status', 500);
  }
};

export const updateAnnualForm = async (id: string, updateData: any, req: IAuthRequest) => {
  try {
    const userId = req?.user?.userId as string;
    if (!userId) {
      throw new AppError('User Not Found', 500);
    }

    const annualForm = await AnnualForm.findByPk(id);
    if (!annualForm) {
      throw new AppError('Annual form not found', 404);
    }

    // Check if financial year is being changed and if it conflicts with existing records
    if (updateData.financial_year && updateData.financial_year !== annualForm.financial_year) {
      const existingForm = await AnnualForm.findOne({
        where: {
          society_id: annualForm.society_id,
          financial_year: updateData.financial_year,
          id: { [Op.ne]: id }
        }
      });

      if (existingForm) {
        throw new AppError('Annual form already exists for this society and financial year', 400);
      }
    }

    const oldValues = { ...annualForm.toJSON() };
    updateData.updated_by = userId;

    // Coerce empty strings to null to prevent FK constraint violations
    for (const [key, val] of Object.entries(updateData)) {
      if (typeof val === 'string' && (val as string).trim() === '') {
        updateData[key] = null;
      }
    }

    await annualForm.update(updateData);

    // Log the operation
    await createHistory({
      resource: 'annual_forms',
      type: 'update',
      reference_id: id,
      created_by: userId,
      comments: `Annual form updated`
    });

    logger.info(`Annual form updated successfully for ID: ${id}`);
    return annualForm;
  } catch (error: any) {
    logger.error('Error in updateAnnualForm:', error);
    throw new AppError(error.message || 'Failed to update annual form', 500);
  }
};

export const deleteAnnualForm = async (id: string, req: IAuthRequest) => {
  try {
    const userId = req?.user?.userId as string;
    if (!userId) {
      throw new AppError('User Not Found', 500);
    }

    const annualForm = await AnnualForm.findByPk(id);
    if (!annualForm) {
      throw new AppError('Annual form not found', 404);
    }

    // Log the operation before deletion
    await createHistory({
      resource: 'annual_forms',
      type: 'delete',
      reference_id: id,
      created_by: userId,
      comments: `Annual form deleted`
    });

    await annualForm.destroy();
    logger.info(`Annual form deleted successfully for ID: ${id}`);
    return { message: 'Annual form deleted successfully' };
  } catch (error: any) {
    logger.error('Error in deleteAnnualForm:', error);
    throw new AppError(error.message || 'Failed to delete annual form', 500);
  }
};

export const getAnnualFormsBySocietyId = async (societyId: string, userId?: string) => {
  try {
    if (!userId) {
      throw new AppError('User Not Found', 500);
    }

    // Get user details including district from database
    const user = await findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Build the include array
    const includeArray: any[] = [];

    if (shouldScopeAnnualFormsByDistrict(user)) {
      includeArray.push({
        model: User,
        as: 'createdByUser',
        attributes: ['id', 'first_name', 'last_name', 'email', 'district_id'],
        where: {
          district_id: user.district_id
        },
        required: true
      });
    } else {
      includeArray.push({
        model: User,
        as: 'createdByUser',
        attributes: ['id', 'first_name', 'last_name', 'email', 'district_id']
      });
    }

    const annualForms = await AnnualForm.findAll({
      where: { society_id: societyId },
      order: [['financial_year', 'DESC']],
      include: includeArray
    });

    return annualForms;
  } catch (error: any) {
    logger.error('Error in getAnnualFormsBySocietyId:', error);
    throw new AppError(error.message || 'Failed to fetch annual forms by society ID', 500);
  }
};

// Simple function to get the first available district ID (for manual database fixes)
export const getFirstAvailableDistrictId = async () => {
  try {
    const allDistricts = await getAllDistricts(1, 1);
    if (allDistricts.districts && allDistricts.districts.length > 0) {
      const firstDistrict = allDistricts.districts[0];
      if (firstDistrict) {
        logger.info('First available district:', { 
          id: firstDistrict.id, 
          name: firstDistrict.name 
        });
        return firstDistrict.id;
      }
    }
    throw new AppError('No districts available in the system', 500);
  } catch (error) {
    logger.error('Error getting first available district ID:', error);
    throw error;
  }
};
