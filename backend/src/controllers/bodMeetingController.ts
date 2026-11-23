import { Response } from 'express';
import { AppError } from '../utils/errors';
import { IAuthRequest } from '../types';
import { returnResponse } from '../utils/response';
import logger from '../utils/logger';
import {
  createBodMeetingService,
  getAllBodMeetingsService,
  getBodMeetingByIdService
} from '../services/bodMeetingService';

export const createBodMeetingController = async (req: IAuthRequest, res: Response) => {
  try {
    const createdBy = req.user ? req.user.userId : null;
    const newMeeting = await createBodMeetingService(req.body, createdBy);
    return returnResponse(res).ok('BOD meeting created successfully', newMeeting);
  } catch (error) {
    logger.error('Error creating BOD meeting:', error);
    if (error instanceof AppError) {
      return returnResponse(res).error(error.message, null);
    }
    const fallbackMessage =
      (error as any)?.original?.message ||
      (error as any)?.parent?.message ||
      (error as any)?.message ||
      'Failed to create BOD meeting';
    return returnResponse(res).error(fallbackMessage, null);
  }
};

export const getAllBodMeetingsController = async (req: IAuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const society_id = req.query.society_id as string;
    const userRole = req.user?.role;
    const userDistrictId = req.user?.district_id ?? null;
    const isHq = !!req.user?.is_hq;

    const result = await getAllBodMeetingsService(
      page,
      limit,
      search,
      society_id,
      userId,
      userRole,
      userDistrictId,
      isHq
    );

    return returnResponse(res).ok('BOD meetings fetched successfully', {
      meetings: result.meetings,
      pagination: result.pagination
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Error fetching BOD meetings:', error);
    return returnResponse(res).error('Failed to fetch BOD meetings', null);
  }
};

export const getBodMeetingByIdController = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!id) {
      throw new AppError('ID parameter is required', 400);
    }
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const userRole = req.user?.role;
    const userDistrictId = req.user?.district_id ?? null;
    const isHq = !!req.user?.is_hq;

    const meeting = await getBodMeetingByIdService(String(id), userId, userRole, userDistrictId, isHq);
    return returnResponse(res).ok('BOD meeting fetched successfully', meeting);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Error fetching BOD meeting by ID:', error);
    return returnResponse(res).error('Failed to fetch BOD meeting', null);
  }
};
