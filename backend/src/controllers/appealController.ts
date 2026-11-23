import { Request, Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';
import { returnResponse } from '../utils/response';
import {
  IAppealCreateData,
  IAppealFilters,
  createAppeal as createAppealService,
  getAppealById as getAppealByIdService,
  getAppeals as getAppealsService,
  reviewAppealService,
  getAppealsReviewList as getAppealsReviewListService,
  statusChange as statusChangeService,
} from '../services/AppealService';
import Status from '../models/Status';
import User from '../models/user';

// Create appeal
export const createAppeal = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) {
      throw new Error('User not authenticated');
    }

    const appealData: IAppealCreateData = req.body;

    // Create appeal using service
    const appeal = await createAppealService(appealData, req.user.userId, req as any);

    return returnResponse(res).ok('Appeal created successfully', appeal);
  } catch (error) {
    return returnResponse(res).error('Failed to create appeal', error);
  }
};

// Get all appeals with filters
export const getAppeals = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters: IAppealFilters = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      appellant_type: req.query.appellant_type as string,
      status: req.query.status as string,
      society_registration_no: req.query.society_registration_no as string,
      e_signed: req.query.e_signed as string,
      from: req.query.from as string,
      to: req.query.to as string,
    };
    const search = req.query.search as string;

    const userId = req.user?.userId;
    const userDistrictId = (await User.findOne({ where: { id: userId } }))?.district_id;
    const userRole = req.user?.role;

    const authenticatedUser = {
      district_id: userDistrictId,
      role: userRole,
      userId: userId
    };

    // Get appeals using service
    const result = await getAppealsService(filters, search, authenticatedUser);

    return returnResponse(res).ok('Appeals retrieved successfully', result);
  } catch (error) {
    return returnResponse(res).error('Failed to get appeals', error);
  }
};

// Get appeal by ID
export const getAppealById = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new Error('Appeal ID is required');
    }

    // Get appeal using service
    const appeal = await getAppealByIdService(id);

    if (!appeal) {
      throw new Error('Appeal not found');
    }

    return returnResponse(res).ok('Appeal retrieved successfully', appeal);
  } catch (error) {
    return returnResponse(res).error('Failed to get appeal', error);
  }
};

// review appeal
export const reviewAppeal = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const reviewData: any = req.body;

    if (!id || !req.user?.userId) {
      throw new Error('Appeal ID is required');
    }

    // Review appeal using service
    const review = await reviewAppealService(id, reviewData, req.user?.userId);

    return returnResponse(res).ok('Appeal reviewed successfully', review);
  } catch (error: any) {
    const message = error instanceof AppError ? error.message : 'Failed to review appeal';
    return returnResponse(res).error(message, error);
  }
};

// get appeals review list
export const getAppealsReviewList = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id) {
    throw new Error('Appeal ID is required');
  }
  const reviews = await getAppealsReviewListService(id);
  return returnResponse(res).ok('Appeals review list retrieved successfully', reviews);
};

// status change
export const statusChange = async (req: IAuthRequest, res: Response, next: NextFunction) => {


  const getStatus = await Status.findOne({
    where: {
      key: req.body.status as string
    }
  });
  if (!getStatus) {
    throw new Error('Status not found');
  }
  const status = getStatus.id;

  const userId = req.user?.userId;
  const appeal = await statusChangeService(req.params.id as string, status as string, userId as string);
  return returnResponse(res).ok('Appeal status changed successfully', appeal);
};