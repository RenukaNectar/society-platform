
import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import { getAllSocietyRegistrations, getSocietyDetailsById, submitDraftSocietyService } from "../services/SocietyRegistrationService";
import { Request, Response } from "express";
import { returnResponse } from "../utils/response";
import { IAuthRequest } from "../types";
import { findUserById } from "../services/UserService";
import { logOperation } from "../services/HistoryService";
import { findStatusById, findStatusByKey } from "../services/StatusService";
import { getSocietyRegistrationById } from "../services/SocietyRegistrationService";

export const getSocieties = async (req: IAuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const userId = req?.user?.userId as string;

    // Extract filters from query parameters
    const filters: any = {};

    if (req.query.status) filters.status = req.query.status;
    if (req.query.reference_year) filters.reference_year = req.query.reference_year;
    if (req.query.district_id) filters.district_id = req.query.district_id;
    if (req.query.state_id) filters.state_id = req.query.state_id;
    if (req.query.cooperative_society_type_id) filters.cooperative_society_type_id = req.query.cooperative_society_type_id;
    if (req.query.functional_status) filters.functional_status = req.query.functional_status;
    if (req.query.from) filters.from = req.query.from;
    if (req.query.to) filters.to = req.query.to;
    if (req.query.has_applicant !== undefined) filters.has_applicant = req.query.has_applicant;

    const societies = await getAllSocietyRegistrations(page, limit, search, userId, filters);
    returnResponse(res).ok('Societies retrieved successfully', societies);
  } catch (error) {
    logger.error('Failed to get societies:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: req?.user?.userId,
      query: req.query
    });
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error instanceof Error ? error.message : 'Failed to get societies', 500);
  }
};

export const getSocietyById = async (req: Request, res: Response) => {
  try {
    const societyId = req.params.id as string;
    const society = await getSocietyDetailsById(societyId);

    if (!society) {
      returnResponse(res).error('Society not found', null);
    }

    returnResponse(res).ok('Society retrieved successfully', society);
  } catch (error) {
    logger.error('Failed to get society by id:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get society', 500);
  }
};

export const submitDraftController = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    if (!id || !req.user?.userId || !(await getSocietyRegistrationById(id))) {
      throw new AppError('Society ID is required or invalid', 400);
    }
    const response = await submitDraftSocietyService(id, req);
    if (!response) {
      returnResponse(res).error('Failed to submit draft', 400);
    }
    returnResponse(res).ok('Draft submitted successfully', response);
  } catch (error) {
    logger.error('Error submitting draft:', error);
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof Error) {
      const errorAny = error as { statusCode?: number };
      const statusCode = typeof errorAny?.statusCode === 'number' ? errorAny.statusCode : 500;
      throw new AppError(error.message || 'Failed to submit draft', statusCode);
    }
    throw new AppError('Failed to submit draft', 500);
  }
};