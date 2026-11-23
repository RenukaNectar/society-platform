import { Op } from 'sequelize';
import Block from '../models/Block';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';

export const getAllBlocks = async (page: number = 1, limit: number = 10, search?: string, stateCode?: number, districtCode?: number) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { block_name_hindi: { [Op.like]: `%${search}%` } },
        { name_local: { [Op.like]: `%${search}%` } }
      ];
    }

    if (stateCode) {
      whereClause.state_code = stateCode;
    }

    if (districtCode) {
      whereClause.district_code = districtCode;
    }

    const { count, rows } = await Block.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      blocks: rows,
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
    logger.error('Error in getAllBlocks:', error);
    throw new AppError('Failed to fetch blocks', 500);
  }
};

/** Resolve `blocks` row by primary key (UUID string or number). Returns null if missing — used by society profile enrichment. */
export const getBlockById = async (id: string | number) => {
  try {
    if (id === null || id === undefined || id === '') {
      return null;
    }
    const pk = typeof id === 'string' ? id.trim() : id;
    const block = await Block.findByPk(pk);
    return block ? block.toJSON() : null;
  } catch (error) {
    logger.error('Error in getBlockById:', error);
    throw error;
  }
};

export const getBlocksByStateCode = async (stateCode: number) => {
  try {
    const blocks = await Block.findAll({
      where: { state_code: stateCode },
      order: [['name', 'ASC']]
    });
    return blocks;
  } catch (error) {
    logger.error('Error in getBlocksByStateCode:', error);
    throw new AppError('Failed to fetch blocks by state code', 500);
  }
};

/** API list shape: `name` from `blocks` + `block_name` for clients that expect GP-master-style field names. */
const serializeBlockForList = (row: InstanceType<typeof Block>) => {
  const j = row.get({ plain: true }) as Record<string, unknown>;
  const name = (j.name as string) ?? '';
  return {
    ...j,
    block_name: name,
  };
};

export const getBlocksByDistrictCode = async (districtCode: number) => {
  try {
    const blocks = await Block.findAll({
      where: { district_code: districtCode },
      order: [['name', 'ASC']]
    });
    return blocks.map(serializeBlockForList);
  } catch (error) {
    logger.error('Error in getBlocksByDistrictCode:', error);
    throw new AppError('Failed to fetch blocks by district code', 500);
  }
};

export const getBlocksByStateAndDistrictCode = async (
  stateCode: number,
  districtCode: number
) => {
  try {
    const whereClause: Record<string, number> = { district_code: districtCode };
    if (stateCode != null && !Number.isNaN(stateCode)) {
      whereClause.state_code = stateCode;
    }

    const blocks = await Block.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });
    return blocks.map(serializeBlockForList);
  } catch (error) {
    logger.error('Error in getBlocksByStateAndDistrictCode:', error);
    throw new AppError('Failed to fetch blocks by state and district code', 500);
  }
};

export const createBlock = async (data: { state_code?: number; district_code?: number; block_code?: number; name?: string; block_name_hindi?: string; name_local?: string; block_version?: number }, req?: IAuthRequest) => {
  try {
    const createData = {
      ...data,
      created_by: req?.user?.userId || null,
      updated_by: req?.user?.userId || null
    };
    const block = await Block.create(createData);
    return block;
  } catch (error) {
    logger.error('Error in createBlock:', error);
    throw new AppError('Failed to create block', 500);
  }
};

export const updateBlock = async (id: number, data: { state_code?: number; district_code?: number; block_code?: number; name?: string; block_name_hindi?: string; name_local?: string; block_version?: number }, req?: IAuthRequest) => {
  try {
    const block = await Block.findByPk(id);
    if (!block) {
      throw new AppError('Block not found', 404);
    }

    const updateData = {
      ...data,
      updated_by: req?.user?.userId || null
    };
    await block.update(updateData);
    return block;
  } catch (error) {
    logger.error('Error in updateBlock:', error);
    throw error;
  }
};

export const deleteBlock = async (id: number) => {
  try {
    const block = await Block.findByPk(id);
    if (!block) {
      throw new AppError('Block not found', 404);
    }

    await block.destroy();
    return { message: 'Block deleted successfully' };
  } catch (error) {
    logger.error('Error in deleteBlock:', error);
    throw error;
  }
}; 