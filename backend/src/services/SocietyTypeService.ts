import { Op } from 'sequelize';
import SocietyType from '../models/SocietyType';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';

export const getAllSocietyTypes = async (page: number = 1, limit: number = 10, search?: string) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await SocietyType.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['title', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      societyTypes: rows,
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
    logger.error('Error in getAllSocietyTypes:', error);
    throw new AppError('Failed to fetch society types', 500);
  }
};

export const getSocietyTypeById = async (id: string) => {
  try {
    const societyType = await SocietyType.findByPk(id);
    if (!societyType) {
      throw new AppError('Society type not found', 404);
    }
    return societyType ? societyType?.toJSON() : null;
  } catch (error) {
    logger.error('Error in getSocietyTypeById:', error);
    throw error;
  }
};

export const createSocietyType = async (data: { title: string; description?: string; active?: boolean }, req?: IAuthRequest) => {
  try {
    const createData = {
      ...data,
      active: data.active !== undefined ? data.active : true
    };
    const societyType = await SocietyType.create(createData);
    return societyType;
  } catch (error) {
    logger.error('Error in createSocietyType:', error);
    throw new AppError('Failed to create society type', 500);
  }
};

export const updateSocietyType = async (id: string, data: { title?: string; description?: string; active?: boolean }, req?: IAuthRequest) => {
  try {
    const societyType = await SocietyType.findByPk(id);
    if (!societyType) {
      throw new AppError('Society type not found', 404);
    }

    await societyType.update(data);
    return societyType;
  } catch (error) {
    logger.error('Error in updateSocietyType:', error);
    throw error;
  }
};

export const deleteSocietyType = async (id: string) => {
  try {
    const societyType = await SocietyType.findByPk(id);
    if (!societyType) {
      throw new AppError('Society type not found', 404);
    }

    await societyType.destroy();
    return { message: 'Society type deleted successfully' };
  } catch (error) {
    logger.error('Error in deleteSocietyType:', error);
    throw error;
  }
};

export const getActiveSocietyTypes = async () => {
  try {
    const societyTypes = await SocietyType.findAll({
      where: { active: true },
      order: [['title', 'ASC']]
    });
    return societyTypes;
  } catch (error) {
    logger.error('Error in getActiveSocietyTypes:', error);
    throw new AppError('Failed to fetch active society types', 500);
  }
};
