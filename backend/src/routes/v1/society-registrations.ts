import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
// import {
//   canViewSocieties,
//   canManageSocieties,
//   canEditSocieties,
//   canDeleteSocieties,
//   canApproveSocieties,
//   canRejectSocieties,
// } from '../../middleware/rbac';
import { 
  getSocietyRegistrations,
  getSocietyRegistrationByIdController,
  getSocietyByUserIdController,
  createSocietyRegistrationController,
  updateSocietyRegistrationController,
  updateSocietyAdditionalDataController,
  deleteSocietyRegistrationController,
  uploadChallanController,
  issueCertificateController,
  getNcdPayloadController,
  uploadToNcdController
} from '../../controllers/societyRegistrationController';
import { 
  societyIdValidation,
  userIdValidation,
  societyQueryValidation,
  societyRegistrationValidation,
  updateSocietyRegistrationValidation,
  updateSocietyAdditionalDataValidation,
} from '../../validations/societyRegistration';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Get all society registrations - Only users with view permission
router.get('/', 
  authenticateToken,
  // canViewSocieties(), // Commented out for now
  societyQueryValidation,
  validateRequest,
  getSocietyRegistrations
);

// NCD payload preview (must be before /:id to avoid "ncd-payload" as id)
router.get('/:id/ncd-payload',
  authenticateToken,
  societyIdValidation,
  validateRequest,
  getNcdPayloadController
);

// Upload society to NCD API (must be before /:id)
router.post('/:id/ncd-upload',
  authenticateToken,
  societyIdValidation,
  validateRequest,
  uploadToNcdController
);

// Get society registration by ID - Only users with view permission
router.get('/:id', 
  authenticateToken,
  // canViewSocieties(), // Commented out for now
  societyIdValidation,
  validateRequest,
  getSocietyRegistrationByIdController
);

// Get society by user ID - Only users with view permission
router.get('/user/:userId', 
  authenticateToken,
  // canViewSocieties(), // Commented out for now
  userIdValidation,
  validateRequest,
  getSocietyByUserIdController
);

// Create new society registration - Only users with create permission
router.post('/', 
  authenticateToken,
  // canManageSocieties(), // Commented out for now
  societyRegistrationValidation,
  validateRequest,
  createSocietyRegistrationController
);

// Save cooperative sector form (additional_data) without submit/resubmit
router.put('/:id/additional-data',
  authenticateToken,
  // canEditSocieties(), // Commented out for now
  societyIdValidation,
  updateSocietyAdditionalDataValidation,
  validateRequest,
  updateSocietyAdditionalDataController
);

// Update society registration - Only users with edit permission
router.put('/:id', 
  authenticateToken,
  // canEditSocieties(), // Commented out for now
  societyIdValidation,
  updateSocietyRegistrationValidation,
  validateRequest, 
  updateSocietyRegistrationController
);

// Delete society registration - Only users with delete permission
router.delete('/:id', 
  authenticateToken,
  // canDeleteSocieties(), // Commented out for now
  societyIdValidation,
  validateRequest,
  deleteSocietyRegistrationController
);

// Upload challan for society registration - Only users with edit permission
router.post('/:id/challan', 
  authenticateToken,
  // canEditSocieties(), // Commented out for now
  societyIdValidation, 
  validateRequest, 
  upload.single('challan'),
  uploadChallanController
);

// Issue certificate for society registration - Only users with approve permission
router.post('/:id/issue-certificate', 
  authenticateToken,
  societyIdValidation,
  validateRequest, 
  issueCertificateController
);

export default router; 