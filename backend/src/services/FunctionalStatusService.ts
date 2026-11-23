import { Op } from 'sequelize';
import FunctionalStatus from '../models/FunctionalStatus';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export const getAllFunctionalStatuses = async (page: number = 1, limit: number = 10, search?: string) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await FunctionalStatus.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      functionalStatuses: rows,
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
    logger.error('Failed to get functional statuses:', error);
    throw new AppError('Failed to get functional statuses', 500);
  }
};

export const getFunctionalStatusById = async (id: string) => {
  try {
    const functionalStatus = await FunctionalStatus.findByPk(id);
    if (!functionalStatus) {
      throw new AppError('Functional status not found', 404);
    }
    return functionalStatus ? functionalStatus?.toJSON() : null;
  } catch (error) {
    logger.error('Failed to get functional status by ID:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get functional status', 500);
  }
};

export const createFunctionalStatus = async (data: any) => {
  try {
    const functionalStatus = await FunctionalStatus.create(data);
    return functionalStatus;
  } catch (error) {
    logger.error('Failed to create functional status:', error);
    throw new AppError('Failed to create functional status', 500);
  }
};

export const updateFunctionalStatus = async (id: string, data: any) => {
  try {
    const functionalStatus = await FunctionalStatus.findByPk(id);
    if (!functionalStatus) {
      throw new AppError('Functional status not found', 404);
    }
    await functionalStatus.update(data);
    return functionalStatus;
  } catch (error) {
    logger.error('Failed to update functional status:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update functional status', 500);
  }
};

export const deleteFunctionalStatus = async (id: string) => {
  try {
    const functionalStatus = await FunctionalStatus.findByPk(id);
    if (!functionalStatus) {
      throw new AppError('Functional status not found', 404);
    }
    await functionalStatus.destroy();
    return functionalStatus;
  } catch (error) {
    logger.error('Failed to delete functional status:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete functional status', 500);
  }
};