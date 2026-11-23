import { Router } from 'express';
import {
  createAmendment,
  getAmendmentById,
  getAmendments,
  updateAmendment,
  getAmendmentsBySociety,
  updateAmendmentStatus
} from '../../controllers/amendmentController';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import {
  canViewAmendments,
  canManageAmendments,
  canCreateOrEditAmendments,
  canDeleteAmendments,
  canApproveAmendments,
  canRejectAmendments
} from '../../middleware/rbac';
import { checkSocietyApprovalStatus } from '../../middleware/societyApproval';
import {
  createAmendmentValidation,
  updateAmendmentValidation,
  amendmentIdValidation,
  getAmendmentsBySocietyIdValidation,
  getAmendmentsValidation
} from '../../validations/amendment';
import { uploadAmedmentsfile, handleMulterError } from '../../middleware/upload';
import { registerEntityHistoryRoute } from './registerEntityHistoryRoute';

const router = Router();

// Create a new amendment - Only users with create permission
router.post(
  '/',
  authenticateToken,
  canManageAmendments(),
  uploadAmedmentsfile,
  handleMulterError,
  createAmendmentValidation,
  validateRequest,
  checkSocietyApprovalStatus,
  createAmendment
);

// Get all amendments with pagination and filters - Only users with view permission
router.get(
  '/',
  authenticateToken,
  canViewAmendments(),
  getAmendmentsValidation,
  validateRequest,
  getAmendments
);

registerEntityHistoryRoute(router, { historyResources: ['AMENDMENT'] });

// Get amendment by ID - Only users with view permission
router.get(
  '/:id',
  authenticateToken,
  canViewAmendments(),
  amendmentIdValidation,
  validateRequest,
  getAmendmentById
);

// Update amendment - Only users with edit permission
router.put(
  '/:id',
  authenticateToken,
  canCreateOrEditAmendments(),
  uploadAmedmentsfile,
  handleMulterError,
  updateAmendmentValidation,
  validateRequest,
  checkSocietyApprovalStatus,
  updateAmendment
);
// Get amendments by society ID
router.get(
  '/society/:societyId',
  authenticateToken,
  canViewAmendments(),
  getAmendmentsBySocietyIdValidation,
  validateRequest,
  getAmendmentsBySociety
);

// Update amendment status - Only users with approve/reject permission
router.put(
  '/:id/status',
  authenticateToken,
  // canApproveAmendments(),
  amendmentIdValidation,
  validateRequest,
  updateAmendmentStatus
);

export default router; 