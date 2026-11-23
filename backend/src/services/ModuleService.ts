import { Op } from 'sequelize';
import Module from '../models/Module';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export const getAllModules = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
  active?: boolean
): Promise<{
  modules: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { key: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    if (active !== undefined) {
      whereClause.active = active;
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Module.findAndCountAll({
      where: whereClause,
      order: [['name', 'ASC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);
    return {
      modules: rows.map(row => row.toJSON()),
      total: count,
      page,
      limit,
      totalPages
    };
  } catch (error) {
    logger.error('Failed to get all modules:', error);
    throw new AppError('Failed to get modules', 500);
  }
};
