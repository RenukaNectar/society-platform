import { Response } from 'express';
import { createSpecialBoradMeetingService, getAllSpecialBoradMeetingsService, getSpecialBoradMeetingByIdService } from '../services/specialGeneralMeetingService';
import { IAuthRequest } from "../types";
import { returnResponse } from '../utils/response';
import logger from '../utils/logger';

export const createSpecialBoradMeetingController = async (req: IAuthRequest, res: Response) => {
    try {
        const boardMeetingData = req.body;
        const createdBy = req.user ? req.user.userId : null;

        const newBoardMeeting = await createSpecialBoradMeetingService(boardMeetingData, createdBy);
        return returnResponse(res).ok('Special Board Meeting created successfully', newBoardMeeting);
    } catch (error) {
        logger.error('Error creating Special Board Meeting:', error);
        const fallbackMessage =
            (error as any)?.original?.message ||
            (error as any)?.parent?.message ||
            (error as any)?.message ||
            'Failed to create Special Board Meeting';
        return returnResponse(res).error(fallbackMessage, null);
    }
};


export const getAllSpecialBoradMeetingsController = async (req: IAuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const society_id = req.query.society_id as string;
        const userId = req.user?.userId as string | undefined;
        const userRole = req.user?.role as string | undefined;
        const userDistrictId = req.user?.district_id as string | undefined;
        const isHq = Boolean(req.user?.is_hq);

        const result = await getAllSpecialBoradMeetingsService(
            page,
            limit,
            search,
            society_id,
            userId,
            userRole,
            userDistrictId,
            isHq
        );
        return returnResponse(res).ok('Special Board Meetings fetched successfully', {
            meetings: result.meetings,
            pagination: result.pagination
        });
    }
    catch (error) {
        logger.error('Error fetching Special Board Meetings:', error);
        return returnResponse(res).error('Failed to fetch Special Board Meetings', null);
    }
};
export const getByIdSpecialBoradMeetingController = async (req: IAuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        if (!id) {
            return returnResponse(res).error('ID parameter is required', null);
        }
        const userRole = req.user?.role as string | undefined;
        const userDistrictId = req.user?.district_id as string | undefined;
        const isHq = Boolean(req.user?.is_hq);
        const meeting = await getSpecialBoradMeetingByIdService(
            String(id),
            userId,
            userRole,
            userDistrictId,
            isHq
        );
        return returnResponse(res).ok('Special Board Meeting fetched successfully', meeting);
    } catch (error) {
        logger.error('Error fetching Special Board Meeting by ID:', error);
        return returnResponse(res).error('Failed to fetch Special Board Meeting', null);
    }
};