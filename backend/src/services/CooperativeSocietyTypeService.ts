import { Op } from 'sequelize';
import CooperativeSocietyType from '../models/CooperativeSocietyType';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';

export const getAllCooperativeSocietyTypes = async (page: number = 1, limit: number = 10, search?: string) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await CooperativeSocietyType.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['sequence', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      cooperativeSocietyTypes: rows,
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
    logger.error('Error in getAllCooperativeSocietyTypes:', error);
    throw new AppError('Failed to fetch cooperative society types', 500);
  }
};

export const getCooperativeSocietyTypeById = async (id: number) => {
  try {
    const cooperativeSocietyType = await CooperativeSocietyType.findByPk(id);
    if (!cooperativeSocietyType) {
      throw new AppError('Cooperative society type not found', 404);
    }
    return cooperativeSocietyType ? cooperativeSocietyType?.toJSON() : null;
  } catch (error) {
    logger.error('Error in getCooperativeSocietyTypeById:', error);
    throw error;
  }
};

export const createCooperativeSocietyType = async (data: { name: string }, req?: IAuthRequest) => {
  try {
    const createData = {
      ...data,
      created_by: req?.user?.userId || null,
      updated_by: req?.user?.userId || null
    };
    const cooperativeSocietyType = await CooperativeSocietyType.create(createData);
    return cooperativeSocietyType;
  } catch (error) {
    logger.error('Error in createCooperativeSocietyType:', error);
    throw new AppError('Failed to create cooperative society type', 500);
  }
};

export const updateCooperativeSocietyType = async (id: number, data: { name: string }, req?: IAuthRequest) => {
  try {
    const cooperativeSocietyType = await CooperativeSocietyType.findByPk(id);
    if (!cooperativeSocietyType) {
      throw new AppError('Cooperative society type not found', 404);
    }

    const updateData = {
      ...data,
      updated_by: req?.user?.userId || null
    };
    await cooperativeSocietyType.update(updateData);
    return cooperativeSocietyType;
  } catch (error) {
    logger.error('Error in updateCooperativeSocietyType:', error);
    throw error;
  }
};

export const deleteCooperativeSocietyType = async (id: number) => {
  try {
    const cooperativeSocietyType = await CooperativeSocietyType.findByPk(id);
    if (!cooperativeSocietyType) {
      throw new AppError('Cooperative society type not found', 404);
    }

    await cooperativeSocietyType.destroy();
    return { message: 'Cooperative society type deleted successfully' };
  } catch (error) {
    logger.error('Error in deleteCooperativeSocietyType:', error);
    throw error;
  }
}; 