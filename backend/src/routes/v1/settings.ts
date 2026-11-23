import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import {
  getSettings,
  createSettingController,
  updateSettingController
} from '../../controllers/settingController';
import {
  settingValidation,
  updateSettingValidation,
  settingIdValidation,
  settingQueryValidation
} from '../../validations/setting';

const router = Router();

// Get all settings - with pagination and filters
router.get('/',
  authenticateToken,
  settingQueryValidation,
  validateRequest,
  getSettings
);

// Create setting
router.post('/',
  authenticateToken,
  settingValidation,
  validateRequest,
  createSettingController
);

// Update setting
router.put('/:id',
  authenticateToken,
  settingIdValidation,
  updateSettingValidation,
  validateRequest,
  updateSettingController
);

export default router;
