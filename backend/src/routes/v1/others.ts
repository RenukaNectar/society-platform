import { getStatusesController } from '../../controllers/statusController';
import { getRoles } from '../../controllers/roleController';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Router } from "express";
import { getApplicationsDataByRoleController, getDistrictWiseSocietyGraphController } from '../../controllers/DashboardController';
import { districtSocietyGraphValidation } from '../../validations/masterData';
import { getAuditorsController, createAuditorController, updateAuditorController, deleteAuditorController, getAuditorByIdController } from '../../controllers/AuditorController';
import { createAuditorValidation, updateAuditorValidation, getAuditorByIdValidation, deleteAuditorValidation } from '../../validations/auditor';
import { getAllRoles } from '../../services/RoleService';
import { IAuthRequest } from '../../types';
import { Response, NextFunction } from 'express';
import { findUserById } from '../../services/UserService';
import { AppError } from '../../utils/errors';

const router = Router();

// Middleware: allow access for any role from roles table except applicant (resolved at request time)
const requireGraphRole = async (req: IAuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    const user = await findUserById(req.user.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (!user.is_active) {
      throw new AppError('Account is deactivated', 401);
    }
    const { roles } = await getAllRoles(1, 500, undefined, true);
    const allowedRoles = roles
      .filter((r) => r.name.toLowerCase() !== 'applicant')
      .map((r) => r.name.toLowerCase());
    if (!user.role || !allowedRoles.includes(user.role.name.toLowerCase())) {
      throw new AppError('Insufficient role permissions', 403);
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Get all roles
router.get('/roles',
    validateRequest,
    getRoles
);

// Get all statuses
router.get('/statuses',
    validateRequest,
    getStatusesController
);

// Get status count
router.get('/status-count', 
    authenticateToken,
    validateRequest,
    getApplicationsDataByRoleController
);

// Get district-wise society graph data (roles from roles table except applicant)
router.get('/graph',
    authenticateToken,
    requireGraphRole,
    validateRequest,
    districtSocietyGraphValidation,
    getDistrictWiseSocietyGraphController
);

router.get('/auditors', 
    validateRequest,
    getAuditorsController
);

const requireAuditorAdmin = requireRole(['admin', 'system_admin', 'superadmin']);

router.post('/auditors', 
    requireAuditorAdmin,
    validateRequest,
    createAuditorValidation,
    validateRequest,
    createAuditorController
);

router.put('/auditors/:id', 
    requireAuditorAdmin,
    validateRequest,
    updateAuditorValidation,
    validateRequest,
    updateAuditorController
);

router.delete('/auditors/:id', 
    requireAuditorAdmin,
    validateRequest,
    deleteAuditorValidation,
    validateRequest,
    deleteAuditorController
);

router.get('/auditors/:id', 
    validateRequest,
    getAuditorByIdValidation,
    validateRequest,
    getAuditorByIdController
);



export default router;
