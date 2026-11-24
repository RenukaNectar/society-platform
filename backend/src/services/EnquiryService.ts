import { IAuthRequest } from '../types';
import Enquiry from '../models/Enquiry';
import Status from '../models/Status';
import User from '../models/user';
import District from '../models/District';
import SocietyRegistration from '../models/SocietyRegistration';
import Media from '../models/Media';
import Notification from '../models/Notification';
import { NOTIFICATIONS } from '../config';
import { Op, WhereOptions } from 'sequelize';
import logger from '../utils/logger';
import { AppError } from '../utils/errors';
import { notifyInspectorsInDistrict, notifyRegistrarsInDistrict, sendNotification, getUsers } from './NotificationService';
import { getDistrictById } from './DistrictService';
import { attachCompleteProcessingHistoryToDetail } from './WorkflowCommentService';
import { createActivity } from './ActiviesService';
import NotificationTemplate from '../models/NotificationTemplate';
import {
  formatWorkflowStatusForApi,
  getWorkflowIdByModuleAndSequence,
  getWorkflowStatus,
  parseWorkflowRoleIds,
} from './WorkflowUtilService';
import { findStatusByKey } from './StatusService';
import ModuleWorkflow from '../models/ModuleWorkflow';
import Module from '../models/Module';
import Role from '../models/Role';

/** Only JICS/SICS HQ may initiate the RCS/HQ inspection-inquiry workflow. */
const RCS_INSPECTION_INITIATOR_ROLE = 'jics_sics_hq';

/** Only JICS/SICS District may initiate the district inspection workflow. */
const DISTRICT_INSPECTION_INITIATOR_ROLE = 'jics_sics_district';

/** Roles that participate in (view/act on) the RCS/HQ workflow after initiation. */
const RCS_INSPECTION_WORKFLOW_ROLES = [
  RCS_INSPECTION_INITIATOR_ROLE,
  'drcs_arcs_hq',
  'jt_rcs_district',
  'rcs_district',
];

/** District workflow only — must not see RCS/HQ-initiated enquiries in listing. */
const DISTRICT_INSPECTION_ONLY_ROLES = new Set(['jics_sics_district', 'drcs_arcs_district']);

/** HQ roles are not scoped by district/state when resolving workflow notification recipients. */
const HQ_WORKFLOW_ROLE_NAMES = new Set([
  'jics_sics_hq',
  'drcs_arcs_hq',
  'jt_rcs_hq',
  'rcs_hq',
  'jt_rcs_district',
  'rcs_district',
]);

const ENQUIRY_FULL_ACCESS_ROLES = new Set([
  'admin',
  'super_admin',
  ...RCS_INSPECTION_WORKFLOW_ROLES,
]);

const ENQUIRY_WORKFLOW_FIELDS = ['workflow_status', 'assigned_to_user_id', 'is_rcs_initiated'] as const;

const LEGACY_ENQUIRY_CREATE_FIELDS = [
  'society_id',
  'district_id',
  'applicant_name',
  'applicant_type',
  'contact_number',
  'email_id',
  'address',
  'society_registration_number',
  'society_name',
  'society_address',
  'subdivision',
  'subject',
  'description',
  'preferred_office_level',
  'date_of_incident',
  'documents',
  'previous_reference_number',
  'status',
  'status_changed_at',
  'status_changed_by',
  'created_by',
  'updated_by',
] as const;

export const resolveApplicantSocietyId = async (userId: string): Promise<string | null> => {
  const society = await SocietyRegistration.findOne({
    where: { created_by: userId },
    attributes: ['id'],
  });
  return society?.id ?? null;
};

export const canApplicantAccessEnquiry = (
  enquiry: { created_by?: string | null; society_id?: string | null },
  userId: string,
  applicantSocietyId?: string | null,
): boolean => {
  if (enquiry.created_by && String(enquiry.created_by) === String(userId)) {
    return true;
  }
  return Boolean(
    applicantSocietyId &&
      enquiry.society_id &&
      String(enquiry.society_id) === String(applicantSocietyId),
  );
};

