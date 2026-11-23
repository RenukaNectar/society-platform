import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import {
  canViewAuditRequests,
  canManageAuditRequests,
  canEditAuditRequests,
  canDeleteAuditRequests,
  canApproveAuditRequests,
  canRejectAuditRequests
} from '../../middleware/rbac';
import { 
  createAuditRequest,
  getAuditRequestById,
  getAuditRequests,
  getAuditRequestsBySociety,
  approveAuditRequestStatus,
  editAuditRequest
} from '../../controllers/auditRequestController';
import {
  createAuditRequestValidation,
  getAuditRequestByIdValidation,
  getAuditRequestsValidation,
  getAuditRequestsBySocietyValidation,
} from '../../validations/auditRequest';
import { registerEntityHistoryRoute } from './registerEntityHistoryRoute';

const router = Router();

// Create audit request with file uploads - Only users with create permission
router.post(
  '/',
  authenticateToken,
  canManageAuditRequests(),
  createAuditRequestValidation,
  validateRequest,
  createAuditRequest
);

// Get all audit requests with filters - Only users with view permission
router.get(
  '/',
  authenticateToken,
  canViewAuditRequests(),
  getAuditRequestsValidation,
  validateRequest,
  getAuditRequests
);

registerEntityHistoryRoute(router, { historyResources: ['AUDIT_REQUEST'] });

// Get audit request by ID - Only users with view permission
router.get(
  '/:id',
  authenticateToken,
  canViewAuditRequests(),
  getAuditRequestByIdValidation,
  validateRequest,
  getAuditRequestById
);

// Get audit requests by society registration ID - Only users with view permission
router.get(
  '/society/:society_registration_id',
  authenticateToken,
  canViewAuditRequests(),
  getAuditRequestsBySocietyValidation,
  validateRequest,
  getAuditRequestsBySociety
);

// Approve audit request
router.put(
  '/:id/status',
  authenticateToken,
  validateRequest,
  approveAuditRequestStatus
);

// edit audit request
router.put(
  '/:id',
  authenticateToken,
  canEditAuditRequests(),
  // editAuditRequestValidation,
  validateRequest,
  editAuditRequest
);

export default router;
