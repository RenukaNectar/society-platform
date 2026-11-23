import { Router } from 'express';
import { 
  getAuditRequests,
  getAuditRequestById,
  getAuditRequestsBySociety
} from '../../controllers/auditRequestController';
import {
  getAuditRequestByIdValidation,
  getAuditRequestsValidation,
  getAuditRequestsBySocietyValidation,
} from '../../validations/auditRequest';

const router = Router();

// Test routes without authentication
// Get all audit requests with filters
router.get(
  '/',
  getAuditRequestsValidation,
  getAuditRequests
);

// Get audit request by ID
router.get(
  '/:id',
  getAuditRequestByIdValidation,
  getAuditRequestById
);

// Get audit requests by society registration ID
router.get(
  '/society/:society_registration_id',
  getAuditRequestsBySocietyValidation,
  getAuditRequestsBySociety
);

export default router;
