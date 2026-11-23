import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import { Request, Response } from "express";
import { returnResponse } from "../utils/response";
import Permission from "../models/Permission";
import RolePermission from "../models/RolePermission";
import { Op } from "sequelize";

export const getPermissions = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string)?.trim();
    const resource = (req.query.resource as string)?.trim();

    const where: any = {};
    if (resource) {
      where.resource = resource;
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { resource: { [Op.like]: `%${search}%` } },
        { action: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { count, rows: permissions } = await Permission.findAndCountAll({
      where,
      limit,
      offset,
      order: [["created_at", "DESC"]],
      attributes: ["id", "name", "description", "resource", "action", "is_active", "created_at"],
    });

    const total = count;
    const totalPages = Math.ceil(total / limit) || 0;

    returnResponse(res).ok("Permissions retrieved successfully", {
      permissions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error("Failed to get permissions:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Internal server error", 500);
  }
};

export const getPermissionById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as any;
    // TODO: Implement permission service
    const permission = null;

    if (!permission) {
      throw new AppError('Permission not found', 404);
    }

    returnResponse(res).ok('Permission retrieved successfully', permission);
  } catch (error) {
    logger.error('Failed to get permission:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const createPermission = async (req: Request, res: Response) => {
  try {
    const permissionData = req.body;
    // TODO: Implement permission service
    const newPermission = null;

    returnResponse(res).ok('Permission created successfully', newPermission);
  } catch (error) {
    logger.error('Failed to create permission:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const updatePermission = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as any;
    const updateData = req.body;
    
    // TODO: Implement permission service
    const updatedPermission = null;

    if (!updatedPermission) {
      throw new AppError('Permission not found', 404);
    }

    returnResponse(res).ok('Permission updated successfully', updatedPermission);
  } catch (error) {
    logger.error('Failed to update permission:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const deletePermission = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const permission = await Permission.findByPk(id);
    if (!permission) {
      throw new AppError('Permission not found', 404);
    }
    await RolePermission.destroy({ where: { permission_id: id } });
    await permission.destroy();
    returnResponse(res).ok('Permission deleted successfully', null);
  } catch (error) {
    logger.error('Failed to delete permission:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const togglePermissionStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as any;
    const isActive = req.body.isActive as boolean;
    
    if (typeof isActive !== 'boolean') {
      throw new AppError('isActive must be a boolean value', 400);
    }

    // TODO: Implement permission service
    const updatedPermission = null;

    if (!updatedPermission) {
      throw new AppError('Permission not found', 404);
    }

    returnResponse(res).ok('Permission status toggled successfully', updatedPermission);
  } catch (error) {
    logger.error('Failed to toggle permission status:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};