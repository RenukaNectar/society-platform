import { Op, WhereOptions } from 'sequelize';
import AuditRequest from '../models/AuditRequest';
import SocietyRegistration from '../models/SocietyRegistration';
import User from '../models/user';
import Status from '../models/Status';
import logger from '../utils/logger';
import Media from '../models/Media';
import Auditor from '../models/Auditor';
import { getUsers, notifyInspectorsInDistrict, sendNotification } from './NotificationService';
import District from '../models/District';
import Role from '../models/Role';
import Module from '../models/Module';
import ModuleWorkflow from '../models/ModuleWorkflow';
import { createActivity } from './ActiviesService';
import { getWorkflowIdByModuleAndSequence } from './WorkflowUtilService';
import NotificationTemplate from '../models/NotificationTemplate';
import { NOTIFICATIONS } from '../config/notifications';

interface CreateAuditRequestData {
  society_registration_id: string;
  financial_year: string;
  auditor_name: string;
  auditor_registration_number?: string | null;
  audit_completion_date: Date;
  audit_classification: 'A' | 'B' | 'C' | 'D';
  agm_date?: Date;
  bod_meeting_date?: Date;
  agm_total_members_on_roll?: number;
  agm_members_attended?: number;
  bod_total_members_on_roll?: number;
  bod_members_attended?: number;
  turnover?: number;
  profit_loss?: number;
  profit_loss_type?: string;
  gross_profit?: number;
  working_capital?: number;
  accumulated_profit?: number;
  accumulated_loss?: number;
  audit_fee_paid?: number;
  audit_accounts_media_id?: string;
  audit_note_media_id?: string;
  vital_stats_form_media_id?: string;
  shareholder_list_media_id?: string;
  agm_bod_minutes_media_id?: string;
  auditor_appointment_letter_media_id?: string;
  registration_certificate_media_id?: string;
  abstract_closing_stock_media_id?: string;
  asset_list_depreciation_media_id?: string;
  declaration_accepted?: boolean;
  additional_notes?: string;
  created_by?: string;
}

interface AuditRequestFilters {
  society_registration_id?: string;
  status_id?: string;
  financial_year?: string;
  assigned_officer_id?: string;
  created_by?: string;
  page?: number;
  limit?: number;
  district_id?: string;
  from?: string;
  to?: string;
}

/**
 * Create a new audit request
 */
