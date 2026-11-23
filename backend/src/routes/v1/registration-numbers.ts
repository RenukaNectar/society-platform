import { Router } from 'express';
import { validateRequest } from '../../middleware/auth';
import {
  getNextRegistrationNumberController,
  validateRegistrationNumberController,
  getRegistrationNumberStatisticsController,
  getRegistrationNumberInfoController
} from '../../controllers/registrationNumberController';
import { 
  registrationNumberValidation
} from '../../validations/registrationNumber';

const router = Router();

// Get next registration number
router.get('/next', 
  getNextRegistrationNumberController
);

// Validate registration number format
router.get('/validate/:registrationNumber', 
  registrationNumberValidation,
  validateRequest,
  validateRegistrationNumberController
);

// Get registration number statistics
router.get('/statistics', 
  getRegistrationNumberStatisticsController
);

// Get registration number information
router.get('/info/:registrationNumber', 
  registrationNumberValidation,
  validateRequest,
  getRegistrationNumberInfoController
);

export default router; 