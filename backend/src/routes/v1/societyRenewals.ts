import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import {
  createSocietyRenewalController,
  updateSocietyRenewalController,
  deleteSocietyRenewalController,
  getAllSocietyRenewalsController,
  getSocietyRenewalsBySocietyIdController
} from '../../controllers/societyRenewalController';
import { body, param } from 'express-validator';
import { uploadChallanFile, handleMulterError } from '../../middleware/upload';
import { registerEntityHistoryRoute } from './registerEntityHistoryRoute';

const router = Router();

const renewalValidation = [
  body('society_id').notEmpty().withMessage('Society ID is required'),
  // challan_url validation is conditional - either a file upload or a URL string
  body('challan_url')
    .optional()
    .custom((value, { req }) => {
      // If no file is uploaded and no URL is provided, it's invalid
      if (!req.file && !value) {
        throw new Error('Either challan file upload or challan URL is required');
      }
      // If a URL is provided (not a file), validate it
      if (value && !req.file) {
        try {
          const url = new URL(value);
          if (!['http:', 'https:'].includes(url.protocol)) {
            throw new Error('Challan URL must use http or https protocol');
          }
        } catch {
          throw new Error('Challan URL must be a valid URL with http or https protocol');
        }
      }
      return true;
    }),
];

const updateRenewalValidation = [
  body('challan_url')
    .optional()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Challan URL must be a valid URL with http or https protocol'),
  body('submit_date').optional().isISO8601().withMessage('Submit date must be a valid date'),
  body('status').optional().isUUID().withMessage('Status must be a valid UUID'),
];

const idValidation = [
  param('id').isUUID().withMessage('ID must be a valid UUID'),
];

const societyIdValidation = [
  param('society_id').notEmpty().withMessage('Society ID is required'),
];

// Get all renewals
router.get('/',
  authenticateToken,
  validateRequest,
  getAllSocietyRenewalsController
);

// Get renewals by society ID
router.get('/society/:society_id',
  authenticateToken,
  societyIdValidation,
  validateRequest,
  getSocietyRenewalsBySocietyIdController
);

registerEntityHistoryRoute(router, {
  historyResources: ['SOCIETY_RENEWAL', 'society_renewal'],
});

// Create new renewal (supports both file upload and URL)
router.post('/',
  authenticateToken,
  uploadChallanFile,
  handleMulterError,
  renewalValidation,
  validateRequest,
  createSocietyRenewalController
);

// Update renewal
router.put('/:id',
  authenticateToken,
  idValidation,
  updateRenewalValidation,
  validateRequest,
  updateSocietyRenewalController
);

// Remove renewal challan before workflow action
router.delete('/:id',
  authenticateToken,
  idValidation,
  validateRequest,
  deleteSocietyRenewalController
);

export default router;
