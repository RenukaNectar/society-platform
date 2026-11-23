import { Op } from 'sequelize';
import CostOfManagementType from '../models/CostOfManagementType';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';

export const getAllCostOfManagementTypes = async (page: number = 1, limit: number = 10, search?: string) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await CostOfManagementType.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      costOfManagementTypes: rows,
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
    logger.error('Error in getAllCostOfManagementTypes:', error);
    throw new AppError('Failed to fetch cost of management types', 500);
  }
};

export const getCostOfManagementTypeById = async (id: string) => {
  try {
    const costOfManagementType = await CostOfManagementType.findByPk(id);
    if (!costOfManagementType) {
      throw new AppError('Cost of management type not found', 404);
    }
    return costOfManagementType ? costOfManagementType?.toJSON() : null;
  } catch (error) {
    logger.error('Error in getCostOfManagementTypeById:', error);
    throw error;
  }
};

export const createCostOfManagementType = async (data: { name: string; active?: boolean }, req?: IAuthRequest) => {
  try {
    const createData = {
      ...data,
      active: data.active !== undefined ? data.active : true
    };
    const costOfManagementType = await CostOfManagementType.create(createData);
    return costOfManagementType;
  } catch (error) {
    logger.error('Error in createCostOfManagementType:', error);
    throw new AppError('Failed to create cost of management type', 500);
  }
};

export const updateCostOfManagementType = async (id: string, data: { name?: string; active?: boolean }, req?: IAuthRequest) => {
  try {
    const costOfManagementType = await CostOfManagementType.findByPk(id);
    if (!costOfManagementType) {
      throw new AppError('Cost of management type not found', 404);
    }

    await costOfManagementType.update(data);
    return costOfManagementType;
  } catch (error) {
    logger.error('Error in updateCostOfManagementType:', error);
    throw error;
  }
};

export const deleteCostOfManagementType = async (id: string) => {
  try {
    const costOfManagementType = await CostOfManagementType.findByPk(id);
    if (!costOfManagementType) {
      throw new AppError('Cost of management type not found', 404);
    }

    await costOfManagementType.destroy();
    return { message: 'Cost of management type deleted successfully' };
  } catch (error) {
    logger.error('Error in deleteCostOfManagementType:', error);
    throw error;
  }
};

export const getActiveCostOfManagementTypes = async () => {
  try {
    const costOfManagementTypes = await CostOfManagementType.findAll({
      where: { active: true },
      order: [['name', 'ASC']]
    });
    return costOfManagementTypes;
  } catch (error) {
    logger.error('Error in getActiveCostOfManagementTypes:', error);
    throw new AppError('Failed to fetch active cost of management types', 500);
  }
};
