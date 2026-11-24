import { Request, Response } from "express";
import { IAuthRequest } from "../types";
import { returnResponse } from "../utils/response";
import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import {
  createSocietyRenewal,
  updateSocietyRenewal,
  deleteSocietyRenewal,
  getAllSocietyRenewals,
  getSocietyRenewalsBySocietyId
} from "../services/SocietyRenewalService";
import { findStatusByKey } from "../services/StatusService";
import { findUserById } from "../services/UserService";
import { uploadMedia } from "../services/MediaService";
import User from "../models/user";
import Role from "../models/Role";
import SocietyRenewal from "../models/SocietyRenewal";
import Status from "../models/Status";
import SocietyRegistration from "../models/SocietyRegistration";

export const createSocietyRenewalController = async (req: IAuthRequest, res: Response) => {
  try {
    const { society_id, challan_url } = req.body;
    const userId = req.user?.userId;
    let finalChallanUrl = challan_url;

    // Check if user is authenticated
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    // Verify user is an applicant
    const user = await findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.role || user.role.name !== 'applicant') {
      throw new AppError('Only applicants can create society renewals', 403);
    }

    // check if society exists with  same status
    if (!society_id) {
      throw new AppError('Society ID is required', 400);
    }

    // Handle file upload if a file was uploaded
    if (req.file) {
      try {
        const fileData = {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          buffer: req.file.buffer,
          userId: userId
        };
        finalChallanUrl = await uploadMedia(fileData);
        logger.info('Challan file uploaded successfully', { url: finalChallanUrl });
      } catch (uploadError: any) {
        logger.error('Failed to upload challan file:', uploadError);
        throw new AppError(`Failed to upload challan file: ${uploadError.message}`, 400);
      }
    }

    // Validate challan_url (either from file upload or provided URL)
    if (!finalChallanUrl) {
      throw new AppError('Either challan file upload or challan URL is required', 400);
    }

    // Validate URL format (if it's a string URL, not from file upload)
    if (!req.file && finalChallanUrl) {
      try {
        const url = new URL(finalChallanUrl);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new AppError('Challan URL must use http or https protocol', 400);
        }
      } catch (urlError) {
        throw new AppError('Challan URL must be a valid URL', 400);
      }
    }

    const renewalData = {
      ...req.body,
      challan_url: finalChallanUrl,
      status: (await findStatusByKey('renewal_challan_uploaded'))?.id,
      submit_date: new Date(),
      created_by: req.user?.userId
    };
    const newRenewal = await createSocietyRenewal(renewalData);

    return returnResponse(res).ok('Society renewal created successfully', newRenewal);
  } catch (error) {
    logger.error('Failed to create society renewal:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const updateSocietyRenewalController = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = req?.user?.userId;
    const { challan_url, society_id } = req.body;

    // Check renewal ID
    if (!id) {
      throw new AppError('Renewal ID is required', 400);
    }

    // Check user authentication
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    // Verify user exists and get role
    const user = await findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Fetch the existing renewal with status and society info
    const existingRenewal = await SocietyRenewal.findByPk(id, {
      include: [
        {
          model: Status,
          as: 'statusDetails',
          attributes: ['id', 'key', 'title']
        },
        {
          model: SocietyRegistration,
          as: 'society',
          attributes: ['id', 'society_id']
        }
      ]
    });

    if (!existingRenewal) {
      throw new AppError('Society renewal not found', 404);
    }

    // Check challan key - verify status is related to challan
    const renewalData = existingRenewal.toJSON() as any;
    const statusKey = renewalData.statusDetails?.key;

    if (!statusKey || !statusKey.includes('challan')) {
      throw new AppError('Renewal status must be related to challan to update', 400);
    }

    // Check society_id if provided in update
    if (society_id !== undefined && society_id !== null) {
      if (society_id !== renewalData.society_id) {
        throw new AppError('Society ID cannot be changed', 400);
      }
    }

    // For applicants, verify they own this renewal
    if (user.role && user.role.name === 'applicant') {
      if (renewalData.created_by !== userId) {
        throw new AppError('You can only update your own renewals', 403);
      }
    }

    // Validate challan_url if provided
    if (challan_url !== undefined && challan_url !== null) {
      if (typeof challan_url !== 'string' || challan_url.trim() === '') {
        throw new AppError('Challan URL must be a non-empty string', 400);
      }

      // Validate URL format
      try {
        const url = new URL(challan_url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new AppError('Challan URL must use http or https protocol', 400);
        }
      } catch (urlError) {
        throw new AppError('Challan URL must be a valid URL', 400);
      }
    }

    const updateData = {
      ...req.body,
      updated_by: userId
    };

    const updatedRenewal = await updateSocietyRenewal(id, updateData);

    return returnResponse(res).ok('Society renewal updated successfully', updatedRenewal);
  } catch (error) {
    logger.error('Failed to update society renewal:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const deleteSocietyRenewalController = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user?.userId;

    if (!id) {
      throw new AppError('Renewal ID is required', 400);
    }

    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    await deleteSocietyRenewal(id, userId);

    return returnResponse(res).ok('Renewal challan removed successfully', null);
  } catch (error) {
    logger.error('Failed to delete society renewal:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getAllSocietyRenewalsController = async (req: IAuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;

    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.society_id) filters.society_id = req.query.society_id;
    if (req.query.from) filters.from = req.query.from;
    if (req.query.to) filters.to = req.query.to;

    // Get authenticated user information for role-based filtering
    const userId = req.user?.userId;
    let userRole: string | undefined;
    let userDistrictId: string | null | undefined;
    let isHq: boolean = false;

    if (userId) {
      const user = await User.findOne({ 
        where: { id: userId },
        include: [
          {
            model: Role,
            as: 'role',
            attributes: ['id', 'name']
          }
        ]
      });
      
      // Extract role name (handle both string and object formats)
      if (user) {
        userDistrictId = user?.district_id || null;
        isHq = !!(user as any).is_hq || false;
        // Check if role is an object with name property, or if it's already a string
        const userRoleObj = (user as any).role;
        userRole = userRoleObj?.name || userRoleObj || req.user?.role;
      }
    }

    // Prepare authenticated user object
    const authenticatedUser = {
      userId: userId,
      role: userRole,
      district_id: userDistrictId,
      is_hq: isHq
    };

    const result = await getAllSocietyRenewals(page, limit, search, filters, authenticatedUser);

    return returnResponse(res).ok('Society renewals retrieved successfully', {
      renewals: result.renewals,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get all society renewals:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getSocietyRenewalsBySocietyIdController = async (req: IAuthRequest, res: Response) => {
  try {
    const { society_id } = req.params as { society_id: string };

    if (!society_id) {
      throw new AppError('Society ID is required', 400);
    }

    const renewals = await getSocietyRenewalsBySocietyId(society_id);

    return returnResponse(res).ok('Society renewals retrieved successfully', renewals);
  } catch (error) {
    logger.error('Failed to get society renewals by society ID:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};
