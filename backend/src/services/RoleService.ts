import { Op } from 'sequelize';
import Role from '../models/Role';
import Permission from '../models/Permission';
import { IRole, IRoleCreate, IRoleUpdate } from '../types';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';
import { createActivity } from './ActiviesService';

// Create role
export const createRole = async (roleData: IRoleCreate, req?: IAuthRequest): Promise<IRole> => {
  try {
    const role = await Role.create(roleData as any);
    logger.info('Role created successfully', { roleId: role.id });
    
    // Log activity
    try {
      await createActivity({
        title: 'Role Created',
        description: `New role "${roleData.name}" created successfully`,
        data: {
          role_id: role.id,
          role_name: roleData.name,
          role_description: roleData.description,
          created_by: req?.user?.userId || 'system'
        },
        reference_id: role.id,
        created_by: req?.user?.userId || 'system'
      });
    } catch (activityError) {
      logger.error('Failed to log role creation activity:', activityError);
    }
    
    return role.toJSON();
  } catch (error) {
    logger.error('Failed to create role:', error);
    throw new AppError('Failed to create role', 500);
  }
}

// Find role by ID
export const findRoleById = async (id: string): Promise<IRole | null> => {
  try {
    const role = await Role.findOne({
      where: { id, is_active: true },
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'description', 'resource', 'action'],
          through: { attributes: [] }
        }
      ]
    });
    return role ? role.toJSON() : null;
  } catch (error) {
    logger.error('Failed to find role by ID:', error);
    throw new AppError('Failed to find role', 500);
  }
}

// Find role by name
export const findRoleByName = async (name: string): Promise<IRole | null> => {
  try {
    const role = await Role.findOne({
      where: { name },
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'description', 'resource', 'action'],
          through: { attributes: [] }
        }
      ]
    });
    return role ? role.toJSON() : null;
  } catch (error) {
    logger.error('Failed to find role by name:', error);
    throw new AppError('Failed to find role', 500);
  }
}

// Find role by ID or name
export const findRoleByIdOrName = async (identifier: string): Promise<IRole | null> => {
  try {
    const role = await Role.findOne({
      where: {
        name: identifier,
        is_active: true
      }
    });
    return role ? role.toJSON() : null;
  } catch (error) {
    logger.error('Failed to find role by ID or name:', error);
    throw new AppError('Failed to find role', 500);
  }
}

// Update role
export const updateRole = async (id: string, updateData: Partial<IRoleUpdate>, req?: IAuthRequest): Promise<IRole> => {
  try {
    const role = await Role.findByPk(id);
    if (!role) {
      throw new AppError('Role not found', 404);
    }

    await role.update(updateData);

    const updatedRole = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'description', 'resource', 'action'],
          through: { attributes: [] }
        }
      ]
    });

    logger.info('Role updated successfully', { roleId: id });
    
    // Log activity
    try {
      await createActivity({
        title: 'Role Updated',
        description: `Role "${role.name}" updated successfully`,
        data: {
          role_id: role.id,
          role_name: role.name,
          updated_fields: Object.keys(updateData),
          updated_by: req?.user?.userId || 'system'
        },
        reference_id: role.id,
        created_by: req?.user?.userId || 'system'
      });
    } catch (activityError) {
      logger.error('Failed to log role update activity:', activityError);
    }
    
    return updatedRole!.toJSON();
  } catch (error) {
    logger.error('Failed to update role:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update role', 500);
  }
}

// Delete role
export const deleteRole = async (id: string, req?: IAuthRequest): Promise<void> => {
  try {
    const role = await Role.findByPk(id);
    if (!role) {
      throw new AppError('Role not found', 404);
    }

    await role.destroy();
    logger.info('Role deleted successfully', { roleId: id });
    
    // Log activity
    try {
      await createActivity({
        title: 'Role Deleted',
        description: `Role "${role.name}" deleted successfully`,
        data: {
          role_id: role.id,
          role_name: role.name,
          role_description: role.description,
          deleted_by: req?.user?.userId || 'system'
        },
        reference_id: role.id,
        created_by: req?.user?.userId || 'system'
      });
    } catch (activityError) {
      logger.error('Failed to log role deletion activity:', activityError);
    }
  } catch (error) {
    logger.error('Failed to delete role:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete role', 500);
  }
}

// Get all roles with pagination
export const getAllRoles = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  isActive?: boolean
): Promise<{
  roles: IRole[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    const whereConditions: any = {};

    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    if (isActive !== undefined) {
      whereConditions.is_active = isActive;
    }

    const { count, rows } = await Role.findAndCountAll({
      where: whereConditions,
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    });

    return {
      roles: rows.map(role => role.toJSON()),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  } catch (error) {
    logger.error('Failed to get roles:', error);
    throw new AppError('Failed to get roles', 500);
  }
}

// Toggle role status
export const toggleRoleStatus = async (id: string, isActive: boolean, req?: IAuthRequest): Promise<IRole> => {
  try {
    const role = await Role.findByPk(id);
    if (!role) {
      throw new AppError('Role not found', 404);
    }

    const updateData: any = {
      is_active: isActive,
      updated_by: req?.user?.userId || null
    };
    await role.update(updateData);

    const updatedRole = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'description', 'resource', 'action'],
          through: { attributes: [] }
        }
      ]
    });

    logger.info(`Role ${isActive ? 'activated' : 'deactivated'} successfully`, { roleId: id });
    return updatedRole!.toJSON();
  } catch (error) {
    logger.error('Failed to toggle role status:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to toggle role status', 500);
  }
}

// Get role statistics
export const getRoleStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
}> => {
  try {
    const total = await Role.count();
    const active = await Role.count({ where: { is_active: true } });
    const inactive = await Role.count({ where: { is_active: false } });

    return {
      total,
      active,
      inactive
    };
  } catch (error) {
    logger.error('Failed to get role stats:', error);
    throw new AppError('Failed to get role statistics', 500);
  }
};
