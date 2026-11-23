import { Op } from 'sequelize';
import MisappropriationLevel from '../models/MisappropriationLevel';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';

export const getAllMisappropriationLevels = async (page: number = 1, limit: number = 10, search?: string) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await MisappropriationLevel.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      misappropriationLevels: rows,
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
    logger.error('Error in getAllMisappropriationLevels:', error);
    throw new AppError('Failed to fetch misappropriation levels', 500);
  }
};

export const getMisappropriationLevelById = async (id: string) => {
  try {
    const misappropriationLevel = await MisappropriationLevel.findByPk(id);
    if (!misappropriationLevel) {
      throw new AppError('Misappropriation level not found', 404);
    }
    return misappropriationLevel ? misappropriationLevel?.toJSON() : null;
  } catch (error) {
    logger.error('Error in getMisappropriationLevelById:', error);
    throw error;
  }
};

export const createMisappropriationLevel = async (data: { name: string; active?: boolean }, req?: IAuthRequest) => {
  try {
    const createData = {
      ...data,
      active: data.active !== undefined ? data.active : true
    };
    const misappropriationLevel = await MisappropriationLevel.create(createData);
    return misappropriationLevel;
  } catch (error) {
    logger.error('Error in createMisappropriationLevel:', error);
    throw new AppError('Failed to create misappropriation level', 500);
  }
};

export const updateMisappropriationLevel = async (id: string, data: { name?: string; active?: boolean }, req?: IAuthRequest) => {
  try {
    const misappropriationLevel = await MisappropriationLevel.findByPk(id);
    if (!misappropriationLevel) {
      throw new AppError('Misappropriation level not found', 404);
    }

    await misappropriationLevel.update(data);
    return misappropriationLevel;
  } catch (error) {
    logger.error('Error in updateMisappropriationLevel:', error);
    throw error;
  }
};

export const deleteMisappropriationLevel = async (id: string) => {
  try {
    const misappropriationLevel = await MisappropriationLevel.findByPk(id);
    if (!misappropriationLevel) {
      throw new AppError('Misappropriation level not found', 404);
    }

    await misappropriationLevel.destroy();
    return { message: 'Misappropriation level deleted successfully' };
  } catch (error) {
    logger.error('Error in deleteMisappropriationLevel:', error);
    throw error;
  }
};

export const getActiveMisappropriationLevels = async () => {
  try {
    const misappropriationLevels = await MisappropriationLevel.findAll({
      where: { active: true },
      order: [['name', 'ASC']]
    });
    return misappropriationLevels;
  } catch (error) {
    logger.error('Error in getActiveMisappropriationLevels:', error);
    throw new AppError('Failed to fetch active misappropriation levels', 500);
  }
};
