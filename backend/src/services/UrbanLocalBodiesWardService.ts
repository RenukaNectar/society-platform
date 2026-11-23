import { Op } from 'sequelize';
import UrbanLocalBodiesWard from '../models/UrbanLocalBodiesWard';

export const getAllUrbanLocalBodiesWards = async (
  search?: string,
  localBodyCode?: number
) => {
  const whereClause: Record<string, unknown> = {};

  if (localBodyCode != null && !Number.isNaN(localBodyCode) && localBodyCode > 0) {
    whereClause.local_body_code = localBodyCode;
  }

  if (search && String(search).trim()) {
    whereClause[Op.or] = [
      { ward_name: { [Op.like]: `%${search}%` } },
      { ward_name_hindi: { [Op.like]: `%${search}%` } },
      { local_body_name: { [Op.like]: `%${search}%` } },
      { local_body_name_hindi: { [Op.like]: `%${search}%` } }
    ];
  }

  const urbanLocalBodiesWards = await UrbanLocalBodiesWard.findAll({
    where: whereClause,
    order: [['created_at', 'DESC']]
  });

  return { urbanLocalBodiesWards };
};

export const getUrbanLocalBodyCodeById = async (id: string) => {
  try {
    let urbanBody = await UrbanLocalBodiesWard.findByPk(id);
    return urbanBody ? urbanBody?.toJSON() : null
  } catch (error) {
    throw error;
  }
};
