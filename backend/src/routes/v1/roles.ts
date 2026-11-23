import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import { requireAdminRole } from '../../middleware/rbac';
import { 
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
} from '../../controllers/roleController';
import { 
  roleValidation,
  roleIdValidation,
  roleQueryValidation
} from '../../validations/role';

const router = Router();

// Get all roles - Only admin users can access
router.get('/', 
  authenticateToken,
  requireAdminRole(),
  roleQueryValidation,
  validateRequest,
  getRoles
);

// Get role by ID - Only admin users can access
router.get('/:id', 
  authenticateToken,
  requireAdminRole(),
  roleIdValidation,
  validateRequest,
  getRoleById
);

// Create new role - Only admin users can access
router.post('/', 
  authenticateToken,
  requireAdminRole(),
  roleValidation,
  validateRequest,
  createRole
);

// Update role - Only admin users can access
router.put('/:id', 
  authenticateToken,
  requireAdminRole(),
  roleIdValidation,
  roleValidation,
  validateRequest,
  updateRole
);

// Delete role - Only admin users can access
router.delete('/:id', 
  authenticateToken,
  requireAdminRole(),
  roleIdValidation,
  validateRequest,
  deleteRole
);

export default router; 