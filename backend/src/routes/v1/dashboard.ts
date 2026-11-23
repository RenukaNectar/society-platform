import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { canViewDashboard } from '../../middleware/rbac';
import { getApplicationsDataByRoleController, testDatabaseController, getAvailableStatusesController } from '../../controllers/DashboardController';
import { create } from 'domain';

const router = Router();

// Dashboard routes - Only users with dashboard view permission
router.get('/test-db', authenticateToken, canViewDashboard(), testDatabaseController);
router.get('/available-statuses', authenticateToken, canViewDashboard(), getAvailableStatusesController);

export default router;
