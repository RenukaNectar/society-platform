import express from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import { canViewDashboard } from '../../middleware/rbac';
import { createAnnualGeneralMeetingController, getAllAnnualGeneralMeetingsController, getAnnualGeneralMeetingByIdController, getAgmCalendarYearEligibilityController, resubmitAnnualGeneralMeetingController } from '../../controllers/annualGeneral';
import { 
    createAnnualGeneralMeetingValidation, 
    getAnnualGeneralMeetingsValidation, 
    getAnnualGeneralMeetingByIdValidation,
    getAgmCalendarYearEligibilityValidation,
    resubmitAnnualGeneralMeetingValidation
} from '../../validations/annualGeneralMeeting';
import { registerEntityHistoryRoute } from './registerEntityHistoryRoute';

const router = express.Router();


// Annual General Meeting routes - Only users with dashboard view permission
router.post('/', authenticateToken, createAnnualGeneralMeetingValidation, validateRequest, createAnnualGeneralMeetingController);
router.get('/calendar-year-eligibility', authenticateToken, getAgmCalendarYearEligibilityValidation, validateRequest, getAgmCalendarYearEligibilityController);
router.get('/', authenticateToken, getAnnualGeneralMeetingsValidation, validateRequest, getAllAnnualGeneralMeetingsController);
registerEntityHistoryRoute(router, { historyResources: ['AGM'] });
router.post('/:id/resubmit', authenticateToken, resubmitAnnualGeneralMeetingValidation, validateRequest, resubmitAnnualGeneralMeetingController);
router.get('/:id', authenticateToken, getAnnualGeneralMeetingByIdValidation, validateRequest, getAnnualGeneralMeetingByIdController);

export default router;
