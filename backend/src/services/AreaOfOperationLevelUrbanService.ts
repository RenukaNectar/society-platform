import { Op } from 'sequelize';
import AreaOfOperationLevelUrban from '../models/AreaOfOperationLevelUrban';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';

export const getAllAreaOfOperationLevelUrbans = async (page: number = 1, limit: number = 10, search?: string) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { society_id: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await AreaOfOperationLevelUrban.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['id', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      areaOfOperationLevelUrbans: rows,
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
    logger.error('Error in getAllAreaOfOperationLevelUrbans:', error);
    throw new AppError('Failed to fetch area of operation level urbans', 500);
  }
};

export const getAreaOfOperationLevelUrbanById = async (id: number) => {
  try {
    const areaOfOperationLevelUrban = await AreaOfOperationLevelUrban.findByPk(id);
    if (!areaOfOperationLevelUrban) {
      throw new AppError('Area of operation level urban not found', 404);
    }
    return areaOfOperationLevelUrban;
  } catch (error) {
    logger.error('Error in getAreaOfOperationLevelUrbanById:', error);
    throw error;
  }
};

export const getAreaOfOperationLevelUrbansBySocietyId = async (societyId: string) => {
  try {
    const areaOfOperationLevelUrbans = await AreaOfOperationLevelUrban.findAll({
      where: { society_id: societyId },
      order: [['id', 'DESC']]
    });
    return areaOfOperationLevelUrbans;
  } catch (error) {
    logger.error('Error in getAreaOfOperationLevelUrbansBySocietyId:', error);
    throw new AppError('Failed to fetch area of operation level urbans by society ID', 500);
  }
};

export const createAreaOfOperationLevelUrban = async (data: { society_id?: string; area_of_operation_id?: number; state_code?: number; district_code?: number; local_body_type_code?: number; local_body_code?: number; locality_ward_code?: number }, req?: IAuthRequest) => {
  try {
    const createData = {
      ...data,
      created_by: req?.user?.userId || null,
      updated_by: req?.user?.userId || null
    };
    const areaOfOperationLevelUrban = await AreaOfOperationLevelUrban.create(createData);
    return areaOfOperationLevelUrban;
  } catch (error) {
    logger.error('Error in createAreaOfOperationLevelUrban:', error);
    throw new AppError('Failed to create area of operation level urban', 500);
  }
};

export const updateAreaOfOperationLevelUrban = async (id: number, data: { society_id?: string; area_of_operation_id?: number; state_code?: number; district_code?: number; local_body_type_code?: number; local_body_code?: number; locality_ward_code?: number }, req?: IAuthRequest) => {
  try {
    const areaOfOperationLevelUrban = await AreaOfOperationLevelUrban.findByPk(id);
    if (!areaOfOperationLevelUrban) {
      throw new AppError('Area of operation level urban not found', 404);
    }

    const updateData = {
      ...data,
      updated_by: req?.user?.userId || null
    };
    await areaOfOperationLevelUrban.update(updateData);
    return areaOfOperationLevelUrban;
  } catch (error) {
    logger.error('Error in updateAreaOfOperationLevelUrban:', error);
    throw error;
  }
};

export const deleteAreaOfOperationLevelUrban = async (id: number) => {
  try {
    const areaOfOperationLevelUrban = await AreaOfOperationLevelUrban.findByPk(id);
    if (!areaOfOperationLevelUrban) {
      throw new AppError('Area of operation level urban not found', 404);
    }

    await areaOfOperationLevelUrban.destroy();
    return { message: 'Area of operation level urban deleted successfully' };
  } catch (error) {
    logger.error('Error in deleteAreaOfOperationLevelUrban:', error);
    throw error;
  }
}; 