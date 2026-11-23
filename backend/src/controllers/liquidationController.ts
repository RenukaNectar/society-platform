import { Response } from 'express';
import { IAuthRequest } from '../types';
import { create, update as updateLiquidationService, getById, getAll } from '../services/LiquidationService';
import { AppError } from '../utils/errors';
import { returnResponse } from '../utils/response';
import logger from '../utils/logger';

/** Roles that start the RCS office liquidation flow (LIQUIDATION_RCS). */
const LIQUIDATION_RCS_INITIATOR_ROLES = new Set(['jics_sics_hq']);

/** Required when the society files the liquidation. Optional when an office user files it. */
const SOCIETY_LIQUIDATION_DOCUMENT_FIELDS = [
  'minutes_meeting_media_id',
  'attendance_sheet_media_id',
  'circular_notice_media_id',
  'members_list_media_id',
] as const;

/**
 * Create a new liquidation
 */
export const createLiquidation = async (req: IAuthRequest, res: Response) => {
  try {
    const liquidationData = req.body;
    const userId = req.user?.userId;
    const userDistrictId = req.user?.district_id;
    const roleName = String(req.user?.role || '').trim();

    // Add created_by if user is authenticated
    if (userId) {
      liquidationData.created_by = userId;
    }

    // Who started this liquidation: 'applicant' | 'rcs'.
    // Role-based (not users.is_hq):
    //   applicant      → LIQUIDATION
    //   jics_sics_hq   → LIQUIDATION_RCS
    // Fallback: body.initiated_by, then is_hq for other roles.
    let initiatedBy: 'applicant' | 'rcs' = 'applicant';
    if (roleName === 'applicant') {
      initiatedBy = 'applicant';
    } else if (LIQUIDATION_RCS_INITIATOR_ROLES.has(roleName)) {
      initiatedBy = 'rcs';
    } else if (req.body?.initiated_by === 'rcs' || req.body?.initiated_by === 'applicant') {
      initiatedBy = req.body.initiated_by;
    } else if (req.user?.is_hq === true) {
      initiatedBy = 'rcs';
    }

    logger.info('Liquidation create flow selected', {
      userId,
      roleName,
      initiatedBy,
      module: initiatedBy === 'rcs' ? 'LIQUIDATION_RCS' : 'LIQUIDATION'
    });

    if (roleName === 'applicant') {
      const missingDocuments = SOCIETY_LIQUIDATION_DOCUMENT_FIELDS.filter((field) => {
        const value = liquidationData[field];
        return value == null || String(value).trim() === '';
      });
      if (missingDocuments.length > 0) {
        return returnResponse(res).error(
          'Document uploads are required when liquidation is initiated by the society',
          { missingDocuments }
        );
      }
    }

    const liquidation = await create(liquidationData, userDistrictId, { initiatedBy });

    returnResponse(res).ok('Liquidation created successfully', liquidation);
  } catch (error: any) {
    logger.error('Error in create liquidation controller:', error);
    returnResponse(res).error('Failed to create liquidation', error.message);
  }
};

/**
 * Update an existing liquidation by ID
 */
export const updateLiquidation = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userDistrictId = req.user?.district_id;
    const userRole = req.user?.role;
    const liquidation = await updateLiquidationService(id, req.body, userDistrictId, userRole);

    if (!liquidation) {
      throw new AppError('Liquidation not found or access denied', 404);
    }

    returnResponse(res).ok('Liquidation updated successfully', liquidation);
  } catch (error: any) {
    logger.error('Error in update liquidation controller:', error);
    returnResponse(res).error('Failed to update liquidation', error.message);
  }
};

/**
 * Get liquidation by ID
 */
export const getLiquidationById = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userDistrictId = req.user?.district_id;
    const userRole = req.user?.role;
    const liquidation = await getById(id as string, userDistrictId, userRole);

    if (!liquidation) {
      throw new AppError('Liquidation not found or access denied', 404);
    }

    returnResponse(res).ok('Liquidation retrieved successfully', liquidation);
  } catch (error) {
    logger.error(`Error in get liquidation by ID controller: ${req.params.id}`, error);
    returnResponse(res).error('Failed to get liquidation', error);
  }
};

/**
 * Get all liquidations with filters
 */
export const getAllLiquidations = async (req: IAuthRequest, res: Response) => {
  try {
    const filters = req.query;
    const userDistrictId = req.user?.district_id;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const search = req.query.search as string;

    // Pass user role and ID for role-based access control
    const result = await getAll(filters, userDistrictId, userId, userRole, search);

    returnResponse(res).ok('Liquidations retrieved successfully', result);
  } catch (error) {
    logger.error('Error in get all liquidations controller:', error);
    returnResponse(res).error('Failed to get all liquidations', error);
  }
};
