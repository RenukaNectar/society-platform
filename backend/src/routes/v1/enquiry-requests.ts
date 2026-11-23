import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import {
  canViewEnquiryRequestsWithRoleFallback,
  canManageEnquiryRequestsWithRoleFallback
} from '../../middleware/rbac';
import { 
  createEnquiryRequest,
  getEnquiryRequestById,
  getEnquiryRequests,
  updateEnquiryStatus,
  deleteEnquiryRequest
} from '../../controllers/enquiryController';
import {
  createEnquiryRequestValidation,
  getEnquiryRequestByIdValidation,
  getEnquiryRequestsValidation,
} from '../../validations/enquiryRequest';
import { registerEntityHistoryRoute } from './registerEntityHistoryRoute';

const router = Router();

// Create enquiry request - Only users with create permission or allowed roles
router.post(
  '/',
  authenticateToken,
  canManageEnquiryRequestsWithRoleFallback(),
  createEnquiryRequestValidation,
  validateRequest,
  createEnquiryRequest
);

// Get all enquiry requests with filters - Only users with view permission or allowed roles
router.get(
  '/',
  authenticateToken,
  canViewEnquiryRequestsWithRoleFallback(),
  getEnquiryRequestsValidation,
  validateRequest,
  getEnquiryRequests
);

registerEntityHistoryRoute(router, {
  historyResources: ['INSPECTION_INQUIRY', 'INSPECTION_INQUIRY_RCS', 'inquiry', 'enquiry'],
});

// Get enquiry request by ID - Only users with view permission or allowed roles
router.get(
  '/:id',
  authenticateToken,
  canViewEnquiryRequestsWithRoleFallback(),
  getEnquiryRequestByIdValidation,
  validateRequest,
  getEnquiryRequestById
);

// Update enquiry request status - Only users with edit permission or allowed roles
router.patch(
  '/:id/status',
  authenticateToken,
  canManageEnquiryRequestsWithRoleFallback(),
  validateRequest,
  updateEnquiryStatus
);

// Delete enquiry request - Only users with delete permission or allowed roles
router.delete(
  '/:id',
  authenticateToken,
  canManageEnquiryRequestsWithRoleFallback(),
  validateRequest,
  deleteEnquiryRequest
);

export default router;
