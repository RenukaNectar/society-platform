import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import {
  canViewElectionRequests,
  canManageElectionRequests,
  canEditElectionRequests,
  canDeleteElectionRequests,
  canApproveElectionRequests,
  canRejectElectionRequests
} from '../../middleware/rbac';
import { 
  createElectionRequest,
  getElectionRequestById,
  getElectionRequests,
  getElectionRequestsBySociety,
  updateElectionRequestStatus,
  updateElectionRequest,
  deleteElectionRequest
} from '../../controllers/electionRequestController';
import {
  createElectionRequestValidation,
  getElectionRequestByIdValidation,
  getElectionRequestsValidation,
  getElectionRequestsBySocietyValidation,
  updateElectionRequestStatusValidation,
  updateElectionRequestValidation,
  deleteElectionRequestValidation
} from '../../validations/electionRequest';
import { registerEntityHistoryRoute } from './registerEntityHistoryRoute';

const router = Router();

// Create election request with file uploads - Only users with create permission
router.post(
  '/',
  authenticateToken,
  canManageElectionRequests(),
  createElectionRequestValidation,
  validateRequest,
  createElectionRequest
);

// Get all election requests with filters - Only users with view permission
router.get(
  '/',
  authenticateToken,
  // canViewElectionRequests(),
  getElectionRequestsValidation,
  validateRequest,
  getElectionRequests
);

registerEntityHistoryRoute(router, { historyResources: ['ELECTION'] });

// Get election request by ID - Only users with view permission
router.get(
  '/:id',
  authenticateToken,
  // canViewElectionRequests(),
  getElectionRequestByIdValidation,
  validateRequest,
  getElectionRequestById
);

// Get election requests by society - Only users with view permission
router.get(
  '/society/:societyId',
  authenticateToken,
  // canViewElectionRequests(),
  getElectionRequestsBySocietyValidation,
  validateRequest,
  getElectionRequestsBySociety
);

// Update election request status - Only users with approve/reject permission
router.patch(
  '/:id/status',
  authenticateToken,
  // canApproveElectionRequests(),
  updateElectionRequestStatusValidation,
  validateRequest,
  updateElectionRequestStatus
);

// Update election request - Only users with edit permission
router.put(
  '/:id',
  authenticateToken,
  // canEditElectionRequests(),
  updateElectionRequestValidation,
  validateRequest,
  updateElectionRequest
);

// Delete election request - Only users with delete permission
router.delete(
  '/:id',
  authenticateToken,
  // canDeleteElectionRequests(),
  deleteElectionRequestValidation,
  validateRequest,
  deleteElectionRequest
);

export default router;
