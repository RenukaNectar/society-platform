import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import { requireAdminRole } from '../../middleware/rbac';
import {
  getAdminDashboard,
  getAdminLogs,
  restartSystem,
  getSystemHealth,
  createBackup,
  syncCooperativesStatesController,
  syncCooperativesDistrictsController,
  syncCooperativesGpVillagesController,
  syncCooperativesBlocksController,
  syncCooperativesUrbanLocalBodiesController,
  syncCooperativesUrbanLocalBodiesWardsController,
  applyArunachalRuralDistrictRemapController,
  syncNcdSocietiesController
} from '../../controllers/adminController';

const router = Router();

// Admin routes - Only admin users can access
router.get('/dashboard', authenticateToken, requireAdminRole(), getAdminDashboard);
router.get('/logs', authenticateToken, requireAdminRole(), getAdminLogs);
router.post('/system/restart', authenticateToken, requireAdminRole(), restartSystem);
router.get('/system/health', authenticateToken, requireAdminRole(), getSystemHealth);
router.post('/backup', authenticateToken, requireAdminRole(), validateRequest, createBackup);
router.post(
  '/sync/cooperatives-states',
  authenticateToken,
  requireAdminRole(),
  syncCooperativesStatesController
);
router.post(
  '/sync/cooperatives-districts',
  authenticateToken,
  requireAdminRole(),
  syncCooperativesDistrictsController
);
router.post(
  '/sync/arunachal-rural-district-remap',
  authenticateToken,
  requireAdminRole(),
  applyArunachalRuralDistrictRemapController
);
router.post(
  '/sync/cooperatives-gp-villages',
  authenticateToken,
  requireAdminRole(),
  syncCooperativesGpVillagesController
);
router.post(
  '/sync/cooperatives-blocks',
  authenticateToken,
  requireAdminRole(),
  syncCooperativesBlocksController
);
router.post(
  '/sync/cooperatives-ulb',
  authenticateToken,
  requireAdminRole(),
  syncCooperativesUrbanLocalBodiesController
);
router.post(
  '/sync/cooperatives-ulb-wards',
  authenticateToken,
  requireAdminRole(),
  syncCooperativesUrbanLocalBodiesWardsController
);
router.post(
  '/sync/ncd-societies',
  authenticateToken,
  requireAdminRole(),
  syncNcdSocietiesController
);

export default router; 