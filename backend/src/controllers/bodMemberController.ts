import { Response } from 'express';
import { IAuthRequest } from '../types';
import { returnResponse } from '../utils/response';
import logger from '../utils/logger';
import { AppError } from '../utils/errors';
import {
  createBodMemberService,
  getPromotersWithApprovedBodMembersBySocietyIdService
} from '../services/BodMemberService';

export const createBodMemberController = async (req: IAuthRequest, res: Response) => {
  try {
    const createdBy = req.user?.userId || null;
    const {
      society_id,
      agm_id,
      name,
      designation,
      gender,
      category,
      shareholder_category,
      mobile,
      is_co_opted
    } = req.body || {};
    const created = await createBodMemberService({
      society_id,
      agm_id,
      name,
      designation,
      gender,
      category,
      shareholder_category,
      mobile,
      is_co_opted,
      created_by: createdBy
    });
    return returnResponse(res).ok('BOD member created successfully', created);
  } catch (error) {
    logger.error('Error creating BOD member:', error);
    if (error instanceof AppError) {
      return returnResponse(res).error(error.message, null);
    }
    return returnResponse(res).error('Failed to create BOD member', null);
  }
};

export const getBodMembersBySocietyController = async (req: IAuthRequest, res: Response) => {
  try {
    const { societyId } = req.params;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 100);
    const allMembers = await getPromotersWithApprovedBodMembersBySocietyIdService(String(societyId));
    const total = allMembers.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    return returnResponse(res).ok('Promoters and approved BOD members fetched successfully', {
      members: allMembers.slice(offset, offset + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    logger.error('Error getting BOD members:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to fetch BOD members', 500);
  }
};
