import { Router } from 'express';
import { validateRequest } from '../../middleware/auth';
import { 
  getMembers,
  getMemberByIdController,
  getMembersBySocietyIdController,
  createMemberController,
  createMultipleMembersController,
  updateMemberController,
  deleteMemberController,
  deleteMembersBySocietyIdController,
  getBodMembersController,
  sendBodOtpController,
  verifyBodOtpController
} from '../../controllers/memberController';
import { 
  createMemberValidation,
  updateMemberValidation,
  memberIdValidation,
  getMembersBySocietyIdValidation,
  getMembersValidation,
  createMultipleMembersValidation,
  getBodMembersValidation,
  sendBodOtpValidation,
  verifyBodOtpValidation
} from '../../validations/member';

const router = Router();

// Get all members
router.get('/', 
  getMembersValidation,
  validateRequest,
  getMembers
);

// Get member by ID
router.get('/:id', 
  memberIdValidation,
  validateRequest,
  getMemberByIdController
);

// Get members by society ID
router.get('/society/:societyId', 
  getMembersBySocietyIdValidation,
  validateRequest,
  getMembersBySocietyIdController
);

// Create new member
router.post('/', 
  createMemberValidation,
  validateRequest,
  createMemberController
);

// Create multiple members
router.post('/bulk', 
  createMultipleMembersValidation,
  validateRequest,
  createMultipleMembersController
);

// Update member
router.put('/:id', 
  memberIdValidation,
  updateMemberValidation,
  validateRequest,
  updateMemberController
);

// Delete member
router.delete('/:id', 
  memberIdValidation,
  validateRequest,
  deleteMemberController
);

// Delete members by society ID
router.delete('/society/:societyId', 
  getMembersBySocietyIdValidation,
  validateRequest,
  deleteMembersBySocietyIdController
);

router.get('/bod/:society_id',
  getBodMembersValidation,
  validateRequest,
  getBodMembersController
);

router.post('/bod/send-otp', 
  sendBodOtpValidation,
  validateRequest,
  sendBodOtpController
)

router.post('/bod/verify-otp', 
  verifyBodOtpValidation,
  validateRequest,
  verifyBodOtpController
)

export default router; 