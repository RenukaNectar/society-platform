import { Op } from 'sequelize';
import Bank from '../models/Bank';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export const getAllBanks = async (page: number = 1, limit: number = 10, search?: string) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = { is_active: true };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { branch_name: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Bank.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      banks: rows,
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
    logger.error('Error in getAllBanks:', error);
    throw new AppError('Failed to fetch banks', 500);
  }
};

export const getBanksByFilters = async (filters: any) => {
  try {
    const whereClause: any = { is_active: true };

    if (filters.type) {
      whereClause.type = filters.type;
    }

    if (filters.state) {
      whereClause.state = filters.state;
    }

    const banks = await Bank.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    return banks;
  } catch (error) {
    logger.error('Error in getBanksByFilters:', error);
    throw new AppError('Failed to fetch banks by filters', 500);
  }
};

export const getBankById = async (id: string) => {
  try {
    const bank = await Bank.findByPk(id);
    if (!bank) {
      throw new AppError('Bank not found', 404);
    }
    return bank ? bank?.toJSON() : null;
  } catch (error) {
    logger.error('Error in getBankById:', error);
    throw error;
  }
}; 