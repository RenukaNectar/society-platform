import { Op, fn, col } from 'sequelize';
import DistrictsBlocksGpVillage from '../models/DistrictsBlocksGpVillage';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';
import District from '../models/District';
import {
  getBlocksByDistrictCode as getBlocksFromBlocksTableByDistrictCode,
  getBlocksByStateAndDistrictCode as getBlocksFromBlocksTableByStateAndDistrict,
} from './BlockService';

export const getAllDistrictsBlocksGpVillages = async (page: number = 1, limit: number = 10, search?: string, stateCode?: number, districtCode?: number, blockCode?: number, gramPanchayatCode?: number, villageCode?: number) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { state_name: { [Op.like]: `%${search}%` } },
        { district_name: { [Op.like]: `%${search}%` } },
        { block_name: { [Op.like]: `%${search}%` } },
        { gram_panchayat_name: { [Op.like]: `%${search}%` } },
        { gram_panchayat_name_hindi: { [Op.like]: `%${search}%` } },
        { village_name: { [Op.like]: `%${search}%` } }
      ];
    }

    if (stateCode) {
      whereClause.state_code = stateCode;
    }

    if (districtCode) {
      whereClause.district_code = districtCode;
    }

    if (blockCode) {
      whereClause.block_code = blockCode;
    }

    if (gramPanchayatCode) {
      whereClause.gram_panchayat_code = gramPanchayatCode;
    }

    if (villageCode) {
      whereClause.village_code = villageCode;
    }

    const { count, rows } = await DistrictsBlocksGpVillage.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['state_name', 'ASC'], ['district_name', 'ASC'], ['block_name', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      districtsBlocksGpVillages: rows,
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
    logger.error('Error in getAllDistrictsBlocksGpVillages:', error);
    throw new AppError('Failed to fetch districts blocks GP villages', 500);
  }
};

// Get districts by state code
export const getDistrictsByStateCode = async (stateCode: number) => {
  try {
    const districts = await District.findAll({
      where: { state_code: stateCode },
      attributes: [
        'id',
        'district_code',
        'name'
      ],
      order: [['name', 'ASC']],
      raw: true
    });

    return districts;
  } catch (error) {
    logger.error('Error in getDistrictsByStateCode:', error);
    throw new AppError('Failed to fetch districts by state code', 500);
  }
};

/** Delegates to `blocks` table (see BlockService). */
export const getBlocksByDistrictCode = async (stateCode: number, districtCode: number) => {
  try {
    return await getBlocksFromBlocksTableByStateAndDistrict(stateCode, districtCode);
  } catch (error) {
    logger.error('Error in getBlocksByDistrictCode:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to fetch blocks by district code', 500);
  }
};

