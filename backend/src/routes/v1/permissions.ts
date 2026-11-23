import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import { requireAdminRole } from '../../middleware/rbac';
import { 
  getPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  togglePermissionStatus
} from '../../controllers/permissionController';
import { 
  permissionValidation,
  updatePermissionValidation,
  permissionIdValidation,
  permissionQueryValidation
} from '../../validations/permission';

const router = Router();

// Get all permissions - Only admin users can access
router.get('/', 
  authenticateToken, 
  requireAdminRole(),
  permissionQueryValidation,
  validateRequest,
  getPermissions
);

// Get permission by ID - Only admin users can access
router.get('/:id', 
  authenticateToken, 
  requireAdminRole(),
  permissionIdValidation,
  validateRequest,
  getPermissionById
);

// Create new permission - Only admin users can access
router.post('/', 
  authenticateToken, 
  requireAdminRole(),
  permissionValidation,
  validateRequest,
  createPermission
);

// Update permission - Only admin users can access
router.put('/:id', 
  authenticateToken, 
  requireAdminRole(),
  permissionIdValidation,
  updatePermissionValidation,
  validateRequest,
  updatePermission
);

// Delete permission - Only admin users can access
router.delete('/:id', 
  authenticateToken, 
  requireAdminRole(),
  permissionIdValidation,
  validateRequest,
  deletePermission
);

// Toggle permission status - Only admin users can access
router.patch('/:id/status', 
  authenticateToken, 
  requireAdminRole(),
  permissionIdValidation,
  validateRequest,
  togglePermissionStatus
);

export default router; 