export const createAuditRequest = async (data: CreateAuditRequestData): Promise<{ success: boolean; message: string; data?: AuditRequest }> => {
  const startTime = Date.now();
  try {
    // Set workflow_status to first workflow step for AUDIT_REQUEST (sequence 1)
    const workflowStatusId = await getWorkflowIdByModuleAndSequence('AUDIT_REQUEST', 1);

    // Get the draft status ID from the statuses table
    const draftStatus = await Status.findOne({
      where: { key: 'pending' }
    });

    if (!draftStatus) {
      return {
        success: false,
        message: 'Draft status not found in statuses table'
      };
    }

    // Validate that the society registration exists
    const society = await SocietyRegistration.findByPk(data.society_registration_id);
    if (!society) {
      return {
        success: false,
        message: `Society registration with ID ${data.society_registration_id} not found`
      };
    }

    // Check if the same user has already created an audit request for the same financial year
    if (data.created_by) {
      const existingAuditRequest = await AuditRequest.findOne({
        where: {
          created_by: data.created_by,
          financial_year: data.financial_year
        }
      });

      if (existingAuditRequest) {
        throw new Error(`You have already created an audit request for financial year ${data.financial_year}.`);
      } else {
        logger.info('No duplicate found, proceeding with creation');
      }
    } else {
      logger.warn('No created_by provided, skipping duplicate check');
    }

    // Ensure numeric fields are properly converted
    // Convert undefined/empty string to empty string for auditor_registration_number
    // TODO: After running migration 20260128173317-make-auditor-registration-number-optional.js,
    // this can be changed to null instead of empty string
    const processedData = {
      ...data,
      // Denormalize district_id for workflow status + assignment resolution
      district_id: (society as any).district_id ?? null,
      auditor_registration_number: data.auditor_registration_number && data.auditor_registration_number.trim()
        ? data.auditor_registration_number.trim()
        : '',
      agm_total_members_on_roll: data.agm_total_members_on_roll ? Number(data.agm_total_members_on_roll) : undefined,
      agm_members_attended: data.agm_members_attended ? Number(data.agm_members_attended) : undefined,
      bod_total_members_on_roll: data.bod_total_members_on_roll ? Number(data.bod_total_members_on_roll) : undefined,
      bod_members_attended: data.bod_members_attended ? Number(data.bod_members_attended) : undefined,
      turnover: data.turnover ? Number(data.turnover) : undefined,
      profit_loss: data.profit_loss ? Number(data.profit_loss) : undefined,
      working_capital: data.working_capital ? Number(data.working_capital) : undefined,
      accumulated_profit: data.accumulated_profit ? Number(data.accumulated_profit) : undefined,
      accumulated_loss: data.accumulated_loss ? Number(data.accumulated_loss) : undefined,
      audit_fee_paid: data.audit_fee_paid ? Number(data.audit_fee_paid) : undefined,
      status_id: draftStatus.id,
      workflow_status: workflowStatusId,
      assigned_to_user_id: null,
      audit_order_issued: false,
      declaration_accepted: data.declaration_accepted || false
    };

    logger.debug('Processed audit request data', { processedData });

    const auditRequest = await AuditRequest.create(processedData);

    // ----------------- Notifications (same pattern as society create) -----------------
    const inspectorNotificationData = {
      title: NOTIFICATIONS.notifications.audit.requested.title as any,
      description: `New audit request created: ${society.cooperative_society_name || society.local_langauge_society_name}`,
      data: JSON.stringify({ auditRequest, society }),
      redirect_path: (NOTIFICATIONS.notifications as any)?.audit.requested?.path?.replace?.('{id}', auditRequest.id) || `/audit-requests/${auditRequest.id}`,
      created_by: data.created_by
    }

    // if (society?.district_id) {
    //   await notifyInspectorsInDistrict(society.district_id, inspectorNotificationData, ['dept_jics_sics']);
    //   logger.info('dept_jics_sics notifications sent successfully', inspectorNotificationData);
    // }

     if (society?.district_id) {
      await notifyInspectorsInDistrict(society.district_id, inspectorNotificationData, ['drcs_arcs_district']);
      logger.info('drcs_arcs_district notifications sent successfully', inspectorNotificationData);
    }


    const duration = Date.now() - startTime;

    // Log activity
    // Fetch society for activity log (since 'society' is not in scope here)
    const societyForActivity = await SocietyRegistration.findByPk(data.society_registration_id);

    await createActivity({
      title: 'Audit Request Created',
      description: `New audit request submitted for society "${societyForActivity?.cooperative_society_name || 'Unknown'}" for financial year ${data.financial_year}`,
      data: {
        audit_request_id: auditRequest.id,
        society_id: data.society_registration_id,
        society_name: societyForActivity?.cooperative_society_name,
        financial_year: data.financial_year,
        auditor_name: data.auditor_name,
        auditor_registration_number: data.auditor_registration_number,
        audit_classification: data.audit_classification,
        created_by: data.created_by
      },
      reference_id: auditRequest.id,
      created_by: data.created_by || 'system'
    });

    return {
      success: true,
      message: 'Audit request created successfully',
      data: auditRequest
    };
  } catch (error) {
    // Handle specific database constraint errors
    let errorMessage = 'Failed to create audit request';
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('foreign key constraint') || errorMsg.includes('society_registrations')) {
        errorMessage = `Invalid society registration ID: ${data.society_registration_id}. The society registration does not exist.`;
      } else {
        errorMessage = `Failed to create audit request: ${error.message}`;
      }
    } else {
      errorMessage = `Failed to create audit request: ${String(error)}`;
    }

    return {
      success: false,
      message: errorMessage
    };
  }
};

