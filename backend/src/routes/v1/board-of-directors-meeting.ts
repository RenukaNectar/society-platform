import express from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import {
  createBodMeetingController,
  getAllBodMeetingsController,
  getBodMeetingByIdController
} from '../../controllers/bodMeetingController';
import {
  createBodMeetingValidation,
  getBodMeetingsValidation,
  getBodMeetingByIdValidation
} from '../../validations/bodMeeting';
import { registerEntityHistoryRoute } from './registerEntityHistoryRoute';

const router = express.Router();

router.post('/', authenticateToken, createBodMeetingValidation, validateRequest, createBodMeetingController);
router.get('/', authenticateToken, getBodMeetingsValidation, validateRequest, getAllBodMeetingsController);
registerEntityHistoryRoute(router, { historyResources: ['BOD'] });
router.get('/:id', authenticateToken, getBodMeetingByIdValidation, validateRequest, getBodMeetingByIdController);

export default router;
