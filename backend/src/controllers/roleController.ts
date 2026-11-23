
import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import { returnResponse } from "../utils/response";
import { Request, Response } from "express";
import { IAuthRequest } from "../types";
import { getAllRoles, findRoleById, createRole as createRoleService, updateRole as updateRoleService, deleteRole as deleteRoleService } from "../services/RoleService";
import { Op } from "sequelize";

export const getRoles = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const search = req.query.search as string;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

    const result = await getAllRoles(page, limit, search, isActive);
    const pagination = {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasNext: result.page < result.totalPages,
      hasPrev: result.page > 1
    }

    returnResponse(res).ok('Roles retrieved successfully', {
      roles: result.roles ?? [],
      pagination: pagination,
    });
  } catch (error) {
    logger.error('Get roles error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get roles', 500);
  }
};

export const getRoleById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const role = await findRoleById(id);

    if (!role) {
      throw new AppError('Role not found', 404);
    }

    returnResponse(res).ok('Role retrieved successfully', role);
  } catch (error) {
    logger.error('Get role error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get role', 500);
  }
};

export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const newRole = await createRoleService({ name, description }, req);

    returnResponse(res).ok('Role created successfully', newRole);
  } catch (error) {
    logger.error('Create role error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to create role', 500);
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, description } = req.body;

    const updatedRole = await updateRoleService(id, { name, description }, req);

    if (!updatedRole) {
      throw new AppError('Role not found', 404);
    }

    returnResponse(res).ok('Role updated successfully', updatedRole);
  } catch (error) {
    logger.error('Update role error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update role', 500);
  }
};

export const deleteRole = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await deleteRoleService(id, req);

    returnResponse(res).ok('Role deleted successfully', null);
  } catch (error) {
    logger.error('Delete role error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete role', 500);
  }
}; 