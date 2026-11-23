import { Request, Response } from 'express';
import * as Service from '../services/SectorOfOperationsTypeService';
import { returnResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export const getSectorOfOperationsTypesController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;

    const data = await Service.getAllSectorOfOperationsTypes(page, limit, search);

    returnResponse(res).ok('Sector of operations types retrieved successfully', {
      sectorOfOperationsTypes: data.sectorOfOperationsTypes,
      pagination: data.pagination
    });
  } catch (error) {
    logger.error('Failed to get sector of operations types:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};