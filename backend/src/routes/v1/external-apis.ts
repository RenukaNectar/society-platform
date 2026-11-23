import { Router } from 'express';
import { validateRequest } from '../../middleware/auth';
import {
  getAllExternalApiDataController,
  getExternalApiDataByNameController,
  getAvailableApisController
} from '../../controllers/externalApiController';

const router = Router();

/**
 * @route GET /api/v1/external-apis
 * @desc Get data from all external APIs
 * @access Private (requires authentication)
 */
router.get('/', 
  validateRequest,
  getAllExternalApiDataController
);

/**
 * @route GET /api/v1/external-apis/available
 * @desc Get list of available external APIs
 * @access Private (requires authentication)
 */
router.get('/available', 
  validateRequest,
  getAvailableApisController
);

/**
 * @route GET /api/v1/external-apis/:apiName
 * @desc Get data from a specific external API by name
 * @access Private (requires authentication)
 */
router.get('/:apiName', 
  validateRequest,
  getExternalApiDataByNameController
);

export default router;
