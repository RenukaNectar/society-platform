import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import {
  canViewAppealsWithRoleFallback,
  canManageAppealsWithRoleFallback,
  canReviewAppeals,
  canViewAppealReviews,
} from '../../middleware/rbac';
import { 
  createAppeal,
  getAppealById,
  getAppeals,
  reviewAppeal,
  getAppealsReviewList,
  statusChange
} from '../../controllers/appealController';
import {
  createAppealValidation,
  getAppealByIdValidation,
  getAppealsValidation,
} from '../../validations/appeal';
import { registerEntityHistoryRoute } from './registerEntityHistoryRoute';

const router = Router();

// Create appeal - Only users with create permission or allowed roles
router.post(
  '/',
  authenticateToken,
  canManageAppealsWithRoleFallback(),
  createAppealValidation,
  validateRequest,
  createAppeal
);

// Get all appeals with filters - Only users with view permission or allowed roles
router.get(
  '/',
  authenticateToken,
  canViewAppealsWithRoleFallback(),
  getAppealsValidation,
  validateRequest,
  getAppeals
);

registerEntityHistoryRoute(router, { historyResources: ['APPEAL'] });

// Get appeal by ID - Only users with view permission or allowed roles
router.get(
  '/:id',
  authenticateToken,
  canViewAppealsWithRoleFallback(),
  getAppealByIdValidation,
  validateRequest,
  getAppealById
);

// Review appeal / schedule hearing (workflow officers — not appeal create)
router.post(
  '/:id/review',
  authenticateToken,
  canReviewAppeals(),
  reviewAppeal
);

// get appeals review list
router.get(
  '/:id/review-list',
  authenticateToken,
  canViewAppealReviews(),
  getAppealsReviewList
);

// status change
router.put(
  '/:id/status',
  authenticateToken,
  canReviewAppeals(),
  statusChange
);

export default router;
