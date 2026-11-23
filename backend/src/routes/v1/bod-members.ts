import express from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import {
  createBodMemberController,
  getBodMembersBySocietyController
} from '../../controllers/bodMemberController';
import {
  createBodMemberValidation,
  getBodMembersBySocietyValidation
} from '../../validations/bodMember';

const router = express.Router();

router.post('/', authenticateToken, createBodMemberValidation, validateRequest, createBodMemberController);
router.get('/society/:societyId', authenticateToken, getBodMembersBySocietyValidation, validateRequest, getBodMembersBySocietyController);

export default router;
