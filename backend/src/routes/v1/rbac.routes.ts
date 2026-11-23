import { createPermission, getRolePermissions, assignPermissionToRole, deletePermissionFromRole } from "../../controllers/rbac.controller";
import { IAuthRequest } from "../../types";
import { returnResponse } from "../../utils/response";
import { NextFunction, Response, Router } from "express";

const router = Router();

const authenticateAdmin = (req: IAuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (user?.role !== 'admin') {
        returnResponse(res).error('Forbidden', 403);
    }
    next();
}

router.get('/:roleId/permissions', getRolePermissions);
router.post('/permissions', authenticateAdmin, createPermission);
router.put('/:roleId/permissions/:permissionId', authenticateAdmin, assignPermissionToRole);
router.delete('/:roleId/permissions/:permissionId', authenticateAdmin, deletePermissionFromRole);

export default router;