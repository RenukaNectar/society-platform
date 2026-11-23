import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import {
  getNextRegistrationNumber,
  validateRegistrationNumberFormat,
  getRegistrationNumberStatistics,
  getRegistrationNumberInfo
} from "../services/RegistrationNumberService";
import { returnResponse } from "../utils/response";
import { Request, Response } from "express";

export const getNextRegistrationNumberController = async (req: Request, res: Response) => {
  try {
    const result = await getNextRegistrationNumber();

    returnResponse(res).ok('Next registration number retrieved successfully', result);
  } catch (error) {
    logger.error('Failed to get next registration number:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const validateRegistrationNumberController = async (req: Request, res: Response) => {
  try {
    const registrationNumber = req.params.registrationNumber as string;
    const result = await validateRegistrationNumberFormat(registrationNumber);

    returnResponse(res).ok('Registration number validated successfully', {
      registrationNumber,
      isValid: result.isValid,
      parsed: result.parsed
    });
  } catch (error) {
    logger.error('Failed to validate registration number:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getRegistrationNumberStatisticsController = async (req: Request, res: Response) => {
  try {
    const stats = await getRegistrationNumberStatistics();

    returnResponse(res).ok('Registration number statistics retrieved successfully', stats);
  } catch (error) {
    logger.error('Failed to get registration number statistics:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getRegistrationNumberInfoController = async (req: Request, res: Response) => {
  try {
    const registrationNumber = req.params.registrationNumber as string;
    const info = await getRegistrationNumberInfo(registrationNumber);

    returnResponse(res).ok('Registration number information retrieved successfully', info);
  } catch (error) {
    logger.error('Failed to get registration number info:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
}; 