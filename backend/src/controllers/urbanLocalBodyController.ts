import { Request, Response } from 'express';
import { getAllUrbanLocalBodies } from '../services/UrbanLocalBodyService';
import { returnResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export const getUrbanLocalBodiesController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const stateCode = req.query.state_code ? parseInt(req.query.state_code as string) : 0;
    const districtCode = req.query.district_code ? parseInt(req.query.district_code as string) : 0;

    const data = await getAllUrbanLocalBodies(page, limit, search, stateCode, districtCode);

    returnResponse(res).ok('Urban local bodies retrieved successfully', {
      urbanLocalBodies: data.urbanLocalBodies,
      pagination: data.pagination
    });
  } catch (error) {
    logger.error('Failed to get urban local bodies:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};