import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
// import {
//   canManageSocieties,
//   canViewSocieties,
// } from '../../middleware/rbac';
import {
  updateWorkflowStatusController,
  getWorkflowStatusController,
  reassignWorkflowController,
  getAssignmentHistoryController,
} from '../../controllers/workflowController';
import {
  updateWorkflowStatusValidation,
  getWorkflowStatusValidation,
  reassignWorkflowValidation,
  getAssignmentHistoryValidation,
} from '../../validations/workflow';

const router = Router();

/**
 * @route   POST /api/v1/workflows/update
 * @desc    Update workflow status for any module (approve/reject/back)
 * @access  Private
 */
router.post(
  '/update',
  authenticateToken,
  // canManageSocieties(), // Commented out for now
  updateWorkflowStatusValidation,
  validateRequest,
  updateWorkflowStatusController
);

/**
 * @route   POST /api/v1/workflows/reassign
 * @desc    Reassign when current assignee is unavailable (only original assigner).
 * @access  Private
 */
router.post(
  '/reassign',
  authenticateToken,
  reassignWorkflowValidation,
  validateRequest,
  reassignWorkflowController
);

/**
 * @route   GET /api/v1/workflows/:resourceId/assignment-history?moduleName=...
 * @desc    Assignment / reassignment history (newest first).
 * @access  Private
 */
router.get(
  '/:resourceId/assignment-history',
  authenticateToken,
  getAssignmentHistoryValidation,
  validateRequest,
  getAssignmentHistoryController
);

/**
 * @route   GET /api/v1/workflows/:resourceId/status
 * @desc    Get workflow status for any module
 * @access  Private
 * @note    Backward compatibility: route parameter can be :resourceId or :societyId (both work)
 */
router.get(
  '/:resourceId/status',
  authenticateToken,
  getWorkflowStatusValidation,
  validateRequest,
  getWorkflowStatusController
);

export default router;