const resolveInspectionWorkflowInit = (creatorRole?: string) => {
  const isRcsFlow = creatorRole === RCS_INSPECTION_INITIATOR_ROLE;
  const moduleKey = isRcsFlow ? 'INSPECTION_INQUIRY_RCS' : 'INSPECTION_INQUIRY';
  return { isRcsFlow, moduleKey };
};

const resolveInitialWorkflowStep = async (
  moduleKey: string,
  isRcsFlow: boolean
): Promise<{
  workflowStatusId: string | null;
  sequence: number;
}> => {
  const step1Id = await getWorkflowIdByModuleAndSequence(moduleKey, 1, isRcsFlow);
  if (!step1Id) {
    return { workflowStatusId: null, sequence: 1 };
  }

  return { workflowStatusId: step1Id, sequence: 1 };
};

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

const dataSubjectLabel = (subject?: string | null) => subject || 'Inspection/Inquiry';

const notifyWorkflowStepActors = async (
  moduleKey: string,
  sequence: number,
  isRcsFlow: boolean,
  enquiry: Enquiry,
  society: SocietyRegistration | null,
  userId: string,
  fallbackDescription: string
) => {
  const module = await Module.findOne({ where: { key: moduleKey, active: true } });
  if (!module) return;

  const notifyStep = await ModuleWorkflow.findOne({
    where: {
      module_id: module.id,
      sequence,
      active: true,
      is_hq: isRcsFlow,
    },
    attributes: ['allowed_role_id', 'assigned_to', 'approval_notification_template_id'],
  });
  if (!notifyStep) return;

  const notifyRoleColumn =
    notifyStep.get('assigned_to') ?? notifyStep.get('allowed_role_id');

  const roleIds = parseWorkflowRoleIds(notifyRoleColumn);
  const roles = roleIds.length
    ? await Role.findAll({
        where: { id: { [Op.in]: roleIds }, is_active: true },
        attributes: ['name'],
      })
    : [];
  const roleNames = roles.map((role) => role.name).filter(Boolean);
  if (!roleNames.length) return;

  const districtId = society?.district_id || enquiry.district_id || null;
  const stateId = society?.state_id || null;
  const geo = resolveWorkflowUserGeoFilter(roleNames, districtId, stateId);

  const userIds = await getUsers({
    ...geo,
    roleNames,
    isActive: true,
  });
  if (!userIds.length) {
    logger.warn('No workflow actors found for enquiry notification', {
      moduleKey,
      sequence,
      roleNames,
      districtId: geo.districtId,
      stateId: geo.stateId,
    });
    return;
  }

  let templateTitle = NOTIFICATIONS.notifications.enquiry.created.title as string;
  let templateDescription = fallbackDescription;
  let templateId: string | undefined;

  try {
    const templateIdFromWorkflow =
      notifyStep.get('approval_notification_template_id') || null;
    const template = templateIdFromWorkflow
      ? await NotificationTemplate.findByPk(templateIdFromWorkflow)
      : await NotificationTemplate.findOne({
          where: {
            key: isRcsFlow ? 'inspection_inquiry_submit' : 'inspection_submit',
            active: true,
          },
        });

    if (template && (template as { active?: boolean }).active !== false) {
      templateTitle = template.title || templateTitle;
      templateDescription = template.description || templateDescription;
      templateId = template.id;
    }
  } catch (tplErr: unknown) {
    logger.warn('Failed to fetch enquiry workflow notification template, using default text', {
      error: tplErr instanceof Error ? tplErr.message : String(tplErr),
    });
  }

  const creatorUser = await User.findByPk(userId);
  const username = creatorUser?.getFullName?.() || creatorUser?.email || '';
  const societyLabel =
    enquiry.society_name || enquiry.society_registration_number || dataSubjectLabel(enquiry.subject);

  const description = templateDescription
    .replace(/\{\{username\}\}/g, username)
    .replace(/\{\{SocietyName\}\}/g, societyLabel)
    .replace(/\{\{roleName\}\}/g, roleNames[0] || '')
    .replace(/\{\{[^}]+\}\}/g, '');

  await sendNotification(userIds, {
    title: templateTitle as any,
    description,
    data: JSON.stringify({
      enquiry_id: enquiry.id,
      module_name: moduleKey,
      next_roles: roleNames,
      district_id: districtId,
      state_id: stateId,
    }),
    redirect_path: NOTIFICATIONS.notifications.enquiry.created.path.replace('{id}', enquiry.id),
    created_by: userId,
    notification_template_id: templateId,
  } as any);

  logger.info('Enquiry create notification sent to workflow actors', {
    enquiryId: enquiry.id,
    moduleKey,
    sequence,
    roleNames,
    userCount: userIds.length,
    templateId,
  });
};

