import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import {
  getAllSocietyConversions,
  getSocietyConversionById,
  getLatestSocietyConversionBySocietyId,
  createSocietyConversion,
  updateSocietyConversion
} from '../services/SocietyConversionService';
import { Request, Response } from 'express';
import { returnResponse } from '../utils/response';
import { IAuthRequest } from '../types';
import { findUserById } from '../services/UserService';

export const getSocietyConversions = async (req: IAuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const filters = {
      status: req.query.status as string,
      society_id: req.query.society_id as string,
      conversion_from: req.query.conversion_from as string,
      conversion_to: req.query.conversion_to as string,
      is_active: req.query.is_active as string,
      from: req.query.from as string,
      to: req.query.to as string,
      registration_number: req.query.registration_number as string,
      society_name: req.query.society_name as string,
      reference_year: req.query.reference_year as string,
    };
    
    const result = await getAllSocietyConversions(
      page,
      limit,
      search,
      req.user?.userId,
      filters
    );

    returnResponse(res).ok('Society conversions retrieved successfully', {
      societyConversions: result.societyConversions,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get society conversions:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError((error as Error)?.message || 'Failed to get society conversions', 500);
  }
};

export const getSocietyConversionByIdController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Check if id is provided
    if (!id) {
      return returnResponse(res).error('Society conversion ID is required', null);
    }

    const societyConversion = await getSocietyConversionById(id);

    if (!societyConversion) {
      throw new AppError('Society conversion not found', 404);
    }

    returnResponse(res).ok('Society conversion retrieved successfully', societyConversion);
  } catch (error) {
    logger.error('Failed to get society conversion:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError((error as Error)?.message || 'Failed to get society conversion', 500);
  }
};

export const getLatestSocietyConversionBySocietyIdController = async (req: Request, res: Response) => {
  try {
    const societyId = req.params.id as string;

    // Check if society id is provided
    if (!societyId) {
      throw new AppError('Society ID is required', 400);
    }

    const societyConversion = await getLatestSocietyConversionBySocietyId(societyId);

    return returnResponse(res).ok('Latest society conversion retrieved successfully', societyConversion);
  } catch (error) {
    logger.error('Failed to get latest society conversion:', error);
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Unexpected error in getLatestSocietyConversionBySocietyIdController:', error);
    throw new AppError((error as Error)?.message || 'Failed to get latest society conversion', 500);
  }
};

export const createSocietyConversionController = async (req: IAuthRequest, res: Response) => {
  try {
    const conversionData = req.body;
    const userId = req?.user?.userId as string;

    if (!userId) {
      return returnResponse(res).error('User not found', null);
    }

    const isUserExist = await findUserById(userId);
    if (!isUserExist) {
      return returnResponse(res).error('User not found', null);
    }

    // Check if society_id is included in the body
    if (!conversionData.society_id) {
      return returnResponse(res).error('Society ID is required in the request body', null);
    }

    const newConversion = await createSocietyConversion(conversionData, req);

    returnResponse(res).ok('Society conversion created successfully', newConversion);
  } catch (error) {
    logger.error('Failed to create society conversion:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError((error as Error)?.message || 'Failed to create society conversion', 500);
  }
};

export const resubmitSocietyConversionController = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const conversionData = req.body;
    const userId = req?.user?.userId as string;

    if (!userId) {
      return returnResponse(res).error('User not found', null);
    }

    const isUserExist = await findUserById(userId);
    if (!isUserExist) {
      return returnResponse(res).error('User not found', null);
    }

    const updatedConversion = await updateSocietyConversion(id, conversionData, req);

    returnResponse(res).ok('Society conversion resubmitted successfully', updatedConversion);
  } catch (error) {
    logger.error('Failed to resubmit society conversion:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError((error as Error)?.message || 'Failed to resubmit society conversion', 500);
  }
};