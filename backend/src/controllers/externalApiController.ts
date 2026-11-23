import { Request, Response } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { returnResponse } from '../utils/response';
import {
  getAllExternalApiData,
  getExternalApiDataByName,
  getAvailableApis
} from '../services/ExternalApiService';

/**
 * Controller to get data from all external APIs
 */
export const getAllExternalApiDataController = async (req: Request, res: Response) => {
  try {
    logger.info('External API data request received');
    
    const result = await getAllExternalApiData();
    
    returnResponse(res).ok('External API data retrieved successfully', result);
  } catch (error) {
    logger.error('Failed to get external API data:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

/**
 * Controller to get data from a specific external API by name
 */
export const getExternalApiDataByNameController = async (req: Request, res: Response) => {
  try {
    const { apiName } = req.params;
    
    if (!apiName) {
      throw new AppError('API name is required', 400);
    }
    
    logger.info(`External API data request received for: ${apiName}`);
    
    const result = await getExternalApiDataByName(apiName);
    
    returnResponse(res).ok(`External API data for '${apiName}' retrieved successfully`, result);
  } catch (error) {
    logger.error(`Failed to get external API data for ${req.params.apiName}:`, error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

/**
 * Controller to get list of available external APIs
 */
export const getAvailableApisController = async (req: Request, res: Response) => {
  try {
    logger.info('Available APIs list request received');
    
    const apis = getAvailableApis();
    
    returnResponse(res).ok('Available APIs retrieved successfully', {
      apis,
      count: apis.length
    });
  } catch (error) {
    logger.error('Failed to get available APIs:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};
