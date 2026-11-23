  import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import { requireAdminRole } from '../../middleware/rbac';
import {
  getModuleWorkflows,
  getModuleWorkflowById,
  getWorkflowsByModule,
  createModuleWorkflow,
  updateModuleWorkflow,
  deleteModuleWorkflow,
  toggleModuleWorkflowStatus
} from '../../controllers/moduleWorkflowController';
import {
  moduleWorkflowValidation,
  updateModuleWorkflowValidation,
  moduleWorkflowIdValidation,
  moduleIdValidation,
  moduleWorkflowQueryValidation,
  toggleStatusValidation
} from '../../validations/moduleWorkflow';

const router = Router();

// Get all module workflows - Available to all authenticated users
router.get('/',
  authenticateToken,
  moduleWorkflowQueryValidation,
  validateRequest,
  getModuleWorkflows
);

// Get workflows by module ID - Available to all authenticated users
router.get('/module/:module_id',
  authenticateToken,
  moduleIdValidation,
  validateRequest,
  getWorkflowsByModule
);

// Get module workflow by ID - Available to all authenticated users
router.get('/:id',
  authenticateToken,
  moduleWorkflowIdValidation,
  validateRequest,
  getModuleWorkflowById
);

// Create new module workflow - Admin only
router.post('/',
  authenticateToken,
  requireAdminRole(),
  moduleWorkflowValidation,
  validateRequest,
  createModuleWorkflow
);

// Update module workflow - Admin only
router.put('/:id',
  authenticateToken,
  requireAdminRole(),
  moduleWorkflowIdValidation,
  updateModuleWorkflowValidation,
  validateRequest,
  updateModuleWorkflow
);

// Toggle module workflow status - Admin only
router.patch('/:id/status',
  authenticateToken,
  requireAdminRole(),
  moduleWorkflowIdValidation,
  toggleStatusValidation,
  validateRequest,
  toggleModuleWorkflowStatus
);

// Delete module workflow - Admin only
router.delete('/:id',
  authenticateToken,
  requireAdminRole(),
  moduleWorkflowIdValidation,
  validateRequest,
  deleteModuleWorkflow
);

export default router;