/**
 * Get audit request by ID with associations
 */
export const getAuditRequestById = async (id: string): Promise<AuditRequest | null> => {
  const startTime = Date.now();
  try {
    logger.debug('Fetching audit request by ID', { audit_request_id: id });

    const auditRequest = await AuditRequest.findByPk(id, {
      include: [
        {
          model: SocietyRegistration,
          as: 'societyRegistration',
          attributes: ['id', 'cooperative_society_name', 'registration_number', 'district_id']
        },
        {
          model: User,
          as: 'assignedOfficer',
          attributes: ['id', 'first_name', 'last_name', 'email']
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
          model: Status,
          as: 'status',
          attributes: ['id', 'title', 'key']
        },
        {
          model: Media,
          as: 'auditAccountsMedia',
        },
        {
          model: Media,
          as: 'auditNoteMedia',
        },
        {
          model: Media,
          as: 'vitalStatsFormMedia',
        },
        {
          model: Media,
          as: 'shareholderListMedia',
        },
        {
          model: Media,
          as: 'agmBodMinutesMedia',
        },
        {
          model: Media,
          as: 'auditorAppointmentLetterMedia',
        },
        {
          model: Media,
          as: 'registrationCertificateMedia',
        },
        {
          model: Media,
          as: 'byeLawsMedia',
          required: false,
          attributes: ['id', 'url'],
        },
        {
          model: Media,
          as: 'abstractClosingStockMedia',
        },
        {
          model: Media,
          as: 'assetListDepreciationMedia',
        }
      ]
    });

    const duration = Date.now() - startTime;
    if (auditRequest) {
      logger.info('Audit request fetched successfully', {
        audit_request_id: id,
        duration: `${duration}ms`
      });
    } else {
      logger.warn('Audit request not found', {
        audit_request_id: id,
        duration: `${duration}ms`
      });
    }

    return auditRequest;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error fetching audit request by ID', {
      audit_request_id: id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    });
    throw new Error(`Failed to get audit request: ${error}`);
  }
};

/**
 * Get all audit requests with filters and pagination
 */
