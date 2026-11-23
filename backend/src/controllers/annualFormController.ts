import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import { Request, Response } from "express";
import { returnResponse } from "../utils/response";
import { IAuthRequest } from "../types";
import { 
  createAnnualForm, 
  getAnnualFormById, 
  updateAnnualForm, 
  updateAnnualFormStatus, 
  deleteAnnualForm, 
  getAllAnnualForms, 
  getAnnualFormsBySocietyId,
  getFirstAvailableDistrictId
} from "../services/AnnualFormService";

export const getAnnualForms = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const filters = {
      society_id: req.query.society_id as string,
      status: req.query.status as string,
      from: req.query.from as string,
      to: req.query.to as string
    };
    const userId = (req as IAuthRequest)?.user?.userId;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const result = await getAllAnnualForms(page, limit, filters, search, userId);

    returnResponse(res).ok('Annual forms retrieved successfully', {
      annualForms: result.annualForms,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get annual forms:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getAnnualFormByIdController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = (req as IAuthRequest)?.user?.userId;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const annualForm = await getAnnualFormById(id, userId);

    returnResponse(res).ok('Annual form retrieved successfully', annualForm);
  } catch (error) {
    logger.error('Failed to get annual form:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const createAnnualFormController = async (req: IAuthRequest, res: Response) => {
  try {
    const annualFormData = req.body;
    const userId = req?.user?.userId as string;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const newAnnualForm = await createAnnualForm(annualFormData, req);

    return returnResponse(res).ok('Annual form created successfully', newAnnualForm);
  } catch (error: any) {
        
    // Handle specific duplicate financial year error
    if (error instanceof AppError && error.message.includes('Annual form already exists for this society and financial year')) {
      logger.info('Caught duplicate financial year error, returning user-friendly message');
      return returnResponse(res).error('An annual form already exists for this society and financial year. Please use a different financial year or update the existing form.', null);
    }
    
    // Handle district not found error
    if (error instanceof AppError && error.message.includes('District not found')) {
      logger.info('Caught district not found error, returning user-friendly message');
      return returnResponse(res).error('The district associated with this society could not be found. Please contact support.', null);
    }
    
    // Handle other AppError instances
    if (error instanceof AppError) {
      logger.info('Caught AppError, returning error message:', error.message);
      return returnResponse(res).error('Failed to create annual form', null);
    }
    
    // Handle generic errors
    logger.info('Caught generic error, returning generic message');
    return returnResponse(res).error('Failed to create annual form. Please try again.', null);
  }
};

export const updateAnnualFormController = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const updateData = req.body;
    const userId = req?.user?.userId as string;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const updatedAnnualForm = await updateAnnualForm(id, updateData, req);

    return returnResponse(res).ok('Annual form updated successfully', updatedAnnualForm);
  } catch (error: any) {
    logger.error('Failed to update annual form:', error);
    logger.error('Error type:', typeof error);
    logger.error('Error constructor:', error?.constructor?.name);
    logger.error('Error message:', error?.message);
    
    // Handle specific duplicate financial year error
    if (error instanceof AppError && error.message.includes('Annual form already exists for this society and financial year')) {
      logger.info('Caught duplicate financial year error, returning user-friendly message');
      return returnResponse(res).error('An annual form already exists for this society and financial year. Please use a different financial year.', null);
    }
    
    // Handle other AppError instances
    if (error instanceof AppError) {
      logger.info('Caught AppError, returning error message:', error.message);
      return returnResponse(res).error('Failed to update annual form', null);
    }
    
    // Handle generic errors
    logger.info('Caught generic error, returning generic message');
    return returnResponse(res).error('Failed to update annual form. Please try again.', null);
  }
};

export const updateAnnualFormStatusController = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, remarks } = req.body;
    const userId = req?.user?.userId as string;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    if (!status) {
      throw new AppError('Status is required', 400);
    }

    const updatedAnnualForm = await updateAnnualFormStatus(id, { status, remarks }, req);

    returnResponse(res).ok('Annual form status updated successfully', updatedAnnualForm);
  } catch (error) {
    logger.error('Failed to update annual form status:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const deleteAnnualFormController = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req?.user?.userId as string;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const result = await deleteAnnualForm(id, req);

    return returnResponse(res).ok('Annual form deleted successfully', result);
  } catch (error) {
    logger.error('Failed to delete annual form:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Helper endpoint to get district information for debugging
export const getDistrictInfoController = async (req: Request, res: Response) => {
  try {
    const districtId = await getFirstAvailableDistrictId();
    return returnResponse(res).ok('District information retrieved successfully', { 
      message: 'Use this district ID to fix societies with invalid district_id',
      valid_district_id: districtId,
      sql_command: `UPDATE society_registrations SET district_id = '${districtId}' WHERE district_id = '1' OR district_id IS NULL;`
    });
  } catch (error) {
    logger.error('Failed to get district info:', error);
    if (error instanceof AppError) {
      return returnResponse(res).error('Failed to get district information', null);
    }
    return returnResponse(res).error('Failed to get district information', null);
  }
};

export const getAnnualFormsBySocietyIdController = async (req: Request, res: Response) => {
  try {
    const societyId = req.params.societyId as string;
    const userId = (req as IAuthRequest)?.user?.userId;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const annualForms = await getAnnualFormsBySocietyId(societyId, userId);

    returnResponse(res).ok('Annual forms retrieved successfully', annualForms);
  } catch (error) {
    logger.error('Failed to get annual forms by society ID:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};
