import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import {
  canViewUsers,
  canManageUsers,
  canEditUsers,
  canDeleteUsers
} from '../../middleware/rbac';
import {
  getUsers,
  getUserById,
  createUserController,
  updateUserController,
  deleteUserController,
  toggleUserStatusController,
  toggleUserLockController,
  resetUserLoginAttemptsController,
  getUserStatsController,
  getUsersByRole,
  uploadSignatureController,
  setUserAvailabilityController,
  getAvailableUsersController,
  getUserAvailabilitySummaryController,
  bulkUploadApplicantsController
} from '../../controllers/userController';
import { getAmendmentDetailsByUserId } from '../../controllers/amendmentController';


import {
  userValidation,
  updateUserValidation,
  userIdValidation,
  userQueryValidation,
  setUserAvailabilityValidation,
  getAvailableUsersValidation
} from '../../validations/user';
import { handleMulterError, uploadBulkApplicantFile } from '../../middleware/upload';

const router = Router();

// Get all users - Only users with view permission
router.get('/',
  authenticateToken,
  canViewUsers(),
  userQueryValidation,
  validateRequest,
  getUsers
);

router.get(
  '/available/list',
  authenticateToken,
  getAvailableUsersValidation,
  validateRequest,
  getAvailableUsersController
);

router.get(
  '/:id/availability',
  authenticateToken,
  userIdValidation,
  validateRequest,
  getUserAvailabilitySummaryController
);

router.patch(
  '/:id/availability',
  authenticateToken,
  setUserAvailabilityValidation,
  validateRequest,
  setUserAvailabilityController
);

// Get user by ID - Only users with view permission
router.get('/:id',
  authenticateToken,
  canViewUsers(),
  userIdValidation,
  validateRequest,
  getUserById
);

// Create new user - Only users with create permission (Admin only)
router.post('/',
  authenticateToken,
  canManageUsers(),
  userValidation,
  validateRequest,
  createUserController
);

// Bulk create applicant users from Excel/CSV
// multipart field name: file (.xlsx, .xls, .csv)
// columns: email, password, confirm_password (optional), first_name, last_name, phone (optional), ncd_id (optional)
router.post(
  '/bulk-upload-applicants',
  authenticateToken,
  canManageUsers(),
  uploadBulkApplicantFile,
  handleMulterError,
  bulkUploadApplicantsController
);

// Update user - Only users with edit permission (Admin only)
router.put('/:id',
  authenticateToken,
  canEditUsers(),
  userIdValidation,
  updateUserValidation,
  validateRequest,
  updateUserController
);

// Delete user - Only users with delete permission (Admin only)
router.delete('/:id',
  authenticateToken,
  canDeleteUsers(),
  userIdValidation,
  validateRequest,
  deleteUserController
);

// Toggle user status - Only users with edit permission (Admin only)
router.patch('/:id/status',
  authenticateToken,
  canEditUsers(),
  userIdValidation,
  validateRequest,
  toggleUserStatusController
);

// Toggle user lock - Only users with edit permission (Admin only)
router.patch('/:id/lock',
  authenticateToken,
  canEditUsers(),
  userIdValidation,
  validateRequest,
  toggleUserLockController
);

// Reset user login attempts - Only users with edit permission (Admin only)
router.patch('/:id/reset-login-attempts',
  authenticateToken,
  canEditUsers(),
  userIdValidation,
  validateRequest,
  resetUserLoginAttemptsController
);

// Get user statistics - Only users with view permission (Admin only)
router.get('/stats/overview',
  authenticateToken,
  canViewUsers(),
  getUserStatsController
);

// Get amendment details by user ID - Users can view their own amendments, admins can view any
router.get('/:id/amendment',
  authenticateToken,
  async (req: any, res: any, next: any) => {
    try {
      // Check if user is trying to access their own amendments
      if (req.user.userId === req.params.id) {
        // User is accessing their own data - check amendment permissions
        const { requirePermission } = await import('../../middleware/rbac');
        const checkAmendmentPermission = requirePermission('amendment', 'view');
        return checkAmendmentPermission(req, res, next);
      } else {
        // User is trying to access another user's data - check user permissions
        const { canViewUsers } = await import('../../middleware/rbac');
        return canViewUsers()(req, res, next);
      }
    } catch (error) {
      next(error);
    }
  },
  userIdValidation,
  validateRequest,
  getAmendmentDetailsByUserId
);

//Get users by role-name
router.get('/roles/roleName',
  authenticateToken,
  getUsersByRole
);


router.post('/upload-signature',
  authenticateToken,
  uploadSignatureController
);

export default router; 