export const getAllGramPanchayats = async (
  page: number = 1,
  limit: number = 10,
  stateCode?: number,
  districtCode?: number,
  blockCode?: number
) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {
      gram_panchayat_code: { [Op.ne]: null }
    };

    if (stateCode) {
      whereClause.state_code = stateCode;
    }

    if (districtCode) {
      whereClause.district_code = districtCode;
    }

    if (blockCode) {
      whereClause.block_code = blockCode;
    }

    const [rows, total] = await Promise.all([
      DistrictsBlocksGpVillage.findAll({
        where: whereClause,
        attributes: [
          'gram_panchayat_code',
          [fn('MIN', col('gram_panchayat_name')), 'gram_panchayat_name'],
          [fn('MIN', col('gram_panchayat_name_hindi')), 'gram_panchayat_name_hindi'],
          [fn('MIN', col('state_code')), 'state_code'],
          [fn('MIN', col('state_name')), 'state_name'],
          [fn('MIN', col('district_code')), 'district_code'],
          [fn('MIN', col('district_name')), 'district_name'],
          [fn('MIN', col('block_code')), 'block_code'],
          [fn('MIN', col('block_name')), 'block_name']
        ],
        group: ['gram_panchayat_code'],
        order: [[fn('MIN', col('gram_panchayat_name')), 'ASC']],
        limit,
        offset,
        raw: true,
        subQuery: false
      }),
      DistrictsBlocksGpVillage.count({
        where: whereClause,
        distinct: true,
        col: 'gram_panchayat_code'
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      gramPanchayats: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    logger.error('Error in getAllGramPanchayats:', error);
    throw new AppError('Failed to fetch gram panchayats', 500);
  }
};

// Get gram panchayats by block code
export const getGramPanchayatsByBlockCode = async (stateCode: number, districtCode: number, blockCode: number) => {
  try {
    const gramPanchayats = await DistrictsBlocksGpVillage.findAll({
      where: {
        state_code: stateCode,
        district_code: districtCode,
        block_code: blockCode
      },
      attributes: [
        'id',
        'gram_panchayat_code',
        'gram_panchayat_name'
      ],
      order: [['gram_panchayat_name', 'ASC']],
      raw: true
    });

    // Remove duplicates based on gram_panchayat_code
    const uniqueGramPanchayats = gramPanchayats.filter((gramPanchayat, index, self) =>
      index === self.findIndex(gp => gp.gram_panchayat_code === gramPanchayat.gram_panchayat_code)
    );

    return uniqueGramPanchayats;
  } catch (error) {
    logger.error('Error in getGramPanchayatsByBlockCode:', error);
    throw new AppError('Failed to fetch gram panchayats by block code', 500);
  }
};

// Get villages by gram panchayat code
export const getVillagesByGramPanchayatCode = async (stateCode: number, districtCode: number, blockCode: number, gramPanchayatCode: number) => {
  try {
    const villages = await DistrictsBlocksGpVillage.findAll({
      where: {
        state_code: stateCode,
        district_code: districtCode,
        block_code: blockCode,
        gram_panchayat_code: gramPanchayatCode
      },
      attributes: [
        'id',
        'village_code',
        'village_name'
      ],
      order: [['village_name', 'ASC']],
      raw: true
    });

    // Remove duplicates based on village_code
    const uniqueVillages = villages.filter((village, index, self) =>
      index === self.findIndex(v => v.village_code === village.village_code)
    );

    return uniqueVillages;
  } catch (error) {
    logger.error('Error in getVillagesByGramPanchayatCode:', error);
    throw new AppError('Failed to fetch villages by gram panchayat code', 500);
  }
};

export const getDistrictsBlocksGpVillageById = async (id: number) => {
  try {
    const districtsBlocksGpVillage = await DistrictsBlocksGpVillage.findByPk(id);
    if (!districtsBlocksGpVillage) {
      throw new AppError('Districts blocks GP village not found', 404);
    }
    return districtsBlocksGpVillage;
  } catch (error) {
    logger.error('Error in getDistrictsBlocksGpVillageById:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to fetch districts blocks GP village by ID', 500);
  }
};

export const getDistrictsBlocksGpVillagesByStateCode = async (stateCode: number) => {
  try {
    const districtsBlocksGpVillages = await DistrictsBlocksGpVillage.findAll({
      where: { state_code: stateCode },
      order: [['district_name', 'ASC'], ['block_name', 'ASC']]
    });
    return districtsBlocksGpVillages;
  } catch (error) {
    logger.error('Error in getDistrictsBlocksGpVillagesByStateCode:', error);
    throw new AppError('Failed to fetch districts blocks GP villages by state code', 500);
  }
};

export const getDistrictsBlocksGpVillagesByDistrictCode = async (districtCode: number) => {
  try {
    const districtsBlocksGpVillages = await DistrictsBlocksGpVillage.findAll({
      where: { district_code: districtCode },
      order: [['block_name', 'ASC']]
    });
    return districtsBlocksGpVillages;
  } catch (error) {
    logger.error('Error in getDistrictsBlocksGpVillagesByDistrictCode:', error);
    throw new AppError('Failed to fetch districts blocks GP villages by district code', 500);
  }
};

export const getDistrictsBlocksGpVillagesByBlockCode = async (blockCode: number) => {
  try {
    const districtsBlocksGpVillages = await DistrictsBlocksGpVillage.findAll({
      where: { block_code: blockCode },
      order: [['gram_panchayat_name', 'ASC']]
    });
    return districtsBlocksGpVillages;
  } catch (error) {
    logger.error('Error in getDistrictsBlocksGpVillagesByBlockCode:', error);
    throw new AppError('Failed to fetch districts blocks GP villages by block code', 500);
  }
};

// Get districts by state (using state ID instead of state code)
export const getDistrictsByState = async (stateId: string) => {
  try {
    // First get the state by ID to get the state_code
    const { getStateById } = await import('./StateService');
    const state = await getStateById(parseInt(stateId));

    if (!state) {
      throw new AppError('State not found', 404);
    }

    const districts = await DistrictsBlocksGpVillage.findAll({
      where: { state_code: state.state_code },
      attributes: [
        'id',
        'district_code',
        'district_name'
      ],
      order: [['district_name', 'ASC']],
      raw: true
    });

    // Remove duplicates based on district_code
    const uniqueDistricts = districts.filter((district, index, self) =>
      index === self.findIndex(d => d.district_code === district.district_code)
    );

    return uniqueDistricts;
  } catch (error) {
    logger.error('Error in getDistrictsByState:', error);
    throw new AppError('Failed to fetch districts by state', 500);
  }
};

// Get blocks by district: path param is district **code** (e.g. 787). UUID still accepted for legacy clients.
export const getBlocksByDistrict = async (districtParam: string) => {
  try {
    const trimmed = districtParam.trim();
    if (!trimmed) {
      throw new AppError('District code is required', 400);
    }

    let districtCodeNum: number;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(trimmed)) {
      const { getDistrictById } = await import('./DistrictService');
      const district = await getDistrictById(trimmed);
      if (!district || district.district_code == null) {
        throw new AppError('District not found', 404);
      }
      districtCodeNum = Number(district.district_code);
    } else {
      const parsed = parseInt(trimmed, 10);
      if (Number.isNaN(parsed)) {
        throw new AppError('Invalid district code', 400);
      }
      districtCodeNum = parsed;
    }

    return await getBlocksFromBlocksTableByDistrictCode(districtCodeNum);
  } catch (error) {
    logger.error('Error in getBlocksByDistrict:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to fetch blocks by district', 500);
  }
};

export const createDistrictsBlocksGpVillage = async (data: { state_code?: number; state_name?: string; district_code?: number; district_name?: string; block_code?: number; block_name?: string; gram_panchayat_code?: number; gram_panchayat_name?: string; gram_panchayat_name_hindi?: string; village_code?: number; village_name?: string }, req?: IAuthRequest) => {
  try {
    const createData = {
      ...data,
      created_by: req?.user?.userId || null,
      updated_by: req?.user?.userId || null
    };
    const districtsBlocksGpVillage = await DistrictsBlocksGpVillage.create(createData);
    return districtsBlocksGpVillage;
  } catch (error) {
    logger.error('Error in createDistrictsBlocksGpVillage:', error);
    throw new AppError('Failed to create districts blocks GP village', 500);
  }
};

export const updateDistrictsBlocksGpVillage = async (id: number, data: { state_code?: number; state_name?: string; district_code?: number; district_name?: string; block_code?: number; block_name?: string; gram_panchayat_code?: number; gram_panchayat_name?: string; gram_panchayat_name_hindi?: string; village_code?: number; village_name?: string }, req?: IAuthRequest) => {
  try {
    const districtsBlocksGpVillage = await DistrictsBlocksGpVillage.findByPk(id);
    if (!districtsBlocksGpVillage) {
      throw new AppError('Districts blocks GP village not found', 404);
    }

    const updateData = {
      ...data,
      updated_by: req?.user?.userId || null
    };
    await districtsBlocksGpVillage.update(updateData);
    return districtsBlocksGpVillage;
  } catch (error) {
    logger.error('Error in updateDistrictsBlocksGpVillage:', error);
    throw error;
  }
};

export const deleteDistrictsBlocksGpVillage = async (id: number) => {
  try {
    const districtsBlocksGpVillage = await DistrictsBlocksGpVillage.findByPk(id);
    if (!districtsBlocksGpVillage) {
      throw new AppError('Districts blocks GP village not found', 404);
    }

    await districtsBlocksGpVillage.destroy();
    return { message: 'Districts blocks GP village deleted successfully' };
  } catch (error) {
    logger.error('Error in deleteDistrictsBlocksGpVillage:', error);
    throw error;
  }
}; 