import { Op } from 'sequelize';
import SectorOfOperationsType from '../models/SectorOfOperationsType';

export const getAllSectorOfOperationsTypes = async (page: number, limit: number, search: string) => {
  const whereClause = search ? {
    [Op.or]: [
      { name: { [Op.like]: `%${search}%` } },
      { key: { [Op.like]: `%${search}%` } }
    ]
  } : {};

  const sectorOfOperationsTypes = await SectorOfOperationsType.findAndCountAll({
    where: whereClause,
    limit,
    offset: (page - 1) * limit,
    order: [['created_at', 'DESC']]
  });

  return {
    sectorOfOperationsTypes: sectorOfOperationsTypes.rows,
    pagination: {
      total: sectorOfOperationsTypes.count,
      page,
      limit
    }
  };
};

export const getSectorOperationTypeById = async (id: string) => {
  try {
    let sectorOprtationType = await SectorOfOperationsType.findByPk(id);
    return sectorOprtationType ? sectorOprtationType?.toJSON() : null
  } catch (error) {
    return null
  }
};