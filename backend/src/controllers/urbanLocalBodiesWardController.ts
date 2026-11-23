import { Request, Response } from 'express';
import { getAllUrbanLocalBodiesWards } from '../services/UrbanLocalBodiesWardService';
import { returnResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export const getUrbanLocalBodiesWardsController = async (req: Request, res: Response) => {
  try {
  const search = req.query.search as string;
  const localBodyCodeRaw = req.query.localbody_code ?? req.query.local_body_code;
  const local_body_code = localBodyCodeRaw != null && String(localBodyCodeRaw).trim() !== ''
    ? Number(localBodyCodeRaw)
    : undefined;

  const data = await getAllUrbanLocalBodiesWards(search, local_body_code);
    returnResponse(res).ok('Urban local bodies wards retrieved successfully', {
      urbanLocalBodiesWards: data.urbanLocalBodiesWards
    });
  } catch (error) {
    logger.error('Failed to get urban local bodies wards:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};