const emptyWorkflowStatusPayload = (message?: string) => ({
  current: null,
  next: null,
  previous: null,
  currentStatus: null,
  assignedToRole: null,
  assignedToUserIds: [],
  assignedToUserId: null,
  assignedUser: null,
  assigneeRoleIds: [],
  assigneeRoles: [],
  assigneeUserIds: [],
  assigneeUsers: [],
  unavailableAssignee: null,
  pendingReassign: false,
  previousComment: null,
  total_workflowLevel: 0,
  ...(message ? { workflowError: message } : {}),
});

const resolveEnquiryRcsFlow = async (plain: Record<string, unknown>): Promise<boolean> => {
  if (plain.is_rcs_initiated === true) return true;
  const stepId = plain.workflow_status as string | undefined;
  if (!stepId) return false;
  const step = await ModuleWorkflow.findByPk(stepId, {
    attributes: ['id'],
    include: [{ model: Module, as: 'module', attributes: ['key'] }],
  });
  const moduleKey = (step as { module?: { key?: string } } | null)?.module?.key;
  return moduleKey === 'INSPECTION_INQUIRY_RCS';
};

const attachWorkflowStatusToEnquiry = async (enquiry: any): Promise<any> => {
  const plain = enquiry?.toJSON ? enquiry.toJSON() : { ...enquiry };
  const isRcsInitiated = await resolveEnquiryRcsFlow(plain);
  plain.is_rcs_initiated = isRcsInitiated;
  const historyModuleKey = isRcsInitiated ? 'INSPECTION_INQUIRY_RCS' : 'INSPECTION_INQUIRY';

  try {
    const workflowStatus = await getWorkflowStatus(plain.id, 'INSPECTION_INQUIRY', isRcsInitiated);
    plain.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
  } catch (workflowError: any) {
    logger.warn('Error fetching workflow status for enquiry request', {
      enquiryId: plain.id,
      error: workflowError?.message,
    });
    plain.workflowStatus = emptyWorkflowStatusPayload(workflowError?.message);
  }

  plain.workflowModuleKey = historyModuleKey;
  return plain;
};

export interface IEnquiryCreateData {
  society_id?: string;
  district_id?: string;
  applicant_name?: string;
  applicant_type?: string;
  contact_number?: string;
  email_id?: string;
  address?: string;
  society_registration_number?: string;
  society_name?: string;
  society_address?: string;
  subdivision?: string;
  subject: string;
  description: string;
  preferred_office_level?: string;
  date_of_incident?: Date;
  documents?: string[];
  previous_reference_number?: string;
}

