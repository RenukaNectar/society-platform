import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import {
  getAllMembers,
  getMemberById,
  getMembersBySocietyId,
  createMember,
  createMultipleMembers,
  updateMember,
  deleteMember,
  deleteMembersBySocietyId,
  getBodMembersService,
  sendBodOtpService,
  verifyBodOtpService
} from "../services/MemberService";
import { returnResponse } from "../utils/response";
import { Request, Response } from "express";
import { IAuthRequest } from "../types";

export const getMembers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const societyId = req.query.society_id as string;

    const result = await getAllMembers(page, limit, search, societyId);

    returnResponse(res).ok('Members retrieved successfully', {
      members: result.members,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get members:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getMemberByIdController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as any;
    const member = await getMemberById(id);

    if (!member) {
      throw new AppError('Member not found', 404);
    }

    returnResponse(res).ok('Member retrieved successfully', member);
  } catch (error) {
    logger.error('Failed to get member:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getMembersBySocietyIdController = async (req: Request, res: Response) => {
  try {
    const societyId = req.params.societyId as string;
    const members = await getMembersBySocietyId(societyId);

    returnResponse(res).ok('Members retrieved successfully', members);
  } catch (error) {
    logger.error('Failed to get members by society ID:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const createMemberController = async (req: Request, res: Response) => {
  try {
    const memberData = req.body;
    const newMember = await createMember(memberData);

    returnResponse(res).ok('Member created successfully', newMember);
  } catch (error) {
    logger.error('Failed to create member:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const createMultipleMembersController = async (req: Request, res: Response) => {
  try {
    const { members } = req.body;
    const result = await createMultipleMembers(members);

    returnResponse(res).ok(`Members created successfully`, result);
  } catch (error) {
    logger.error('Failed to create multiple members:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const updateMemberController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const updateData = req.body;
    
    const updatedMember = await updateMember(id, updateData);

    if (!updatedMember) {
      throw new AppError('Member not found', 404);
    }

    returnResponse(res).ok('Member updated successfully', updatedMember);
  } catch (error) {
    logger.error('Failed to update member:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const deleteMemberController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const deletedMember = await deleteMember(id);

    if (!deletedMember) {
      throw new AppError('Member not found', 404);
    }

    returnResponse(res).ok('Member deleted successfully', null);
  } catch (error) {
    logger.error('Failed to delete member:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const deleteMembersBySocietyIdController = async (req: Request, res: Response) => {
  try {
    const societyId = req.params.societyId as string;
    const result = await deleteMembersBySocietyId(societyId);

    returnResponse(res).ok(`${result.deletedCount} members deleted successfully`, null);
  } catch (error) {
    logger.error('Failed to delete members by society ID:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
}; 

export const getBodMembersController = async (req: Request, res: Response) => {
  try {
    const moduleName = req.query.module_name as string;
    if(!req.params.society_id) {
      returnResponse(res).ok('Society ID is required', null);
    }
    if(!moduleName || !['liquidation', 'conversion'].includes(moduleName)) {
      returnResponse(res).error('Module name is required and must be either liquidation or conversion', null);
    }
    const societyId = req.params.society_id as string;
    const result = await getBodMembersService(societyId, moduleName);
    returnResponse(res).ok('BOD members retrieved successfully', result);
  } catch (error) {
    logger.error('Failed to get BOD members:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const sendBodOtpController = async (req: IAuthRequest, res: Response) => {
  try {
    const { members_id, society_id, module_name } = req.body;
    const userId = req.user?.userId;

    if(!members_id || !society_id || !module_name || !userId) {
      returnResponse(res).error('Members ID, Society ID, Module name and User ID are required', null);
    }
    const result = await sendBodOtpService(members_id, society_id, module_name, userId);
    returnResponse(res).ok('OTP sent successfully', result);
  } catch (error) {
    logger.error('Failed to send BOD OTP:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const verifyBodOtpController = async (req: IAuthRequest, res: Response) => {
  try {
    const { members_id, society_id, otp, module_name } = req.body;
    const userId = req.user?.userId;
    if(!members_id || !society_id || !otp || !module_name || !userId) {
      return returnResponse(res).error('Members ID, Society ID, OTP and Module name are required', null);
    }
    const result = await verifyBodOtpService(members_id, society_id, otp, module_name, userId);
    returnResponse(res).ok('BOD OTP verified successfully', result);
  } catch (error) {
    logger.error('Failed to verify BOD OTP:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};