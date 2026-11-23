import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import { canManageConversions, requireAnyPermission } from '../../middleware/rbac';
import {
  getSocietyConversions,
  getSocietyConversionByIdController,
  getLatestSocietyConversionBySocietyIdController,
  createSocietyConversionController,
  resubmitSocietyConversionController,
} from '../../controllers/societyConversionController';
import {
  createSocietyConversionValidation,
  societyConversionIdValidation,
  societyIdValidation,
  resubmitSocietyConversionValidation,
} from '../../validations/societyConversion';
import { registerEntityHistoryRoute } from './registerEntityHistoryRoute';

const router = Router();

// List / detail: `conversion.view` (RBAC API: resource conversion, action view) or legacy `society.view`
router.get('/',
  authenticateToken,
  requireAnyPermission([
    { resource: 'society', action: 'view' },
    { resource: 'conversion', action: 'view' },
  ]),
  getSocietyConversions
);

registerEntityHistoryRoute(router, {
  historyResources: ['SOCIETY_CONVERSION', 'society_conversion'],
});

router.get('/:id',
  authenticateToken,
  requireAnyPermission([
    { resource: 'society', action: 'view' },
    { resource: 'conversion', action: 'view' },
  ]),
  societyIdValidation,
  validateRequest,
  getLatestSocietyConversionBySocietyIdController
);

// Create / resubmit: matches RBAC permission `conversion` + `create` (e.g. name "conversion create")
router.post('/',
  authenticateToken,
  canManageConversions(),
  createSocietyConversionValidation,
  validateRequest,
  createSocietyConversionController
);

router.post('/:id/resubmit',
  authenticateToken,
  canManageConversions(),
  societyConversionIdValidation,
  resubmitSocietyConversionValidation,
  validateRequest,
  resubmitSocietyConversionController
);

export default router;
