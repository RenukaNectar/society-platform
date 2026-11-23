import { Op } from 'sequelize';
import SectorOfOperation from '../models/SectorOfOperation';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';

export const getAllSectorOfOperations = async (page: number = 1, limit: number = 10, search?: string) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await SectorOfOperation.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      sectorOfOperations: rows,
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
    logger.error('Error in getAllSectorOfOperations:', error);
    throw new AppError('Failed to fetch sector of operations', 500);
  }
};

export const getSectorOfOperationById = async (id: string) => {
  try {
    const sectorOfOperation = await SectorOfOperation.findByPk(id);
    if (!sectorOfOperation) {
      throw new AppError('Sector of operation not found', 404);
    }
    return sectorOfOperation ? sectorOfOperation?.toJSON() : null;
  } catch (error) {
    logger.error('Error in getSectorOfOperationById:', error);
    throw error;
  }
};

export const createSectorOfOperation = async (data: { name: string }, req?: IAuthRequest) => {
  try {
    const createData = {
      ...data,
      created_by: req?.user?.userId || null,
      updated_by: req?.user?.userId || null
    };
    const sectorOfOperation = await SectorOfOperation.create(createData);
    return sectorOfOperation;
  } catch (error) {
    logger.error('Error in createSectorOfOperation:', error);
    throw new AppError('Failed to create sector of operation', 500);
  }
};

export const updateSectorOfOperation = async (id: number, data: { name: string }, req?: IAuthRequest) => {
  try {
    const sectorOfOperation = await SectorOfOperation.findByPk(id);
    if (!sectorOfOperation) {
      throw new AppError('Sector of operation not found', 404);
    }

    const updateData = {
      ...data,
      updated_by: req?.user?.userId || null
    };
    await sectorOfOperation.update(updateData);
    return sectorOfOperation;
  } catch (error) {
    logger.error('Error in updateSectorOfOperation:', error);
    throw error;
  }
};

export const deleteSectorOfOperation = async (id: number) => {
  try {
    const sectorOfOperation = await SectorOfOperation.findByPk(id);
    if (!sectorOfOperation) {
      throw new AppError('Sector of operation not found', 404);
    }

    await sectorOfOperation.destroy();
    return { message: 'Sector of operation deleted successfully' };
  } catch (error) {
    logger.error('Error in deleteSectorOfOperation:', error);
    throw error;
  }
}; 