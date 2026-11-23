import { Response } from 'express';
import { createAnnualGeneralMeetingService, getAllAnnualGeneralMeetingsService, getAnnualGeneralMeetingByIdService, getAgmCalendarYearEligibility, resubmitAnnualGeneralMeetingService } from '../services/annualGeneralService';
import { AppError } from "../utils/errors";
import { IAuthRequest } from "../types";
import { returnResponse } from '../utils/response';
import logger from '../utils/logger';

export const createAnnualGeneralMeetingController = async (req: IAuthRequest, res: Response) => {
    try {
        const agmData = req.body;
        const createdBy = req.user ? req.user.userId : null;

        const newAGM = await createAnnualGeneralMeetingService(agmData, createdBy);
        return returnResponse(res).ok('Annual General Meeting created successfully', newAGM);
    } catch (error) {
        logger.error('Error creating Annual General Meeting:', error);
        if (error instanceof AppError) throw error;
        return returnResponse(res).error('Failed to create Annual General Meeting', null);
    };
};

export const getAgmCalendarYearEligibilityController = async (req: IAuthRequest, res: Response) => {
    try {
        const societyId = req.query.society_id as string;
        const yearParam = req.query.year as string | undefined;
        const calendarYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

        if (!societyId) {
            throw new AppError('Society ID is required', 400);
        }

        const result = await getAgmCalendarYearEligibility(societyId, calendarYear);
        return returnResponse(res).ok('AGM calendar year eligibility retrieved successfully', result);
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('Error fetching AGM calendar year eligibility:', error);
        return returnResponse(res).error('Failed to fetch AGM calendar year eligibility', null);
    }
};

export const getAllAnnualGeneralMeetingsController = async (req: IAuthRequest, res: Response) => {
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

        const result = await getAllAnnualGeneralMeetingsService(page, limit, search, society_id, userId, userRole, userDistrictId, isHq);

        return returnResponse(res).ok('Annual General Meetings fetched successfully', {
            meetings: result.meetings,
            pagination: result.pagination
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('Error fetching Annual General Meetings:', error);
        return returnResponse(res).error('Failed to fetch Annual General Meetings', null);
    }
};

export const getAnnualGeneralMeetingByIdController = async (req: IAuthRequest, res: Response) => {
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
        const meeting = await getAnnualGeneralMeetingByIdService(String(id), userId, userRole, userDistrictId, isHq);
        return returnResponse(res).ok('Annual General Meeting fetched successfully', meeting);
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('Error fetching Annual General Meeting by ID:', error);
        return returnResponse(res).error('Failed to fetch Annual General Meeting', null);
    }
};

export const resubmitAnnualGeneralMeetingController = async (req: IAuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        if (!id) {
            throw new AppError('ID parameter is required', 400);
        }
        if (!userId) {
            throw new AppError('Authentication required', 401);
        }

        const updatedMeeting = await resubmitAnnualGeneralMeetingService(String(id), req.body, userId);
        return returnResponse(res).ok('Annual General Meeting corrected and re-submitted successfully', updatedMeeting);
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('Error resubmitting Annual General Meeting:', error);
        return returnResponse(res).error('Failed to re-submit Annual General Meeting', null);
    }
};