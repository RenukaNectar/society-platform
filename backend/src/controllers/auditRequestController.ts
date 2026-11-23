import { Response } from 'express';
import {
  createAuditRequest as createAuditRequestService,
  getAuditRequestById as getAuditRequestByIdService,
  getAuditRequests as getAuditRequestsService,
  getAuditRequestsBySociety as getAuditRequestsBySocietyService,
  getAuditorsService,
  approveAuditRequestStatus as auditRequestStatus,
  editAuditRequestService
} from '../services/AuditRequestService';
import { returnResponse } from '../utils/response';
import { IAuthRequest } from '../types';
import User from '../models/user';
import { formatWorkflowStatusForApi, getWorkflowStatus } from '../services/WorkflowUtilService';
import { getLatestCommentDocuments, attachCompleteProcessingHistoryToDetail } from '../services/WorkflowCommentService';
import { findHistoryByReference } from '../services/HistoryService';
import logger from '../utils/logger';

export const createAuditRequest = async (req: IAuthRequest, res: Response) => {

  try {
    const {
      society_registration_id,
      financial_year,
      auditor_name,
      auditor_registration_number,
      audit_completion_date,
      audit_classification,
      agm_date,
      bod_meeting_date,
      agm_total_members_on_roll,
      agm_members_attended,
      bod_total_members_on_roll,
      bod_members_attended,
      turnover,
      profit_loss,
      profit_loss_type,
      gross_profit,
      working_capital,
      accumulated_profit,
      accumulated_loss,
      audit_fee_paid,
      declaration_accepted,
      additional_notes,
      audit_accounts_media_id,
      audit_note_media_id,
      vital_stats_form_media_id,
      shareholder_list_media_id,
      agm_bod_minutes_media_id,
      auditor_appointment_letter_media_id,
      registration_certificate_media_id,
      abstract_closing_stock_media_id,
      asset_list_depreciation_media_id
    } = req.body;

    const userId = req.user?.userId || (req as any).user?.id;

    if (!userId) {
      console.error('No user ID found in request:', {
        reqUser: req.user,
        reqUserAny: (req as any).user,
        userId
      });
      return returnResponse(res).error('Authentication required - no user ID found', []);
    }

    console.log('Creating audit request for user:', userId);

    const auditRequest = await createAuditRequestService({
      society_registration_id,
      financial_year,
      auditor_name,
      auditor_registration_number,
      audit_completion_date: new Date(audit_completion_date),
      audit_classification,
      agm_date: agm_date ? new Date(agm_date) : undefined,
      bod_meeting_date: bod_meeting_date ? new Date(bod_meeting_date) : undefined,
      agm_total_members_on_roll: agm_total_members_on_roll ? Number(agm_total_members_on_roll) : undefined,
      agm_members_attended: agm_members_attended ? Number(agm_members_attended) : undefined,
      bod_total_members_on_roll: bod_total_members_on_roll ? Number(bod_total_members_on_roll) : undefined,
      bod_members_attended: bod_members_attended ? Number(bod_members_attended) : undefined,
      turnover: turnover ? Number(turnover) : undefined,
      profit_loss: profit_loss ? Number(profit_loss) : undefined,
      profit_loss_type: profit_loss_type || undefined,
      gross_profit: gross_profit ? Number(gross_profit) : undefined,
      working_capital: working_capital ? Number(working_capital) : undefined,
      accumulated_profit: accumulated_profit ? Number(accumulated_profit) : undefined,
      accumulated_loss: accumulated_loss ? Number(accumulated_loss) : undefined,
      audit_fee_paid: audit_fee_paid ? Number(audit_fee_paid) : undefined,
      audit_accounts_media_id,
      audit_note_media_id,
      vital_stats_form_media_id,
      shareholder_list_media_id,
      agm_bod_minutes_media_id,
      auditor_appointment_letter_media_id,
      registration_certificate_media_id,
      abstract_closing_stock_media_id,
      asset_list_depreciation_media_id,
      declaration_accepted: declaration_accepted ? true : false,
      additional_notes,
      created_by: userId
    });

    // Return response with audit request and uploaded media information
    if (auditRequest.success) {
      returnResponse(res).ok('Audit request created successfully', auditRequest.data);
    } else {
      returnResponse(res).error(auditRequest.message, []);
    }
  } catch (error: any) {
    console.error('Error creating audit request:', error);
    returnResponse(res).error('Failed to create audit request', []);
  }
};

