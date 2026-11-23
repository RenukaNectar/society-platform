import { Op } from 'sequelize';
import ArbitrationAuthority from '../models/ArbitrationAuthority';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';

export const getAllArbitrationAuthorities = async (page: number = 1, limit: number = 10, search?: string) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await ArbitrationAuthority.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      arbitrationAuthorities: rows,
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
    logger.error('Error in getAllArbitrationAuthorities:', error);
    throw new AppError('Failed to fetch arbitration authorities', 500);
  }
};

export const getArbitrationAuthorityById = async (id: string) => {
  try {
    const arbitrationAuthority = await ArbitrationAuthority.findByPk(id);
    if (!arbitrationAuthority) {
      throw new AppError('Arbitration authority not found', 404);
    }
    return arbitrationAuthority ? arbitrationAuthority?.toJSON() : null;
  } catch (error) {
    logger.error('Error in getArbitrationAuthorityById:', error);
    throw error;
  }
};

export const createArbitrationAuthority = async (data: { name: string; active?: boolean }, req?: IAuthRequest) => {
  try {
    const createData = {
      ...data,
      active: data.active !== undefined ? data.active : true
    };
    const arbitrationAuthority = await ArbitrationAuthority.create(createData);
    return arbitrationAuthority;
  } catch (error) {
    logger.error('Error in createArbitrationAuthority:', error);
    throw new AppError('Failed to create arbitration authority', 500);
  }
};

export const updateArbitrationAuthority = async (id: string, data: { name?: string; active?: boolean }, req?: IAuthRequest) => {
  try {
    const arbitrationAuthority = await ArbitrationAuthority.findByPk(id);
    if (!arbitrationAuthority) {
      throw new AppError('Arbitration authority not found', 404);
    }

    await arbitrationAuthority.update(data);
    return arbitrationAuthority;
  } catch (error) {
    logger.error('Error in updateArbitrationAuthority:', error);
    throw error;
  }
};

export const deleteArbitrationAuthority = async (id: string) => {
  try {
    const arbitrationAuthority = await ArbitrationAuthority.findByPk(id);
    if (!arbitrationAuthority) {
      throw new AppError('Arbitration authority not found', 404);
    }

    await arbitrationAuthority.destroy();
    return { message: 'Arbitration authority deleted successfully' };
  } catch (error) {
    logger.error('Error in deleteArbitrationAuthority:', error);
    throw error;
  }
};

export const getActiveArbitrationAuthorities = async () => {
  try {
    const arbitrationAuthorities = await ArbitrationAuthority.findAll({
      where: { active: true },
      order: [['name', 'ASC']]
    });
    return arbitrationAuthorities;
  } catch (error) {
    logger.error('Error in getActiveArbitrationAuthorities:', error);
    throw new AppError('Failed to fetch active arbitration authorities', 500);
  }
};
