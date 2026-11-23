import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import {
  canViewLiquidations,
  canManageLiquidations,
  canEditLiquidations,
  canDeleteLiquidations,
  canApproveLiquidations,
  canRejectLiquidations
} from '../../middleware/rbac';
import {
  createLiquidationValidation,
  updateLiquidationValidation,
  liquidationFiltersValidation,
  liquidationIdValidation
} from '../../validations/liquidation';
import {
  createLiquidation,
  updateLiquidation,
  getAllLiquidations,
  getLiquidationById
} from '../../controllers/liquidationController';
import { registerEntityHistoryRoute } from './registerEntityHistoryRoute';

const router = Router();

// Create liquidation - Only users with create permission
router.post(
  '/',
  authenticateToken,
  // canManageLiquidations(),
  createLiquidationValidation,
  validateRequest,
  createLiquidation
);

// Update liquidation by ID - Only users with edit permission
router.put(
  '/:id',
  authenticateToken,
  // canEditLiquidations(),
  updateLiquidationValidation,
  validateRequest,
  updateLiquidation
);

// Get all liquidations - Only users with view permission
router.get(
  '/',
  authenticateToken,
  canViewLiquidations(),
  liquidationFiltersValidation,
  validateRequest,
  getAllLiquidations,
);

registerEntityHistoryRoute(router, {
  historyResources: ['LIQUIDATION', 'LIQUIDATION_RCS'],
});

// Get liquidation by ID - Only users with view permission
router.get(
  '/:id',
  authenticateToken,
  canViewLiquidations(),
  liquidationIdValidation,
  validateRequest,
  getLiquidationById
);

export default router;
