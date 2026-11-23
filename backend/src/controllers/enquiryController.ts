import { Request, Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';
import { returnResponse } from '../utils/response';
import {
  IEnquiryCreateData,
  IEnquiryFilters,
  validateEnquiryData,
  createEnquiryRequest as createEnquiryRequestService,
  getEnquiryRequestById as getEnquiryRequestByIdService,
  getEnquiryRequests as getEnquiryRequestsService,
  updateEnquiryStatus as updateEnquiryStatusService,
  deleteEnquiryRequest as deleteEnquiryRequestService,
  canApplicantAccessEnquiry,
  resolveApplicantSocietyId,
} from '../services/EnquiryService';
import User from '../models/user';
import { AppError, ValidationError } from '../utils/errors';

// Create enquiry request
export const createEnquiryRequest = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) {
      throw new Error('User not authenticated');
    }

    const enquiryData: IEnquiryCreateData = req.body;

    // Validate enquiry data
    const validation = await validateEnquiryData(enquiryData, req.user.role);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join(', '), validation.errors);
    }

    // Create enquiry request using service
    const enquiry = await createEnquiryRequestService(enquiryData, req.user.userId, req);

    return returnResponse(res).ok('Enquiry request created successfully', enquiry);
  } catch (error) {
    next(error);
  }
};

// Get all enquiry requests with filters
export const getEnquiryRequests = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters: IEnquiryFilters = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      status: req.query.status as string,
      applicant_type: req.query.applicant_type as string,
      subject: req.query.subject as string,
      district_id: req.query.district_id as string,
      society_id: req.query.society_id as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string
    };
    const search = req.query.search as string;
    const userId = req.user?.userId;
    const userDistrictId =
      req.user?.district_id ||
      (userId ? (await User.findOne({ where: { id: userId }, attributes: ['district_id'] }))?.district_id : undefined);
    const userRole = req.user?.role;
    let applicantSocietyId: string | undefined;
    if (userRole === 'applicant' && userId) {
      applicantSocietyId = (await resolveApplicantSocietyId(userId)) ?? undefined;
    }

    const authenticatedUser = {
      district_id: userDistrictId,
      role: userRole,
      userId: userId,
      is_hq: Boolean(req.user?.is_hq),
      society_id: applicantSocietyId,
    };

    // Get enquiry requests using service
    const result = await getEnquiryRequestsService(filters, search, authenticatedUser);

    return returnResponse(res).ok('Enquiry requests retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

// Get enquiry request by ID
export const getEnquiryRequestById = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new Error('Enquiry ID is required');
    }

    // Get enquiry request using service
    const enquiry = await getEnquiryRequestByIdService(id);

    if (!enquiry) {
      throw new Error('Enquiry request not found');
    }

    if (req.user?.role === 'applicant' && req.user.userId) {
      const applicantSocietyId = await resolveApplicantSocietyId(req.user.userId);
      if (!canApplicantAccessEnquiry(enquiry, req.user.userId, applicantSocietyId)) {
        throw new AppError('You are not authorized to view this enquiry', 403);
      }
    }

    return returnResponse(res).ok('Enquiry request retrieved successfully', enquiry);
  } catch (error) {
    next(error);
  }
};

// Update enquiry request status
export const updateEnquiryStatus = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status_id, remarks } = req.body;

    if (!id) {
      throw new Error('Enquiry ID is required');
    }

    if (!status_id) {
      throw new Error('Status ID is required');
    }

    if (!req.user?.userId) {
      throw new Error('User not authenticated');
    }

    // Update status using service
    const updatedEnquiry = await updateEnquiryStatusService(
      id,
      status_id,
      req.user.userId,
      remarks
    );

    return returnResponse(res).ok('Enquiry status updated successfully', updatedEnquiry);
  } catch (error) {
    next(error);
  }
};

// Delete enquiry request
export const deleteEnquiryRequest = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new Error('Enquiry ID is required');
    }

    if (!req.user?.userId) {
      throw new Error('User not authenticated');
    }

    // Delete enquiry using service
    await deleteEnquiryRequestService(id, req.user.userId);

    return returnResponse(res).ok('Enquiry request deleted successfully', null);
  } catch (error) {
    next(error);
  }
};
