import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { Request, Response } from 'express';
import { returnResponse } from '../utils/response';
import { IAuthRequest } from '../types';
import {
  updateWorkflowStatus,
  getWorkflowStatus,
  reassignWorkflow,
  getAssignmentHistory
} from '../services/WorkflowUtilService';
import { findUserById } from '../services/UserService';

/**
 * Update workflow status for any module (approve/reject/back)
 */
export const updateWorkflowStatusController = async (req: IAuthRequest, res: Response) => {
  try {
    const userId = req?.user?.userId as string;

    if (!userId) {
      return returnResponse(res).error('User not found', null);
    }

    const isUserExist = await findUserById(userId);
    if (!isUserExist) {
      return returnResponse(res).error('User not found', null);
    }

    const {
      resourceId,
      societyId, // Backward compatibility: still accepted but deprecated
      moduleName,
      action,
      comments,
      districtId,
      stateId,
      isHq,
      assigned_to, // Specific user ID to assign notification to
      documents, // Document data (JSON object) - can contain media IDs, notes, etc.
      bypass
    } = req.body;

    const effectiveResourceId = resourceId ?? societyId; // Backward compatibility
    if (!effectiveResourceId) {
      return returnResponse(res).error('resourceId is required', null);
    }
    if (!moduleName) {
      return returnResponse(res).error('Module name is required', null);
    }
    if (!action) {
      return returnResponse(res).error('Action is required (approve/reject/back)', null);
    }
    if (!['approve', 'reject', 'back'].includes(action)) {
      return returnResponse(res).error('Action must be one of: approve, reject, back', null);
    }

    const result = await updateWorkflowStatus({
      resourceId: effectiveResourceId,
      moduleName,
      action,
      userId,
      comments,
      districtId,
      stateId,
      isHq: isHq || false,
      assigned_to: assigned_to || null, // Pass assigned_to (null if not provided)
      documents: documents || null, // Pass documents object (null if not provided)
      bypass: bypass === true || bypass === 'true'
    });

    return returnResponse(res).ok('Workflow status updated successfully', result);
  } catch (error) {
    logger.error('Failed to update workflow status:', error);
    if (error instanceof AppError) {
      return returnResponse(res).error(error.message || 'Failed to update workflow status', null);
    }
    return returnResponse(res).error('Internal server error', null);
  }
};

/**
 * Get workflow status for any module
 */
export const getWorkflowStatusController = async (req: IAuthRequest, res: Response) => {
  try {
    const userId = req?.user?.userId as string;

    if (!userId) {
      return returnResponse(res).error('User not found', null);
    }

    // Get resourceId from route params (route is defined as :resourceId, but also check for :societyId for backward compatibility)
    const resourceId = (req.params.resourceId || req.params.societyId) as string;
    const moduleName = req.query.moduleName as string;
    const isHq = req.query.isHq === 'true';

    if (!resourceId) {
      return returnResponse(res).error('Resource ID is required', null);
    }
    if (!moduleName) {
      return returnResponse(res).error('Module name is required', null);
    }

    const result = await getWorkflowStatus(
      resourceId,
      moduleName,
      isHq
    );

    return returnResponse(res).ok('Workflow status retrieved successfully', result);
  } catch (error) {
    logger.error('Failed to get workflow status:', error);
    if (error instanceof AppError) {
      return returnResponse(res).error('Failed to retrieve workflow status', null);
    }
    return returnResponse(res).error('Internal server error', null);
  }
};

/**
 * Reassign a workflow resource (society registration, renewal, audit etc.) from its
 * currently-assigned user to a new user when the current assignee is unavailable.
 *
 * Permission is enforced inside the service: only the original assigner (status_changed_by)
 * may reassign, and only when the current assignee is effectively unavailable.
 */
export const reassignWorkflowController = async (req: IAuthRequest, res: Response) => {
  try {
    const userId = req?.user?.userId as string;
    if (!userId) {
      return returnResponse(res).error('User not found', null);
    }

    const isUserExist = await findUserById(userId);
    if (!isUserExist) {
      return returnResponse(res).error('User not found', null);
    }

    const { resourceId, moduleName, newAssigneeUserId, reason } = req.body;

    if (!resourceId) return returnResponse(res).error('resourceId is required', null);
    if (!moduleName) return returnResponse(res).error('moduleName is required', null);
    if (!newAssigneeUserId) return returnResponse(res).error('newAssigneeUserId is required', null);
    if (!reason || !String(reason).trim()) {
      return returnResponse(res).error('reason is required', null);
    }

    const result = await reassignWorkflow({
      resourceId,
      moduleName,
      newAssigneeUserId,
      reason: String(reason),
      callerId: userId
    });

    return returnResponse(res).ok('Application reassigned successfully', result);
  } catch (error: any) {
    logger.error('Failed to reassign workflow:', error);
    if (error instanceof AppError) {
      return returnResponse(res).error(error.message || 'Failed to reassign workflow', null);
    }
    return returnResponse(res).error('Internal server error', null);
  }
};

/**
 * Fetch the full assignment history for a resource (newest-first).
 */
export const getAssignmentHistoryController = async (req: IAuthRequest, res: Response) => {
  try {
    const userId = req?.user?.userId as string;
    if (!userId) {
      return returnResponse(res).error('User not found', null);
    }

    const resourceId = (req.params.resourceId || req.params.societyId) as string;
    const moduleName = req.query.moduleName as string;

    if (!resourceId) {
      return returnResponse(res).error('Resource ID is required', null);
    }
    if (!moduleName) {
      return returnResponse(res).error('Module name is required', null);
    }

    const history = await getAssignmentHistory(moduleName, resourceId);
    return returnResponse(res).ok('Assignment history retrieved successfully', history);
  } catch (error: any) {
    logger.error('Failed to get assignment history:', error);
    if (error instanceof AppError) {
      return returnResponse(res).error(error.message || 'Failed to fetch assignment history', null);
    }
    return returnResponse(res).error('Internal server error', null);
  }
};
