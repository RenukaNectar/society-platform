import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import {
  createSetting,
  getAllSettings,
  getSettingById,
  getSettingByKey,
  updateSetting
} from "../services/SettingService";
import { Request, Response } from "express";
import { returnResponse } from "../utils/response";
import { IAuthRequest } from "../types";

export const getSettings = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const isActive = req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined;
    const key = req.query.key as string;

    const result = await getAllSettings(page, limit, search, isActive, key);

    returnResponse(res).ok('Settings retrieved successfully', {
      settings: result.settings,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get settings:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const createSettingController = async (req: IAuthRequest, res: Response) => {
  try {
    const { key, value } = req.body;

    // Validate that key and value are present
    if (!key || key.trim() === '') {
      throw new AppError('Key is required', 400);
    }

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw new AppError('Value is required', 400);
    }

    // Check if key already exists in the database
    const existingSetting = await getSettingByKey(key);
    if (existingSetting) {
      throw new AppError('Setting with this key already exists', 409);
    }

    const settingData = req.body;
    const newSetting = await createSetting(settingData);

    returnResponse(res).ok('Setting created successfully', newSetting);
  } catch (error) {
    logger.error('Failed to create setting:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const updateSettingController = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const updateData = req.body;

    // Check if setting exists
    const existingSetting = await getSettingById(id);
    if (!existingSetting) {
      throw new AppError('Setting not found', 404);
    }

    // Prevent key from being changed - remove key from updateData if present
    if (updateData.key !== undefined) {
      delete updateData.key;
    }

    const updatedSetting = await updateSetting(id, updateData);

    if (!updatedSetting) {
      throw new AppError('Setting not found', 404);
    }

    returnResponse(res).ok('Setting updated successfully', updatedSetting);
  } catch (error) {
    logger.error('Failed to update setting:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};
