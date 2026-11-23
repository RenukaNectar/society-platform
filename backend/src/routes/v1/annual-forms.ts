import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import {
  canViewAnnualReturns,
  canManageAnnualReturns,
  canEditAnnualReturns,
  canDeleteAnnualReturns,
  canApproveAnnualReturns,
  canRejectAnnualReturns
} from '../../middleware/rbac';
import {
  getAnnualForms,
  getAnnualFormByIdController,
  createAnnualFormController,
  updateAnnualFormController,
  updateAnnualFormStatusController,
  deleteAnnualFormController,
  getAnnualFormsBySocietyIdController,
  getDistrictInfoController
} from '../../controllers/annualFormController';
import {
  annualFormIdValidation,
  societyIdValidation,
  annualFormQueryValidation,
  updateStatusValidation,
  createAnnualFormValidation,
  updateAnnualFormValidation,
} from '../../validations/annualForm';
import { registerEntityHistoryRoute } from './registerEntityHistoryRoute';

const router = Router();

// Get all annual forms with pagination and search - Only users with view permission
router.get('/',
  authenticateToken,
  canViewAnnualReturns(),
  annualFormQueryValidation,
  validateRequest,
  getAnnualForms
);

registerEntityHistoryRoute(router, { historyResources: ['ANNUAL_FILING'] });

// Get annual form by ID - Only users with view permission
router.get('/:id',
  authenticateToken,
  canViewAnnualReturns(),
  annualFormIdValidation,
  validateRequest,
  getAnnualFormByIdController
);

// Get annual forms by society ID - Only users with view permission
router.get('/society/:societyId',
  authenticateToken,
  canViewAnnualReturns(),
  societyIdValidation,
  validateRequest,
  getAnnualFormsBySocietyIdController
);

// Create new annual form - Only users with create permission
router.post('/',
  authenticateToken,
  canManageAnnualReturns(),
  createAnnualFormValidation,
  validateRequest,
  createAnnualFormController
);

// Update annual form - Only users with edit permission
router.put('/:id',
  authenticateToken,
  canEditAnnualReturns(),
  annualFormIdValidation,
  updateAnnualFormValidation,
  validateRequest,
  updateAnnualFormController
);

// Update annual form status - Only users with approve/reject permission
router.patch('/:id/status',
  authenticateToken,
  canApproveAnnualReturns(),
  annualFormIdValidation,
  updateStatusValidation,
  validateRequest,
  updateAnnualFormStatusController
);

// Delete annual form - Only users with delete permission
router.delete('/:id',
  authenticateToken,
  canDeleteAnnualReturns(),
  annualFormIdValidation,
  validateRequest,
  deleteAnnualFormController
);

// Get district information for debugging - No authentication required for debugging
router.get('/debug/district-info',
  getDistrictInfoController
);

export default router;
