import { Op } from 'sequelize';
import AreaOfOperationLevel from '../models/AreaOfOperationLevel';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';

export const getAllAreaOfOperationLevels = async (page: number = 1, limit: number = 10, search?: string) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      whereClause[Op.or] = [
        { name: { [Op.like]: term } },
        { description: { [Op.like]: term } },
        { level_type: { [Op.like]: term } }
      ];
    }

    const { count, rows } = await AreaOfOperationLevel.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['id', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      areaOfOperationLevels: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    logger.error('Error in getAllAreaOfOperationLevels:', error);
    throw new AppError('Failed to fetch area of operation levels', 500);
  }
};

/**
 * Load one row from area_of_operation_levels by primary key (UUID).
 * Same value as society_registrations.area_of_operation_id when that FK is set.
 */
export const getAreaOfOperationLevelById = async (
  id: string | number | null | undefined
) => {
  try {
    const normalizedId =
      id != null && String(id).trim() !== '' ? String(id).trim() : '';
    if (!normalizedId) {
      return null;
    }

    const areaOfOperationLevel = await AreaOfOperationLevel.findByPk(normalizedId);
    if (!areaOfOperationLevel) {
      throw new AppError('Area of operation level not found', 404);
    }
    return areaOfOperationLevel.toJSON();
  } catch (error) {
    logger.error('Error in getAreaOfOperationLevelById:', error);
    throw error;
  }
};

/** Alias: resolve level from society_registrations.area_of_operation_id. */
export const getAreaOfOperationLevelByAreaOfOperationId = async (
  areaOfOperationId: string | null | undefined
) => getAreaOfOperationLevelById(areaOfOperationId);

export const getAreaOfOperationLevelsBySocietyId = async (societyId: string) => {
  try {
    const areaOfOperationLevels = await AreaOfOperationLevel.findAll({
      where: { society_id: societyId },
      order: [['id', 'DESC']]
    });
    return areaOfOperationLevels;
  } catch (error) {
    logger.error('Error in getAreaOfOperationLevelsBySocietyId:', error);
    throw new AppError('Failed to fetch area of operation levels by society ID', 500);
  }
};

export const createAreaOfOperationLevel = async (data: { area_of_operation_id?: number; state_code?: number; district_code?: number; block_code?: number; panchayat_code?: number; village_code?: number; gp_village_all?: boolean; society_id?: string }, req?: IAuthRequest) => {
  try {
    const createData = {
      ...data,
      created_by: req?.user?.userId || null,
      updated_by: req?.user?.userId || null
    };
    const areaOfOperationLevel = await AreaOfOperationLevel.create(createData);
    return areaOfOperationLevel;
  } catch (error) {
    logger.error('Error in createAreaOfOperationLevel:', error);
    throw new AppError('Failed to create area of operation level', 500);
  }
};

export const updateAreaOfOperationLevel = async (id: number, data: { area_of_operation_id?: number; state_code?: number; district_code?: number; block_code?: number; panchayat_code?: number; village_code?: number; gp_village_all?: boolean; society_id?: string }, req?: IAuthRequest) => {
  try {
    const areaOfOperationLevel = await AreaOfOperationLevel.findByPk(id);
    if (!areaOfOperationLevel) {
      throw new AppError('Area of operation level not found', 404);
    }

    const updateData: any = {
      ...data,
      updated_by: req?.user?.userId || null
    };
    await areaOfOperationLevel.update(updateData);
    return areaOfOperationLevel;
  } catch (error) {
    logger.error('Error in updateAreaOfOperationLevel:', error);
    throw error;
  }
};

export const deleteAreaOfOperationLevel = async (id: number) => {
  try {
    const areaOfOperationLevel = await AreaOfOperationLevel.findByPk(id);
    if (!areaOfOperationLevel) {
      throw new AppError('Area of operation level not found', 404);
    }

    await areaOfOperationLevel.destroy();
    return { message: 'Area of operation level deleted successfully' };
  } catch (error) {
    logger.error('Error in deleteAreaOfOperationLevel:', error);
    throw error;
  }
}; 