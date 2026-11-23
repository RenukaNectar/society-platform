import Permission from "../models/Permission";
import { IAuthRequest } from "../types";
import { returnResponse } from "../utils/response";
import { Response } from "express";
import RolePermission from "../models/RolePermission";
import Role from "../models/Role";

const resources = [
    'dashboard',
    'users',
    'societies',
    'annual-filing',
    'audit',
    'election',
    'appeal',
    'inspection',
    'amendment',
    'my-society',
    'liquidation',
    'renewals',
    'conversion',
    'settings',
    'agm',
    'sgbm',
    'bod',
    'auditors',
    'modules'
]
const actions = [
    'view',
    'create',
    'update',
    'delete',
    'approve',
    'reject',
    'export'
]

export const getRolePermissions = async (req: IAuthRequest, res: Response) => {
    const roleId = req.params.roleId;
    if (!roleId) {
        return returnResponse(res).error("Role ID is required", 400);
    }
    const rolePermissions = await RolePermission.findAll({
        where: { role_id: roleId },
        include: [
            {
                model: Permission,
                as: 'permission'
            },
        ],
    });
    return returnResponse(res).ok("Permissions fetched successfully", rolePermissions?.length ? rolePermissions.map((rp: any) => rp.permission) : []);
};

export const createPermission = async (req: IAuthRequest, res: Response) => {
    const { name, resource, action, description } = req.body;
    if(!name || !resource || !action) {
        return returnResponse(res).error("Name, resource and action are required", 400);
    }
    if(!resources.includes(resource)) {
        return returnResponse(res).error("Invalid resource", 400);
    }
    if(!actions.includes(action)) {
        return returnResponse(res).error("Invalid action", 400);
    }
    const ifExists = await Permission.findOne({ where: { resource: resource.toLowerCase(), action: action.toLowerCase() } });
    if(ifExists) {
        return returnResponse(res).error("Permission already exists", 400);
    }
    const newPermission = await Permission.create({ name: name, resource: resource.toLowerCase(), action: action.toLowerCase(), description, is_active: true, created_by: req.user?.userId });
    return returnResponse(res).ok("Permission created successfully", newPermission);
};

export const assignPermissionToRole = async (req: IAuthRequest, res: Response) => {
    const { roleId, permissionId } = req.params;

    if(!roleId || !permissionId) {
        return returnResponse(res).error("Role ID and permission ID are required", 400);
    }
    const role = await Role.findOne({ where: { id: roleId } });
    if(!role) {
        return returnResponse(res).error("Role not found", 404);
    }
    const permission = await Permission.findOne({ where: { id: permissionId } });
    if(!permission) {
        return returnResponse(res).error("Permission not found", 404);
    }

    const rolePermission = await RolePermission.create({ role_id: roleId, permission_id: permissionId, is_allowed: true, created_by: req.user?.userId });
    return returnResponse(res).ok("Permission assigned to role successfully", rolePermission);
};

export const deletePermissionFromRole = async (req: IAuthRequest, res: Response) => {
    const { roleId, permissionId } = req.params;
    if(!roleId || !permissionId) {
        return returnResponse(res).error("Role ID and permission ID are required", 400);
    }
    const role = await Role.findOne({ where: { id: roleId } });
    if(!role) {
        return returnResponse(res).error("Role not found", 404);
    }
    const permission = await Permission.findOne({ where: { id: permissionId } });
    if(!permission) {
        return returnResponse(res).error("Permission not found", 404);
    }

    const rolePermission = await RolePermission.findOne({ where: { role_id: roleId, permission_id: permissionId } });
    if(!rolePermission) {
        return returnResponse(res).error("Permission not found in role", 404);
    }
    await rolePermission.destroy();
    return returnResponse(res).ok("Permission deleted from role successfully", null);
};