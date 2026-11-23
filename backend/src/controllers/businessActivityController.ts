import { Response } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { returnResponse } from '../utils/response';
import { IAuthRequest } from '../types';
import {
  getAllBusinessActivities,
  getBusinessActivitiesBySocietyId,
  getBusinessActivityById,
  createBusinessActivity,
  updateBusinessActivity,
} from '../services/BusinessActivityService';

export const getAllBusinessActivitiesController = async (req: IAuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = req.query.search as string | undefined;
    const filters = {
      district_id: req.query.district_id as string | undefined,
      state_id: req.query.state_id as string | undefined,
      sector_of_operation: req.query.sector_of_operation as string | undefined,
      society_id: req.query.society_id as string | undefined,
    };

    const result = await getAllBusinessActivities(
      page,
      limit,
      search,
      req.user?.userId,
      filters
    );

    returnResponse(res).ok('Business activities retrieved successfully', {
      businessActivities: result.businessActivities,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Failed to get business activities:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Internal server error', 500);
  }
};

export const getBusinessActivitiesBySocietyIdController = async (
  req: IAuthRequest,
  res: Response
) => {
  try {
    const societyId = req.params.societyId as string;
    const businessActivities = await getBusinessActivitiesBySocietyId(
      societyId,
      req.user?.userId
    );
    returnResponse(res).ok('Business activities retrieved successfully', { businessActivities });
  } catch (error) {
    logger.error('Failed to get business activities by society:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Internal server error', 500);
  }
};

export const getBusinessActivityByIdController = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const businessActivity = await getBusinessActivityById(id, req.user?.userId);
    returnResponse(res).ok('Business activity retrieved successfully', businessActivity);
  } catch (error) {
    logger.error('Failed to get business activity:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Internal server error', 500);
  }
};

export const createBusinessActivityController = async (req: IAuthRequest, res: Response) => {
  try {
    const societyId = req.params.societyId as string;
    const created = await createBusinessActivity(societyId, req.body, req);
    returnResponse(res).ok('Business activity created successfully', created);
  } catch (error) {
    logger.error('Failed to create business activity:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Internal server error', 500);
  }
};

export const updateBusinessActivityController = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const updated = await updateBusinessActivity(id, req.body, req);
    returnResponse(res).ok('Business activity updated successfully', updated);
  } catch (error) {
    logger.error('Failed to update business activity:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Internal server error', 500);
  }
};