export interface IEnquiryFilters {
  page?: number;
  limit?: number;
  status?: string;
  applicant_type?: string;
  subject?: string;
  district_id?: string;
  society_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface IEnquiryResponse {
  enquiries: Enquiry[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}


export const createEnquiryRequest = async (data: IEnquiryCreateData, userId: string, req: any): Promise<Enquiry> => {
  const creatorRole = req?.user?.role as string | undefined;
  const { isRcsFlow, moduleKey } = resolveInspectionWorkflowInit(creatorRole);

  const officerInitiatedSubjects = ['Inquiry', 'Inspection'];
  if (officerInitiatedSubjects.includes(data.subject)) {
    if (isRcsFlow && creatorRole !== RCS_INSPECTION_INITIATOR_ROLE) {
      throw new AppError('Only JICS/SICS HQ officers can initiate Inquiry or Inspection requests', 403);
    }
    if (!isRcsFlow && creatorRole !== DISTRICT_INSPECTION_INITIATOR_ROLE) {
      throw new AppError('Only JICS/SICS District officers can initiate district Inquiry or Inspection requests', 403);
    }
  }

  const submittedStatus = await findStatusByKey('submitted');
  const defaultStatus = submittedStatus || await Status.findOne({
    where: { key: 'requested', is_active: true }
  });

  if (!defaultStatus) {
    throw new AppError('Default status not found for enquiry requests', 500);
  }

  const { workflowStatusId, sequence: initialWorkflowSequence } =
    await resolveInitialWorkflowStep(moduleKey, isRcsFlow);
  if (!workflowStatusId) {
    logger.warn('No workflow step found for enquiry request', {
      moduleKey,
      isRcsFlow,
      creatorRole,
      initialWorkflowSequence,
    });
  }

  const statusIdToUse = defaultStatus.id;

  let districtId = data.district_id;
  if (!districtId && data.society_id) {
    const society = await SocietyRegistration.findByPk(data.society_id, {
      attributes: ['district_id']
    });
    districtId = society?.get('district_id') as string | undefined;
  }
  if (!districtId && req?.user?.district_id) {
    districtId = req.user.district_id;
  }

  const parsedIncidentDate = data.date_of_incident ? new Date(data.date_of_incident) : null;
  const dateOfIncident =
    parsedIncidentDate && !Number.isNaN(parsedIncidentDate.getTime()) ? parsedIncidentDate : null;

  const enquiryPayload: Record<string, unknown> = {
    society_id: data.society_id || null,
    district_id: districtId || null,
    applicant_name: data.applicant_name?.trim() || null,
    applicant_type: data.applicant_type || null,
    contact_number: data.contact_number?.trim() || null,
    email_id: data.email_id?.trim() || null,
    address: data.address?.trim() || null,
    society_registration_number: data.society_registration_number || null,
    society_name: data.society_name || null,
    society_address: data.society_address || null,
    subdivision: data.subdivision || null,
    subject: data.subject,
    description: data.description,
    preferred_office_level: data.preferred_office_level || null,
    date_of_incident: dateOfIncident,
    documents: Array.isArray(data.documents) ? data.documents[0] : data.documents || null,
    previous_reference_number: data.previous_reference_number || null,
    status: statusIdToUse,
    status_changed_at: new Date(),
    status_changed_by: userId,
    created_by: userId,
    updated_by: userId,
    assigned_to_user_id: null,
    is_rcs_initiated: isRcsFlow,
  };

  if (workflowStatusId) {
    enquiryPayload.workflow_status = workflowStatusId;
  }

  let enquiry: Enquiry;
  try {
    enquiry = await Enquiry.create(enquiryPayload as any);
  } catch (createError: any) {
    const sqlMessage = createError?.parent?.sqlMessage || createError?.original?.sqlMessage;
    const isMissingWorkflowColumn =
      sqlMessage?.includes('Unknown column') &&
      ENQUIRY_WORKFLOW_FIELDS.some((field) => sqlMessage.includes(field));

    if (isMissingWorkflowColumn) {
      logger.warn(
        'Enquiry workflow columns missing in database; creating enquiry without workflow fields. Run migration 20260608150000-add-workflow-fields-to-enquiry-requests.js.'
      );
      const legacyPayload = { ...enquiryPayload };
      ENQUIRY_WORKFLOW_FIELDS.forEach((field) => {
        delete legacyPayload[field];
      });
      enquiry = await Enquiry.create(legacyPayload as any, {
        fields: [...LEGACY_ENQUIRY_CREATE_FIELDS],
      });
    } else {
      logger.error('Failed to create enquiry request', {
        message: createError?.message,
        sqlMessage,
      });
      throw createError;
    }
  }

  try {
    const societyForNotify = data.society_id
      ? await SocietyRegistration.findByPk(data.society_id, {
          attributes: ['id', 'district_id', 'state_id', 'cooperative_society_name'],
        })
      : null;
    const notificationDescription = `A new ${isRcsFlow ? 'RCS / HQ' : 'district'} inspection/inquiry request has been submitted for society: ${data.society_name || data.society_registration_number || 'N/A'}`;

    if (workflowStatusId) {
      await notifyWorkflowStepActors(
        moduleKey,
        initialWorkflowSequence,
        isRcsFlow,
        enquiry,
        societyForNotify,
        userId,
        notificationDescription
      );
    } else {
      const notificationDistrictId = districtId || req?.user?.district_id;
      if (notificationDistrictId) {
        const registrarsDistrict = await getDistrictById(notificationDistrictId as string);
        const notificationData = {
          title: NOTIFICATIONS.notifications.enquiry.created.title as any,
          description: notificationDescription,
          redirect_path: NOTIFICATIONS.notifications.enquiry.created.path.replace('{id}', enquiry.id),
          created_by: userId,
        };
        await notifyRegistrarsInDistrict(
          registrarsDistrict.id,
          notificationData as any,
          ['arcs', 'deputy_registrar', 'joint_registrar', 'registrar']
        );
        await notifyInspectorsInDistrict(
          registrarsDistrict.id,
          notificationData as any,
          ['field_inspector', 'senior_inspector']
        );
      }
    }
  } catch (error) {
    logger.error('Failed to send notification for new enquiry', error);
  }

  // Log activity
  await createActivity({
    title: 'Enquiry Request Created',
    description: `New enquiry request submitted by "${data.applicant_name?.trim() || 'N/A'}" regarding "${data.subject}"`,
    data: {
      enquiry_id: enquiry.id,
      applicant_name: data.applicant_name,
      applicant_type: data.applicant_type,
      society_registration_number: data.society_registration_number,
      society_name: data.society_name,
      subject: data.subject,
      description: data.description,
      district_id: data.district_id,
      created_by: userId
    },
    reference_id: enquiry.id,
    created_by: userId
  });

  const created = await getEnquiryRequestById(enquiry.id);
  return created ?? enquiry;
}

/**
 * Get enquiry request by ID with all associations
 */
export const getEnquiryRequestById = async (id: string): Promise<any | null> => {
  const enquiry = await Enquiry.findByPk(id, {
    include: [
      {
        model: Status,
        as: 'statusInfo'
      },
      {
        model: User,
        as: 'createdByUser'
      },
      {
        model: User,
        as: 'updatedByUser'
      },
      {
        model: User,
        as: 'assignedToUser',
        attributes: ['id', 'first_name', 'last_name', 'email']
      },
      {
        model: ModuleWorkflow,
        as: 'workflowStatus',
        attributes: ['id', 'sequence', 'allowed_role_id', 'approval_status_id', 'reject_status_id', 'assigned_to']
      },
      {
        model: District,
        as: 'districtInfo'
      },
      {
        model: SocietyRegistration,
        as: 'society'
      },
      {
        model: Media,
        as: 'documentFiles'
      },
      {
        model: Media,
        as: 'byeLawsMedia',
        attributes: ['id', 'url'],
        required: false
      }
    ]
  });

  if (!enquiry) return null;

  const payload = await attachWorkflowStatusToEnquiry(enquiry);
  const historyModuleKey =
    payload.workflowModuleKey ||
    (payload.is_rcs_initiated ? 'INSPECTION_INQUIRY_RCS' : 'INSPECTION_INQUIRY');

  await attachCompleteProcessingHistoryToDetail(payload, id, historyModuleKey, {
    historyResources: ['INSPECTION_INQUIRY', 'INSPECTION_INQUIRY_RCS', 'inquiry', 'enquiry']
  });
  return payload;
};

/**
 /**
  * Get all enquiry requests with filters and pagination
  */
export const getEnquiryRequests = async (filters: IEnquiryFilters,
  searchParam?: string,
  authenticatedUser?: {
    district_id?: string;
    role?: string;
    userId?: string;
    is_hq?: boolean;
    society_id?: string;
  }): Promise<IEnquiryResponse> => {
  const {
    page = 1,
    limit = 10,
    status,
    applicant_type,
    subject,
    district_id,
    society_id,
    start_date,
    end_date,
  } = filters;
  const search = searchParam as string;
  const offset = (Number(page) - 1) * Number(limit);
  const whereClause: any = {};

  // Apply filters
  if (status) whereClause.status = status;
  if (applicant_type) whereClause.applicant_type = applicant_type;
  if (subject) whereClause.subject = subject;
  if (district_id) whereClause.district_id = district_id;
  if (society_id) whereClause.society_id = society_id;

  // Date range filter
  if (start_date || end_date) {
    whereClause.created_at = {};
    if (start_date) whereClause.created_at[Op.gte] = new Date(start_date);
    if (end_date) whereClause.created_at[Op.lte] = new Date(end_date);
  }

  // Search filter
  if (search) {
    whereClause[Op.or] = [
      { applicant_name: { [Op.like]: `%${search}%` } },
      { society_name: { [Op.like]: `%${search}%` } },
      { society_registration_number: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }

  const userRole = authenticatedUser?.role;
  const skipDistrictScope =
    Boolean(authenticatedUser?.is_hq) ||
    ENQUIRY_FULL_ACCESS_ROLES.has(userRole ?? '');

  if (userRole === 'applicant' && authenticatedUser?.userId) {
    const accessScope: WhereOptions[] = [{ created_by: authenticatedUser.userId }];
    if (authenticatedUser.society_id) {
      accessScope.push({ society_id: authenticatedUser.society_id });
    }

    const applicantFilter: WhereOptions = { [Op.or]: accessScope };
    if (search && whereClause[Op.or]) {
      const searchOr = whereClause[Op.or];
      delete whereClause[Op.or];
      whereClause[Op.and] = [applicantFilter, { [Op.or]: searchOr }];
    } else {
      Object.assign(whereClause, applicantFilter);
    }
  } else if (DISTRICT_INSPECTION_ONLY_ROLES.has(userRole ?? '')) {
    whereClause.is_rcs_initiated = false;
  } else if (!skipDistrictScope) {
    const districtFilter = authenticatedUser?.district_id || district_id || null;
    if (districtFilter) {
      const districtScope = {
        [Op.or]: [
          { district_id: districtFilter },
          { '$society.district_id$': districtFilter },
        ],
      };
      if (whereClause[Op.and]) {
        (whereClause[Op.and] as WhereOptions[]).push(districtScope);
      } else {
        whereClause[Op.and] = [districtScope];
      }
    }
  }

  const requiresSocietyJoin =
    !skipDistrictScope &&
    userRole !== 'applicant' &&
    Boolean(authenticatedUser?.district_id || district_id);

  const { count, rows } = await Enquiry.findAndCountAll({
    where: whereClause,
    distinct: true,
    col: 'id',
    include: [
      {
        model: Status,
        as: 'statusInfo'
      },
      {
        model: User,
        as: 'createdByUser'
      },
      {
        model: User,
        as: 'updatedByUser'
      },
      {
        model: District,
        as: 'districtInfo'
      },
      {
        model: SocietyRegistration,
        as: 'society',
        required: requiresSocietyJoin,
      },
      {
        model: Media,
        as: 'documentFiles'
      }
    ],
    order: [['created_at', 'DESC']],
    limit: Number(limit),
    offset
  });

  const totalPages = Math.ceil(count / Number(limit));

  const enquiries = await Promise.all(
    rows.map(async (row) => attachWorkflowStatusToEnquiry(row))
  );

  return {
    enquiries,
    pagination: {
      current_page: Number(page),
      total_pages: totalPages,
      total_items: count,
      items_per_page: Number(limit)
    }
  };
}

/**
 * Update enquiry request status
 */
export const updateEnquiryStatus = async (
  enquiryId: string,
  statusId: string,
  userId: string,
  remarks?: string
): Promise<Enquiry> => {
  const enquiry = await Enquiry.findByPk(enquiryId);
  if (!enquiry) {
    throw new Error('Enquiry request not found');
  }

  const status = await Status.findByPk(statusId);
  if (!status) {
    throw new Error('Status not found');
  }

  await enquiry.update({
    status: statusId,
    status_changed_at: new Date(),
    status_changed_by: userId,
    updated_by: userId
  });

  if (enquiry.status) {
    await createActivity({
      title: 'Enquiry Request Status Updated',
      description: `Enquiry request status updated from ${enquiry.status} to ${status.key}.${remarks ? ` Remarks: ${remarks}` : ''}`,
      data: { enquiry, status: statusId },
      created_by: enquiry.created_by,
      reference_id: enquiry.id
    });
  }


  return enquiry;
}

/**
 * Delete enquiry request
 */
export const deleteEnquiryRequest = async (enquiryId: string, userId: string): Promise<boolean> => {
  const enquiry = await Enquiry.findByPk(enquiryId);
  if (!enquiry) {
    throw new Error('Enquiry request not found');
  }

  await enquiry.update({
    updated_by: userId
  });

  return true;
}

/**
 * Get enquiry requests by user
 */
export const getEnquiryRequestsByUser = async (userId: string, filters: IEnquiryFilters): Promise<IEnquiryResponse> => {
  const userFilters = {
    ...filters,
    created_by: userId
  };

  return await getEnquiryRequests(userFilters);
}


export const createEnquiryNotification = async (enquiryId: string, userId: string): Promise<void> => {
  try {
    const notificationData = {
      title: NOTIFICATIONS.notifications.enquiry.created.title,
      description: 'A new enquiry request has been created',
      redirect_path: NOTIFICATIONS.notifications.enquiry.created.path.replace('{id}', enquiryId),
      created_by: userId,
      updated_by: userId
    };

    await Notification.create(notificationData);
  } catch (error) {
    console.error('Failed to create enquiry notification:', error);
  }
}

/**
 * Create notification for status change
 */
export const createStatusChangeNotification = async (
  enquiryId: string,
  statusName: string,
  userId: string
): Promise<void> => {
  try {
    const notificationData = {
      title: `Enquiry Request Status Updated`,
      description: `Enquiry request status has been updated to ${statusName}`,
      redirect_path: `/inquiries/${enquiryId}`,
      created_by: userId,
      updated_by: userId
    };

    await Notification.create(notificationData);
  } catch (error) {
    console.error('Failed to create status change notification:', error);
  }
}

/**
 * Validate enquiry request data
 */
const OFFICER_INITIATED_ROLES = new Set([
  DISTRICT_INSPECTION_INITIATOR_ROLE,
  RCS_INSPECTION_INITIATOR_ROLE,
]);

export const validateEnquiryData = async (
  data: IEnquiryCreateData,
  creatorRole?: string,
): Promise<{ isValid: boolean; errors: string[] }> => {
  const errors: string[] = [];
  const officerInitiated = OFFICER_INITIATED_ROLES.has(creatorRole || '');

  if (!officerInitiated && (!data.applicant_name || data.applicant_name.trim().length < 2)) {
    errors.push('Applicant name must be at least 2 characters long');
  } else if (data.applicant_name?.trim() && data.applicant_name.trim().length < 2) {
    errors.push('Applicant name must be at least 2 characters long');
  }

  if (!officerInitiated && !data.applicant_type) {
    errors.push('Applicant type is required');
  }

  if (!officerInitiated && !data.contact_number) {
    errors.push('Contact number is required');
  } else if (data.contact_number?.trim() && !/^\d{10}$/.test(data.contact_number.trim())) {
    errors.push('Contact number must be a valid 10-digit number');
  }

  if (!officerInitiated && (!data.email_id || !(await isValidEmail(data.email_id)))) {
    errors.push('Valid email ID is required');
  } else if (data.email_id?.trim() && !(await isValidEmail(data.email_id))) {
    errors.push('Valid email ID is required');
  }

  if (!officerInitiated && (!data.address || data.address.trim().length < 3)) {
    errors.push('Address must be at least 3 characters long');
  } else if (data.address?.trim() && data.address.trim().length < 3) {
    errors.push('Address must be at least 3 characters long');
  }

  if (!data.subject) {
    errors.push('Subject is required');
  } else {
    const allowedSubjects = [
      'Inquiry',
      'Inspection',
      'Complaint',
      'Irregularity',
      'Routine Check',
      'Other',
    ];
    if (!allowedSubjects.includes(data.subject)) {
      errors.push('Invalid subject type');
    }
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format
 */
export const isValidEmail = async (email: string): Promise<boolean> => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