/**
 * Get audit request by ID
 */
export const getAuditRequestById = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get the authenticated user's ID
    const userId = req.user?.userId;
    if (!userId) {
      return returnResponse(res).error('Authentication required', []);
    }

    const auditRequest = await getAuditRequestByIdService(id as string);

    if (!auditRequest) {
      return returnResponse(res).error('Audit request not found', []);
    }

    const payload = auditRequest.toJSON ? auditRequest.toJSON() : auditRequest;

    // Same shape as society registration / renewal: workflowStatus.current | next | previous | ...
    try {
      const workflow = await getWorkflowStatus(id as string, 'AUDIT_REQUEST', false);
      (payload as any).workflowStatus = formatWorkflowStatusForApi(workflow);
    } catch (workflowError: any) {
      logger.warn('Error fetching workflow status for audit request', {
        auditRequestId: id,
        error: workflowError?.message
      });
      (payload as any).workflowStatus = null;
    }

    try {
      (payload as any).previousCommentDocuments = await getLatestCommentDocuments(id as string, 'AUDIT_REQUEST');
    } catch (documentsError: any) {
      logger.warn('Error fetching previous comment documents for audit request', {
        auditRequestId: id,
        error: documentsError?.message
      });
      (payload as any).previousCommentDocuments = [];
    }

    try {
      (payload as any).history = await findHistoryByReference(id as string, 'AUDIT_REQUEST');
    } catch (historyError: any) {
      logger.warn('Error fetching history for audit request', {
        auditRequestId: id,
        error: historyError?.message
      });
      (payload as any).history = [];
    }

    await attachCompleteProcessingHistoryToDetail(payload as any, id as string, 'AUDIT_REQUEST');

    return returnResponse(res).ok('Audit request retrieved successfully', payload);
  } catch (error: any) {
    console.error('Error getting audit request by ID:', error);
    return returnResponse(res).error('Failed to retrieve audit request', []);
  }
};

/**
 * Get all audit requests with filters
 */
export const getAuditRequests = async (req: IAuthRequest, res: Response) => {
  try {
    const {
      society_registration_id,
      status_id,
      financial_year,
      page = 1,
      limit = 10
    } = req.query;

    const search = req.query.search as string;
    // Get the authenticated user's ID and district
    const userId = req.user?.userId;
    const userDistrictId = (await User.findOne({ where: { id: userId } }))?.district_id;
    const userRole = req.user?.role;

    if (!userId) {
      return returnResponse(res).error('Authentication required', []);
    }

    // District requirement: only for roles that scope lists by user's district.
    // Applicants are filtered by created_by in the service — they often have no district_id on the user row.
    const rolesNotRequiringUserDistrict = new Set([
      'admin',
      'rcs_district',
      'jt_rcs_district',
      'drcs_arcs_hq',
      'jics_sics_hq',
      'applicant',
      'system_admin',
      'superAdmin'
    ]);

    const shouldRequireDistrict = !rolesNotRequiringUserDistrict.has(userRole as string);

    if (shouldRequireDistrict && !userDistrictId) {
      return returnResponse(res).error('District information required for this user role', []);
    }

    const filters = {
      society_registration_id: society_registration_id as string,
      status_id: status_id as string,
      financial_year: financial_year as string,
      from: req.query.from as string,
      to: req.query.to as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    // Pass the authenticated user information to the service
    const authenticatedUser = {
      district_id: userDistrictId,
      role: userRole,
      userId: userId
    };

    const result = await getAuditRequestsService(filters, authenticatedUser, search);

    return returnResponse(res).ok('Audit requests retrieved successfully', {
      auditRequests: result.auditRequests,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1
      }
    });
  } catch (error: any) {
    console.error('Error getting audit requests:', error);
    return returnResponse(res).error('Failed to retrieve audit requests', []);
  }
};

/**
 * Get audit requests by society registration ID
 */
