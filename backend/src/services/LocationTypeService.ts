import { Op } from 'sequelize';
import LocationType from '../models/LocationType';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export const getAllLocationTypes = async (page: number = 1, limit: number = 10, search?: string) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await LocationType.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      locationTypes: rows,
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
    logger.error('Failed to get location types:', error);
    throw new AppError('Failed to get location types', 500);
  }
};

export const getLocationTypeById = async (id: string) => {
  try {
    const locationType = await LocationType.findByPk(id);
    if (!locationType) {
      throw new AppError('Location type not found', 404);
    }
    return locationType ? locationType?.toJSON() : null;
  } catch (error) {
    logger.error('Failed to get location type by ID:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get location type', 500);
  }
};

export const createLocationType = async (data: any) => {
  try {
    const locationType = await LocationType.create(data);
    return locationType;
  } catch (error) {
    logger.error('Failed to create location type:', error);
    throw new AppError('Failed to create location type', 500);
  }
};

export const updateLocationType = async (id: string, data: any) => {
  try {
    const locationType = await LocationType.findByPk(id);
    if (!locationType) {
      throw new AppError('Location type not found', 404);
    }
    await locationType.update(data);
    return locationType;
  } catch (error) {
    logger.error('Failed to update location type:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update location type', 500);
  }
};

export const deleteLocationType = async (id: string) => {
  try {
    const locationType = await LocationType.findByPk(id);
    if (!locationType) {
      throw new AppError('Location type not found', 404);
    }
    await locationType.destroy();
    return locationType;
  } catch (error) {
    logger.error('Failed to delete location type:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete location type', 500);
  }
};