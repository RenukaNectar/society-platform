import { Op } from 'sequelize';
import WaterBodyType from '../models/WaterBodyType';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';

export const getAllWaterBodyTypes = async (page: number = 1, limit: number = 10, search?: string) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { water_body_types_hindi: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await WaterBodyType.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      waterBodyTypes: rows,
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
    logger.error('Error in getAllWaterBodyTypes:', error);
    throw new AppError('Failed to fetch water body types', 500);
  }
};

export const getWaterBodyTypeById = async (id: number) => {
  try {
    const waterBodyType = await WaterBodyType.findByPk(id);
    if (!waterBodyType) {
      throw new AppError('Water body type not found', 404);
    }
    return waterBodyType ? waterBodyType?.toJSON() : null;
  } catch (error) {
    logger.error('Error in getWaterBodyTypeById:', error);
    throw error;
  }
};

export const createWaterBodyType = async (data: { name?: string; water_body_types_hindi?: string }, req?: IAuthRequest) => {
  try {
    const createData = {
      ...data,
      created_by: req?.user?.userId || null,
      updated_by: req?.user?.userId || null
    };
    const waterBodyType = await WaterBodyType.create(createData);
    return waterBodyType;
  } catch (error) {
    logger.error('Error in createWaterBodyType:', error);
    throw new AppError('Failed to create water body type', 500);
  }
};

export const updateWaterBodyType = async (id: number, data: { name?: string; water_body_types_hindi?: string }, req?: IAuthRequest) => {
  try {
    const waterBodyType = await WaterBodyType.findByPk(id);
    if (!waterBodyType) {
      throw new AppError('Water body type not found', 404);
    }

    const updateData = {
      ...data,
      updated_by: req?.user?.userId || null
    };
    await waterBodyType.update(updateData);
    return waterBodyType;
  } catch (error) {
    logger.error('Error in updateWaterBodyType:', error);
    throw error;
  }
};

export const deleteWaterBodyType = async (id: number) => {
  try {
    const waterBodyType = await WaterBodyType.findByPk(id);
    if (!waterBodyType) {
      throw new AppError('Water body type not found', 404);
    }

    await waterBodyType.destroy();
    return { message: 'Water body type deleted successfully' };
  } catch (error) {
    logger.error('Error in deleteWaterBodyType:', error);
    throw error;
  }
}; 