import { Op } from 'sequelize';
import Setting from '../models/Setting';
import { ISetting, ISettingCreate, ISettingUpdate } from '../types';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

// Create setting
export const createSetting = async (settingData: ISettingCreate): Promise<ISetting> => {
  try {
    // Check if key already exists
    const existingSetting = await Setting.findOne({
      where: { key: settingData.key }
    });

    if (existingSetting) {
      throw new AppError('Setting with this key already exists', 409);
    }

    const setting = await Setting.create(settingData);
    logger.info('Setting created successfully', { settingId: setting.id, key: setting.key });

    return setting.toJSON();
  } catch (error: any) {
    logger.error('Failed to create setting:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to create setting', 500);
  }
};

// Get all settings with pagination and filters
export const getAllSettings = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  isActive?: boolean,
  key?: string
) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { key: { [Op.like]: `%${search}%` } },
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Default to only active settings if isActive is not explicitly provided
    whereClause.is_active = isActive !== undefined ? isActive : true;

    if (key) {
      whereClause.key = key;
    }

    const { count, rows } = await Setting.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      settings: rows.map(setting => setting.toJSON()),
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
    logger.error('Failed to get settings:', error);
    throw new AppError('Failed to get settings', 500);
  }
};

// Get setting by ID
export const getSettingById = async (id: string): Promise<ISetting | null> => {
  try {
    const setting = await Setting.findOne({
      where: { id, is_active: true }
    });

    return setting ? setting.toJSON() : null;
  } catch (error) {
    logger.error('Failed to get setting by ID:', error);
    throw new AppError('Failed to get setting', 500);
  }
};

// Get setting by key
export const getSettingByKey = async (key: string): Promise<ISetting | null> => {
  try {
    const setting = await Setting.findOne({
      where: { key, is_active: true }
    });

    return setting ? setting.toJSON() : null;
  } catch (error) {
    logger.error('Failed to get setting by key:', error);
    throw new AppError('Failed to get setting', 500);
  }
};

// Update setting
export const updateSetting = async (
  id: string,
  updateData: ISettingUpdate
): Promise<ISetting | null> => {
  try {
    // Fetch active setting
    const setting = await Setting.findOne({
      where: {
        id,
        is_active: true
      }
    });

    if (!setting) {
      return null;
    }

    // Validate unique key only if key is changing
    if (updateData.key && updateData.key !== setting.key) {
      const keyExists = await Setting.count({
        where: {
          key: updateData.key,
          id: { [Op.ne]: id }
        }
      });

      if (keyExists > 0) {
        throw new AppError('Setting with this key already exists', 409);
      }
    }

    const updatedSetting = await setting.update(updateData);

    logger.info('Setting updated successfully', {
      settingId: id,
      updatedFields: Object.keys(updateData)
    });

    return updatedSetting.toJSON();
  } catch (error) {
    logger.error('Failed to update setting', {
      settingId: id,
      error
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Failed to update setting', 500);
  }
};