import { Op } from 'sequelize';
import UrbanLocalBody from '../models/UrbanLocalBody';

export const getAllUrbanLocalBodies = async (page: number = 1, limit: number = 10, search: string, stateCode: number, districtCode: number ) => {
  const whereClause : any = {};
  
 if (stateCode) {
      whereClause.state_code = stateCode;
    }

    if (districtCode) {
      whereClause.district_code = districtCode;
    }

 if (search) {
      whereClause[Op.or] = [
  // search ? {
  //   [Op.or]: [
      { local_body_name: { [Op.like]: `%${search}%` } },
      { local_body_name_hindi: { [Op.like]: `%${search}%` } },
      { localbody_type_name: { [Op.like]: `%${search}%` } },
      { localbody_type_name_hindi: { [Op.like]: `%${search}%` } }
    ]
  } 

  const urbanLocalBodies = await UrbanLocalBody.findAndCountAll({
    where: whereClause,
    limit,
    offset: (page - 1) * limit,
    order: [['created_at', 'DESC']]
  });

  return {
    urbanLocalBodies: urbanLocalBodies.rows,
    pagination: {
      total: urbanLocalBodies.count,
      page,
      limit
    }
  };
};

export const getUrbanLocalBodyById = async (id: string) => {
    try {
    let urbanBody = await UrbanLocalBody.findByPk(id);
    return urbanBody ? urbanBody?.toJSON() : null
  } catch (error) {
    throw error;
  }
};

export const createUrbanLocalBody = async (data: any) => {
  return await UrbanLocalBody.create(data);
};