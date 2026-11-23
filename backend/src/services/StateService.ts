import { Op } from 'sequelize';
import State from '../models/State';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';

export const getAllStates = async (page: number = 1, limit: number = 10, search?: string) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { hindi_name: { [Op.like]: `%${search}%` } },
        { state_or_ut: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await State.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      states: rows,
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
    logger.error('Error in getAllStates:', error);
    throw new AppError('Failed to fetch states', 500);
  }
};

export const getStateById = async (id: string | number) => {
  try {
    const state = await State.findByPk(String(id));
    if (!state) {
      throw new AppError('State not found', 404);
    }
    return state ? state?.toJSON() : null;
  } catch (error) {
    logger.error('Error in getStateById:', error);
    throw error;
  }
};

export const getStateByCode = async (stateCode: number) => {
  try {
    const state = await State.findOne({
      where: { state_code: stateCode }
    });
    if (!state) {
      throw new AppError('State not found', 404);
    }
    return state;
  } catch (error) {
    logger.error('Error in getStateByCode:', error);
    throw error;
  }
};

export const createState = async (
  data: {
    state_code?: number;
    name?: string;
    hindi_name?: string;
    state_or_ut?: string
  },
  req?: IAuthRequest
) => {
  try {
    const createData = {
      ...data,
      created_by: req?.user?.userId || null,
      updated_by: req?.user?.userId || null
    };

    const state = await State.create(createData);
    return state;
  } catch (error) {
    logger.error('Error in createState:', error);
    throw new AppError('Failed to create state', 500);
  }
};

export const updateState = async (
  id: number,
  data: {
    state_code?: number;
    name?: string;
    hindi_name?: string;
    state_or_ut?: string
  },
  req?: IAuthRequest
) => {
  try {
    const state = await State.findByPk(id);
    if (!state) {
      throw new AppError('State not found', 404);
    }

    const updateData: any = {
      ...data,
      updated_by: req?.user?.userId || null
    };

    await state.update(updateData);
    return state;
  } catch (error) {
    logger.error('Error in updateState:', error);
    throw error;
  }
};

export const deleteState = async (id: number) => {
  try {
    const state = await State.findByPk(id);
    if (!state) {
      throw new AppError('State not found', 404);
    }

    await state.destroy();
    return { message: 'State deleted successfully' };
  } catch (error) {
    logger.error('Error in deleteState:', error);
    throw error;
  }
}; 