export const getAuditRequestsBySociety = async (req: IAuthRequest, res: Response) => {
  try {
    const { society_registration_id } = req.params;

    // Get the authenticated user's ID and district
    const userId = req.user?.userId;
    const userDistrictId = req.user?.district_id;
    const userRole = req.user?.role;

    if (!userId) {
      return returnResponse(res).error('Authentication required', []);
    }

    // District on user row is only required when the service scopes by district for that role.
    let shouldRequireDistrict = true;

    if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'system_admin' || userRole === 'superAdmin') {
      shouldRequireDistrict = false;
    }

    if (userRole === 'applicant') {
      shouldRequireDistrict = false;
    }

    // Registrar and inspector roles can work without district (they might be assigned to multiple districts)
    if (userRole === 'registrar' || userRole === 'joint_registrar' ||
      userRole === 'deputy_registrar' || userRole === 'senior_inspector' ||
      userRole === 'field_inspector') {
      shouldRequireDistrict = false;
    }

    if (shouldRequireDistrict && !userDistrictId) {
      return returnResponse(res).error('District information required for this user role', []);
    }

    // Pass the authenticated user information to the service
    const authenticatedUser = {
      district_id: userDistrictId,
      role: userRole,
      userId: userId
    };

    const auditRequests = await getAuditRequestsBySocietyService(society_registration_id as string, authenticatedUser);

    // No need to filter by user since we're already filtering by district for security
    return returnResponse(res).ok('Audit requests retrieved successfully', auditRequests);
  } catch (error: any) {
    console.error('Error getting audit requests by society:', error);
    return returnResponse(res).error('Failed to retrieve audit requests by society', []);
  }
};

export const getAuditors = async (req: IAuthRequest, res: Response) => {
  try {
    const auditors = await getAuditorsService();
    if (auditors) {
      returnResponse(res).ok('Auditors retrieved successfully', auditors);
    } else {
      returnResponse(res).error('Auditors not found', []);
    }
  } catch (error: any) {
    console.error('Error getting auditors:', error);
    returnResponse(res).error('Failed to retrieve auditors', []);
  }
};

// Approve audit request status
export const approveAuditRequestStatus = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status_id, comments } = req.body;


    const auditRequest = await auditRequestStatus(id as string, status_id as string, comments as string);
    if (auditRequest) {
      return returnResponse(res).ok('Audit request status updated successfully', auditRequest);
    } else {
      return returnResponse(res).error('Audit request status not updated', []);
    }
  } catch (error: any) {
    console.error('Error approving audit request status:', error);
    return returnResponse(res).error('Failed to update audit request status', []);
  }
};
// edit audit request
export const editAuditRequest = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const {
      society_registration_id,
      financial_year,
      auditor_name,
      auditor_registration_number,
      audit_completion_date,
      audit_classification,
      agm_date,
      bod_meeting_date,
      agm_total_members_on_roll,
      agm_members_attended,
      bod_total_members_on_roll,
      bod_members_attended,
      turnover,
      profit_loss,
      profit_loss_type,
      gross_profit,
      working_capital,
      accumulated_profit,
      accumulated_loss,
      audit_fee_paid,
      declaration_accepted,
      additional_notes,
      audit_accounts_media_id,
      audit_note_media_id,
      vital_stats_form_media_id,
      shareholder_list_media_id,
      agm_bod_minutes_media_id,
      auditor_appointment_letter_media_id,
      registration_certificate_media_id,
      abstract_closing_stock_media_id,
      asset_list_depreciation_media_id
    } = req.body;

    const auditRequest = await editAuditRequestService(id as string, {
      society_registration_id,
      financial_year,
      auditor_name,
      auditor_registration_number,
      audit_completion_date,
      audit_classification,
      agm_date,
      bod_meeting_date,
      agm_total_members_on_roll,
      agm_members_attended,
      bod_total_members_on_roll,
      bod_members_attended,
      turnover,
      profit_loss,
      profit_loss_type,
      gross_profit,
      working_capital,
      accumulated_profit,
      accumulated_loss,
      audit_fee_paid,
      declaration_accepted,
      additional_notes,
      audit_accounts_media_id,
      audit_note_media_id,
      vital_stats_form_media_id,
      shareholder_list_media_id,
      agm_bod_minutes_media_id,
      auditor_appointment_letter_media_id,
      registration_certificate_media_id,
      abstract_closing_stock_media_id,
      asset_list_depreciation_media_id,
      updated_by: req.user?.userId,
    });
    if (auditRequest) {
      return returnResponse(res).ok('Audit request resubmitted successfully', auditRequest);
    } else {
      return returnResponse(res).error('Audit request not updated', []);
    }
  } catch (error: any) {
    console.error('Error editing audit request:', error);
    const message = error?.message || 'Failed to update audit request';
    return returnResponse(res).error(message, []);
  }
};
