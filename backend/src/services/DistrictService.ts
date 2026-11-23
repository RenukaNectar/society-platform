import { Op } from 'sequelize';
import District from '../models/District';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';

export const getAllDistricts = async (page: number = 1, limit: number = 10, search?: string, stateCode?: number) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } }
      ];
    }

    if (stateCode) {
      whereClause.state_code = stateCode;
    }

    const { count, rows } = await District.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      districts: rows,
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
    logger.error('Error in getAllDistricts:', error);
    throw new AppError('Failed to fetch districts', 500);
  }
};

export const getDistrictById = async (id: string) => {
  try {
    const district = await District.findByPk(id);
    if (!district) {
      throw new AppError('District not found', 404);
    }
    return district ? district?.toJSON() : null;
  } catch (error: any) {
    logger.error('Error in getDistrictById:', error);
    
    // If it's already an AppError, re-throw it as is
    if (error instanceof AppError) {
      throw error;
    }
    
    // For other errors, wrap in AppError
    throw new AppError(error.message || 'Failed to fetch district', 500);
  }
};

export const getDistrictsByStateCode = async (stateCode: number) => {
  try {
    const districts = await District.findAll({
      where: { state_code: stateCode },
      order: [['name', 'ASC']]
    });
    return districts;
  } catch (error) {
    logger.error('Error in getDistrictsByStateCode:', error);
    throw new AppError('Failed to fetch districts by state code', 500);
  }
};

export const createDistrict = async (data: { state_code?: number; district_code?: number; name?: string }, req?: IAuthRequest) => {
  try {
    const createData = {
      ...data,
      created_by: req?.user?.userId || null,
      updated_by: req?.user?.userId || null
    };
    const district = await District.create(createData);
    return district;
  } catch (error) {
    logger.error('Error in createDistrict:', error);
    throw new AppError('Failed to create district', 500);
  }
};

export const updateDistrict = async (id: number, data: { state_code?: number; district_code?: number; name?: string }, req?: IAuthRequest) => {
  try {
    const district = await District.findByPk(id);
    if (!district) {
      throw new AppError('District not found', 404);
    }

    const updateData = {
      ...data,
      updated_by: req?.user?.userId || null
    };
    await district.update(updateData);
    return district;
  } catch (error) {
    logger.error('Error in updateDistrict:', error);
    throw error;
  }
};

export const deleteDistrict = async (id: number) => {
  try {
    const district = await District.findByPk(id);
    if (!district) {
      throw new AppError('District not found', 404);
    }

    await district.destroy();
    return { message: 'District deleted successfully' };
  } catch (error) {
    logger.error('Error in deleteDistrict:', error);
    throw error;
  }
}; 