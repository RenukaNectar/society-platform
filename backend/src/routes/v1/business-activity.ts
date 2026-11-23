import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import {
  getAllBusinessActivitiesController,
  getBusinessActivitiesBySocietyIdController,
  getBusinessActivityByIdController,
  createBusinessActivityController,
  updateBusinessActivityController,
} from '../../controllers/businessActivityController';
import {
  businessActivityQueryValidation,
  businessActivitySocietyIdValidation,
  businessActivityIdValidation,
  createBusinessActivityValidation,
  updateBusinessActivityValidation,
} from '../../validations/businessActivity';

const router = Router();

router.get(
  '/',
  authenticateToken,
  businessActivityQueryValidation,
  validateRequest,
  getAllBusinessActivitiesController
);

router.get(
  '/society/:societyId',
  authenticateToken,
  businessActivitySocietyIdValidation,
  validateRequest,
  getBusinessActivitiesBySocietyIdController
);

router.post(
  '/society/:societyId',
  authenticateToken,
  businessActivitySocietyIdValidation,
  createBusinessActivityValidation,
  validateRequest,
  createBusinessActivityController
);

router.get(
  '/:id',
  authenticateToken,
  businessActivityIdValidation,
  validateRequest,
  getBusinessActivityByIdController
);

router.put(
  '/:id',
  authenticateToken,
  businessActivityIdValidation,
  updateBusinessActivityValidation,
  validateRequest,
  updateBusinessActivityController
);

export default router;
