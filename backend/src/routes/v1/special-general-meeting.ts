import express from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import { createSpecialBoradMeetingController, getAllSpecialBoradMeetingsController, getByIdSpecialBoradMeetingController } from '../../controllers/SpecialBoradMeetingController';
import { registerEntityHistoryRoute } from './registerEntityHistoryRoute';
import { createSpecialGeneralMeetingValidation } from '../../validations/specialGeneralMeeting';

const router = express.Router();

// Special Board Meeting routes - Only users with dashboard view permission
router.post('/', authenticateToken, createSpecialGeneralMeetingValidation, validateRequest, createSpecialBoradMeetingController);
router.get('/', authenticateToken, validateRequest, getAllSpecialBoradMeetingsController);
registerEntityHistoryRoute(router, { historyResources: ['SGBM'] });
router.get('/:id', authenticateToken, validateRequest, getByIdSpecialBoradMeetingController);

export default router;