export const getAuditRequests = async (
  filters: AuditRequestFilters = {},
  authenticatedUser?: { district_id?: string; role?: string; userId?: string },
  search?: string
): Promise<{
  auditRequests: AuditRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    const {
      society_registration_id,
      status_id,
      financial_year,
      created_by,
      district_id,
      page = 1,
      limit = 10,
      from,
      to
    } = filters;
    let whereConditions: WhereOptions = {};

    // Apply basic filters
    if (society_registration_id) {
      whereConditions.society_registration_id = society_registration_id;
    }

    if (status_id) {
      whereConditions.status_id = status_id;
    }

    if (financial_year) {
      whereConditions.financial_year = financial_year;
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

    // Role-based district scoping:
    // - Certain HQ/RC roles can see cross-district (no district filter)
    // - Applicant can see only their own records
    // - All other roles are district-wise
    const whereDistrictConditions: WhereOptions = {};

    const nonDistrictRoles = new Set([
      'admin',
      'rcs_district',
      'jt_rcs_district',
      'drcs_arcs_hq',
      'jics_sics_hq'
    ]);

    const role = authenticatedUser?.role as string | undefined;
    const shouldApplyDistrictScope = !nonDistrictRoles.has(role ?? '');

    if (authenticatedUser?.role === 'applicant' && authenticatedUser.userId) {
      whereConditions.created_by = authenticatedUser.userId;
    } else if (shouldApplyDistrictScope && authenticatedUser?.district_id) {
      whereDistrictConditions['$societyRegistration.district_id$'] = authenticatedUser.district_id;
    } else if (shouldApplyDistrictScope && district_id) {
      whereDistrictConditions['$societyRegistration.district_id$'] = district_id;
    }
    const offset = (page - 1) * limit;

    if (search) {
      // Use OR condition for search across multiple fields
      whereConditions = {
        ...whereConditions,
        [Op.or]: [
          { auditor_name: { [Op.like]: `%${search}%` } },
          { auditor_registration_number: { [Op.like]: `%${search}%` } },
          { financial_year: { [Op.like]: `%${search}%` } },
          { '$societyRegistration.cooperative_society_name$': { [Op.like]: `%${search}%` } }
        ]
      };
    }

    // Execute the main query
    const result = await AuditRequest.findAndCountAll({
      where: { ...whereConditions, ...whereDistrictConditions },
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
          attributes: ['id', 'first_name', 'last_name', 'email', 'district_id'],
          include: [
            {
              model: District,
              as: 'district',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: Media,
          as: 'auditAccountsMedia',
          attributes: ['id', 'url', 'active']
        },
        {
          model: Media,
          as: 'auditNoteMedia',
          attributes: ['id', 'url', 'active']
        },
        {
          model: Media,
          as: 'vitalStatsFormMedia',
          attributes: ['id', 'url', 'active']
        },
        {
          model: Media,
          as: 'shareholderListMedia',
          attributes: ['id', 'url', 'active']
        },
        {
          model: Media,
          as: 'agmBodMinutesMedia',
          attributes: ['id', 'url', 'active']
        },
        {
          model: Media,
          as: 'auditorAppointmentLetterMedia',
          attributes: ['id', 'url', 'active']
        },
        {
          model: Media,
          as: 'registrationCertificateMedia',
          attributes: ['id', 'url', 'active']
        },
        {
          model: Media,
          as: 'abstractClosingStockMedia',
          attributes: ['id', 'url', 'active']
        },
        {
          model: Media,
          as: 'assetListDepreciationMedia',
          attributes: ['id', 'url', 'active']
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    const { count, rows } = result;
    return {
      auditRequests: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  } catch (error) {
    logger.error('Error in getAuditRequests', { error });
    throw new Error(`Failed to get audit requests: ${error}`);
  }
};

/**
 * Get audit requests by society registration ID
 */
export const getAuditRequestsBySociety = async (
  societyRegistrationId: string,
  authenticatedUser?: { district_id?: string; role?: string; userId?: string }
): Promise<AuditRequest[]> => {
  const startTime = Date.now();
  try {
    logger.info('Fetching audit requests by society', {
      society_registration_id: societyRegistrationId,
      userRole: authenticatedUser?.role,
      userDistrictId: authenticatedUser?.district_id
    });

    // Extract user's district from authenticated user
    const userDistrictId = authenticatedUser?.district_id;

    // Build where conditions with district filtering
    const whereConditions: WhereOptions = { society_registration_id: societyRegistrationId };

    // Apply role-based filtering
    logger.info('Applying role-based filtering for society audit requests', {
      userRole: authenticatedUser?.role,
      userDistrict: userDistrictId
    });

    if (authenticatedUser?.role === 'admin' || authenticatedUser?.role === 'super_admin') {
      // Admin users can see all audit requests (no district filter)
      logger.info('Admin user - allowing access to all audit requests for society');
    } else if (authenticatedUser?.role === 'applicant') {
      // Applicants can only see their own audit requests
      logger.info('User is applicant - filtering by created_by');
      if (authenticatedUser.userId) {
        whereConditions.created_by = authenticatedUser.userId;
        logger.info('Applied applicant filter', { created_by: authenticatedUser.userId });
      } else {
        logger.warn('Applicant user ID not provided, returning empty result');
        return [];
      }
    } else {
      // For other roles (registrars, etc.), apply district-based filtering
      if (userDistrictId) {
        whereConditions['$societyRegistration.district_id$'] = userDistrictId;
        logger.info('Applied user district filter', { district_id: userDistrictId });
      } else {
        // If no user district provided, return empty result for security
        logger.warn('No user district provided, returning empty result for security');
        return [];
      }
    }

    const auditRequests = await AuditRequest.findAll({
      where: whereConditions,
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
          model: User,
          as: 'assignedOfficer',
          attributes: ['id', 'first_name', 'last_name', 'email']
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
          model: Status,
          as: 'status',
          attributes: ['id', 'title', 'key']
        },
        {
          model: Media,
          as: 'auditAccountsMedia'
        },
        {
          model: Media,
          as: 'auditNoteMedia'
        },
        {
          model: Media,
          as: 'vitalStatsFormMedia'
        },
        {
          model: Media,
          as: 'shareholderListMedia'
        },
        {
          model: Media,
          as: 'agmBodMinutesMedia'
        },
        {
          model: Media,
          as: 'auditorAppointmentLetterMedia'
        },
        {
          model: Media,
          as: 'registrationCertificateMedia'
        },
        {
          model: Media,
          as: 'abstractClosingStockMedia'
        },
        {
          model: Media,
          as: 'assetListDepreciationMedia'
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const duration = Date.now() - startTime;
    logger.info('Audit requests by society fetched successfully', {
      society_registration_id: societyRegistrationId,
      count: auditRequests.length,
      userDistrictId,
      duration: `${duration}ms`
    });

    return auditRequests;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error fetching audit requests by society', {
      society_registration_id: societyRegistrationId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    });
    throw new Error(`Failed to get audit requests by society: ${error}`);
  }
};

/**
 * Get audit requests by assigned officer with district validation
 * This ensures that officers can only see audit requests from societies in their assigned district
 */
export const getAuditRequestsByAssignedOfficer = async (
  officerId: string,
  filters: AuditRequestFilters = {},
  authenticatedUser?: { district_id?: string; role?: string; userId?: string }
): Promise<{
  auditRequests: AuditRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const startTime = Date.now();
  try {
    logger.info('Fetching audit requests by assigned officer', {
      officer_id: officerId,
      filters,
      userRole: authenticatedUser?.role,
      userDistrictId: authenticatedUser?.district_id
    });

    const {
      society_registration_id,
      status_id,
      financial_year,
      created_by,
      district_id,
      page = 1,
      limit = 10
    } = filters;

    // Extract user's district from authenticated user
    const userDistrictId = authenticatedUser?.district_id;

    // Build where conditions
    const whereConditions: WhereOptions = { assigned_officer_id: officerId };

    // Apply district filtering for security
    if (authenticatedUser?.role === 'admin' || authenticatedUser?.role === 'super_admin') {
      // Admin users can see all audit requests (no district filter)
      logger.info('Admin user - allowing access to all audit requests');
    } else if (authenticatedUser?.role === 'applicant') {
      // Applicants can only see their own audit requests
      if (authenticatedUser.userId) {
        whereConditions.created_by = authenticatedUser.userId;
        logger.info('Applied applicant filter', { created_by: authenticatedUser.userId });
      } else {
        logger.warn('Applicant user ID not provided, returning empty result');
        return {
          auditRequests: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        };
      }
    } else {
      // For registrar/inspector roles, ensure district consistency
      if (userDistrictId) {
        whereConditions['$societyRegistration.district_id$'] = userDistrictId;
        logger.info('Applied user district filter for officer', { district_id: userDistrictId });
      } else {
        // If no district assigned, return empty result for security
        logger.warn('No district filter provided for officer, returning empty result for security');
        return {
          auditRequests: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        };
      }
    }

    // Apply additional filters
    if (society_registration_id) {
      whereConditions.society_registration_id = society_registration_id;
    }

    if (status_id) {
      whereConditions.status_id = status_id;
    }

    if (financial_year) {
      whereConditions.financial_year = financial_year;
    }

    if (created_by) {
      whereConditions.created_by = created_by;
    }

    const offset = (page - 1) * limit;

    logger.info('Final where conditions for officer query', {
      whereConditions,
      offset,
      limit,
      userDistrictId,
      userRole: authenticatedUser?.role
    });

    // Execute the query
    const result = await AuditRequest.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: SocietyRegistration,
          as: 'societyRegistration',
          required: true,
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
          attributes: ['id', 'first_name', 'last_name', 'email', 'district_id'],
          include: [
            {
              model: District,
              as: 'district',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    const duration = Date.now() - startTime;
    logger.info('Audit requests by assigned officer fetched successfully', {
      officer_id: officerId,
      total_count: result.count,
      returned_count: result.rows.length,
      page,
      limit,
      userDistrictId,
      duration: `${duration}ms`
    });

    return {
      auditRequests: result.rows,
      total: result.count,
      page,
      limit,
      totalPages: Math.ceil(result.count / limit)
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error fetching audit requests by assigned officer', {
      officer_id: officerId,
      filters,
      error: error instanceof Error ? error.message : String(error),
      duration: `${duration}ms`
    });
    throw new Error(`Failed to get audit requests by assigned officer: ${error}`);
  }
};

export const getAuditorsService = async (): Promise<any[]> => {
  try {
    const auditors = await Auditor.findAll();
    if (auditors) {
      return auditors;
    } else {
      return [];
    }
  } catch (error) {
    logger.error('Error fetching auditors', { error });
    throw new Error(`Failed to get auditors: ${error}`);
  }
}
// Audit module: notifications disabled (per requirement)

/**
 * Update audit request status with notifications
 */
export const updateAuditRequestStatus = async (
  id: string,
  statusId: string,
  updatedBy: string,
  remarks?: string
): Promise<{ success: boolean; message: string; data?: AuditRequest }> => {
  const startTime = Date.now();
  try {
    logger.info('Updating audit request status', {
      audit_request_id: id,
      status_id: statusId,
      updated_by: updatedBy
    });

    const auditRequest = await AuditRequest.findByPk(id, {
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

    if (!auditRequest) {
      logger.error('Audit request not found', { audit_request_id: id });
      return {
        success: false,
        message: 'Audit request not found'
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

    const oldStatus = auditRequest.status?.key || 'unknown';

    // Update the audit request
    await auditRequest.update({
      status_id: statusId,
      updated_by: updatedBy,
      additional_notes: remarks ? `${auditRequest.additional_notes || ''}\n\nStatus Update (${new Date().toISOString()}): ${remarks}`.trim() : auditRequest.additional_notes
    });

    // Notifications disabled for audit module (per requirement)
    await createActivity({
      title: 'Audit Request Status Updated',
      description: `Audit request status updated from ${oldStatus} to ${newStatus.key}.${remarks ? ` Remarks: ${remarks}` : ''}`,
      data: { auditRequest, society: auditRequest.societyRegistration },
      created_by: updatedBy,
      reference_id: auditRequest.id
    });

    return {
      success: true,
      message: 'Audit request status updated successfully',
      data: auditRequest
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in updateAuditRequestStatus service', {
      audit_request_id: id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    });
    return {
      success: false,
      message: `Failed to update audit request status: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};


// Approve audit request status with comments is optional
export const approveAuditRequestStatus = async (id: string, status_id: any, comments?: string) => {
  try {
    const auditRequest = await AuditRequest.findByPk(id);
    if (!auditRequest) {
      logger.error('Audit request not found', { audit_request_id: id });
      throw new Error('Audit request not found');
    }
    const newStatus = await Status.findOne({ where: { id: status_id } });
    if (!newStatus) {
      logger.error('Status not found', { status_id: status_id });
      throw new Error('Status not found');
    }
    // Handle SICS/SACS approved status
    if (newStatus.key === 'sics_sacs_approved') {
      await auditRequest.update({ status_id: newStatus.id });
    }
    // Handle SICS/SACS rejected status
    else if (newStatus.key === 'sics_sacs_rejected') {
      await auditRequest.update({ status_id: newStatus.id, remarks: comments || '', rejection_date: new Date() });
    }
    // Handle JICS/JACS approved status
    else if (newStatus.key === 'jics_jacs_approved') {
      await auditRequest.update({ status_id: newStatus.id });
    }
    // Handle JICS/JACS rejected status
    else if (newStatus.key === 'jics_jacs_rejected') {
      await auditRequest.update({ status_id: newStatus.id, remarks: comments || '', rejection_date: new Date() });
    }
    // Handle Registrar approved
    else if (newStatus.key === 'registrar_approved') {
      await auditRequest.update({ status_id: newStatus.id });
    }
    // Handle regisrar rejected
    else if (newStatus.key === 'registrar_rejected') {
      await auditRequest.update({ status_id: newStatus.id });
    }

    return auditRequest;
  } catch (error) {
    logger.error('Error approving audit request status', { error });
    throw new Error(`Failed to approve audit request status: ${error}`);
  }
}

const AUDIT_REJECTED_STATUS_KEYS = [
  'rejected',
  'registrar_rejected',
  'jics_jacs_rejected',
  'sics_sacs_rejected',
  'audit_rejected',
] as const;

// edit / resubmit audit request
export const editAuditRequestService = async (id: string, body: any) => {
  try {
    const auditRequest = await AuditRequest.findByPk(id, {
      include: [{ model: Status, as: 'status', attributes: ['id', 'key', 'title'] }],
    });
    if (!auditRequest) {
      logger.error('Audit request not found', { audit_request_id: id });
      throw new Error('Audit request not found');
    }

    // Prefer workflow key `resubmitted`; fall back to legacy `resubmit` if present in DB
    const resubmitStatus =
      (await Status.findOne({ where: { key: 'resubmitted' } })) ||
      (await Status.findOne({ where: { key: 'resubmit' } }));
    if (!resubmitStatus) {
      logger.error('Resubmit status not found');
      throw new Error('Resubmit status not found');
    }

    const currentStatusKey = (auditRequest as any).status?.key as string | undefined;
    const isResubmitFromRejection =
      !!currentStatusKey &&
      (AUDIT_REJECTED_STATUS_KEYS as readonly string[]).includes(currentStatusKey);
    const returnedToApplicant = !auditRequest.workflow_status;
    if (!isResubmitFromRejection || !returnedToApplicant) {
      throw new Error('Audit request can only be resubmitted after it is returned to the applicant');
    }
    if (
      body.updated_by &&
      auditRequest.created_by &&
      String(body.updated_by) !== String(auditRequest.created_by)
    ) {
      throw new Error('Only the applicant can resubmit this audit request');
    }

    // Restart workflow at sequence 1 so officers can act again after rejection
    const workflowStatusId = await getWorkflowIdByModuleAndSequence('AUDIT_REQUEST', 1);

    // Process the update data - convert undefined/empty auditor_registration_number to empty string
    // TODO: After running migration 20260128173317-make-auditor-registration-number-optional.js,
    // this can be changed to null instead of empty string
    const updateData: any = { ...body };
    if ('auditor_registration_number' in updateData) {
      updateData.auditor_registration_number = updateData.auditor_registration_number && updateData.auditor_registration_number.trim()
        ? updateData.auditor_registration_number.trim()
        : '';
    }

    await auditRequest.update({
      ...updateData,
      status_id: resubmitStatus.id,
      workflow_status: workflowStatusId || null,
      assigned_to_user_id: null,
      remarks: isResubmitFromRejection ? null : auditRequest.remarks,
      rejection_date: isResubmitFromRejection ? null : auditRequest.rejection_date,
      updated_by: body.updated_by,
    });

    if (isResubmitFromRejection) {
      await createActivity({
        title: 'Audit Request Resubmitted',
        description: `Audit request resubmitted after rejection (${currentStatusKey}).`,
        data: { auditRequestId: auditRequest.id, previousStatus: currentStatusKey },
        created_by: body.updated_by,
        reference_id: auditRequest.id,
      });
    }

    return auditRequest;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes('can only be resubmitted') ||
      message.includes('Only the applicant')
    ) {
      throw error;
    }
    logger.error('Error editing audit request', { error });
    throw new Error(`Failed to edit audit request: ${error}`);
  }
}
