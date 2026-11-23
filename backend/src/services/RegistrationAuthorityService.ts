import { Op } from 'sequelize';
import RegistrationAuthority from '../models/RegistrationAuthority';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';

export const getAllRegistrationAuthorities = async (page: number = 1, limit: number = 10, search?: string) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await RegistrationAuthority.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      registrationAuthorities: rows,
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
    logger.error('Error in getAllRegistrationAuthorities:', error);
    throw new AppError('Failed to fetch registration authorities', 500);
  }
};

export const getRegistrationAuthorityById = async (id: number) => {
  try {
    const registrationAuthority = await RegistrationAuthority.findByPk(id);
    if (!registrationAuthority) {
      throw new AppError('Registration authority not found', 404);
    }
    return registrationAuthority ? registrationAuthority?.toJSON() : null;
  } catch (error) {
    logger.error('Error in getRegistrationAuthorityById:', error);
    throw error;
  }
};

export const createRegistrationAuthority = async (data: { name: string }, req?: IAuthRequest) => {
  try {
    const createData = {
      ...data,
      created_by: req?.user?.userId || null,
      updated_by: req?.user?.userId || null
    };
    const registrationAuthority = await RegistrationAuthority.create(createData);
    return registrationAuthority;
  } catch (error) {
    logger.error('Error in createRegistrationAuthority:', error);
    throw new AppError('Failed to create registration authority', 500);
  }
};

export const updateRegistrationAuthority = async (id: number, data: { name: string }, req?: IAuthRequest) => {
  try {
    const registrationAuthority = await RegistrationAuthority.findByPk(id);
    if (!registrationAuthority) {
      throw new AppError('Registration authority not found', 404);
    }

    const updateData = {
      ...data,
      updated_by: req?.user?.userId || null
    };
    await registrationAuthority.update(updateData);
    return registrationAuthority;
  } catch (error) {
    logger.error('Error in updateRegistrationAuthority:', error);
    throw error;
  }
};

export const deleteRegistrationAuthority = async (id: number) => {
  try {
    const registrationAuthority = await RegistrationAuthority.findByPk(id);
    if (!registrationAuthority) {
      throw new AppError('Registration authority not found', 404);
    }

    await registrationAuthority.destroy();
    return { message: 'Registration authority deleted successfully' };
  } catch (error) {
    logger.error('Error in deleteRegistrationAuthority:', error);
    throw error;
  }
}; 