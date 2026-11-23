import { Request, Response } from 'express';
import {
  createAmendment as createAmendmentService,
  getAmendmentById as getAmendmentByIdService,
  getAmendments as getAmendmentsService,
  updateAmendment as updateAmendmentService,
  getAmendmentsBySociety as getAmendmentsBySocietyService,
  updateAmendmentStatus as updateAmendmentStatusService,
  getAmendmentDetailsByUserId as getAmendmentDetailsByUserIdService,
  IAmendmentCreate,
  IAmendmentUpdate
} from '../services/AmendmentService';
import { returnResponse } from '../utils/response';
import logger from '../utils/logger';
import { checkPermission } from '../services/PermissionService';
import { IAuthRequest } from '../types';
import Amendment from '../models/Amendment';
import Status from '../models/Status';
import { findStatusByKey } from '../services/StatusService';

const isDraftSaveRequest = (body: Record<string, unknown>, draftStatusId?: string | null): boolean => {
  if (body.save_as_draft === true || body.saveAsDraft === true) {
    return true;
  }
  if (draftStatusId && body.status_id === draftStatusId) {
    return true;
  }
  return false;
};

/**
 * Create a new amendment
 */
export async function createAmendment(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const permission = await checkPermission('amendment', 'create', userId);
    if (!permission) {
      return returnResponse(res).error('You do not have permission to create amendments', null);
    }

    const societyId = req.body.society_id as string | undefined;
    const draftStatus = await findStatusByKey('draft');
    const existingAmendmentId = String(req.body.id || req.body.amendment_id || '').trim();

    // Applicant resubmit posts the existing amendment id (create permission only, no edit).
    if (existingAmendmentId && userId) {
      const existingAmendment = await Amendment.findByPk(existingAmendmentId, {
        include: [{ model: Status, as: 'status', required: false }]
      });

      if (existingAmendment) {
        if (existingAmendment.created_by && existingAmendment.created_by !== userId) {
          return returnResponse(res).error('You do not have permission to update this amendment', null);
        }

        const saveAsDraft = isDraftSaveRequest(req.body, draftStatus?.id);
        const { id: _id, amendment_id: _amendmentId, ...bodyWithoutId } = req.body;
        const updated = await updateAmendmentService(
          existingAmendment.id,
          {
            ...bodyWithoutId,
            updated_by: userId
          },
          req,
          { submit: !saveAsDraft }
        );
        if (!updated) {
          return returnResponse(res).error('Amendment not found', null);
        }
        const message = saveAsDraft
          ? 'Amendment draft saved successfully'
          : 'Amendment resubmitted successfully';
        return returnResponse(res).ok(message, updated);
      }
    }

    // Frontend may POST again to save/submit an existing draft (same society).
    if (societyId && userId && draftStatus?.id) {
      const existingDraft = await Amendment.findOne({
        where: {
          society_id: societyId,
          created_by: userId,
          status_id: draftStatus.id
        },
        include: [{ model: Status, as: 'status', required: false }]
      });

      if (existingDraft) {
        const saveAsDraft = isDraftSaveRequest(req.body, draftStatus.id);
        const updateData: IAmendmentUpdate = {
          ...req.body,
          updated_by: userId
        };
        const updated = await updateAmendmentService(
          existingDraft.id,
          updateData,
          req,
          { submit: !saveAsDraft }
        );
        if (!updated) {
          return returnResponse(res).error('Amendment not found', null);
        }
        const message = saveAsDraft
          ? 'Amendment draft saved successfully'
          : 'Amendment submitted successfully';
        return returnResponse(res).ok(message, updated);
      }
    }

    logger.info('Creating amendment request', {
      user_id: userId,
      body_keys: Object.keys(req.body)
    });

    const amendmentData: IAmendmentCreate = {
      ...req.body,
      created_by: userId
    };



    const amendment = await createAmendmentService(amendmentData, req);
    return returnResponse(res).ok('Amendment created successfully', amendment);
  } catch (error) {
    logger.error('Error in createAmendment controller', {
      error: error instanceof Error ? error.message : String(error),
      user_id: (req as any).user?.userId
    });
    return returnResponse(res).error('Failed to create amendment', error);
  }
}

/**
 * Get amendment by ID
 */
export async function getAmendmentById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as IAuthRequest)?.user?.userId;
    logger.info('Getting amendment by ID request', { amendment_id: id, user_id: userId });

    if (!id) {
      logger.warn('Amendment ID missing in request');
      return returnResponse(res).error('Amendment ID is required', null);
    }

    const amendment = await getAmendmentByIdService(id, userId);

    if (!amendment) {
      logger.warn('Amendment not found in controller', { amendment_id: id });
      return returnResponse(res).ok('Amendment not found', null);
    }

    logger.info('Amendment retrieved successfully in controller', { amendment_id: id });
    return returnResponse(res).ok('Amendment retrieved successfully', amendment);
  } catch (error) {
    logger.error('Error in getAmendmentById controller', {
      amendment_id: req.params.id,
      error: error instanceof Error ? error.message : String(error)
    });
    return returnResponse(res).error('Failed to retrieve amendment', error);
  }
}

/**
 * Get all amendments with pagination and filters
 */
export async function getAmendments(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      society_id: req.query.society_id as string,
      created_by: req.query.created_by as string,
      status: req.query.status as string,
      from: req.query.from as string,
      to: req.query.to as string
    };
    const search = req.query.search as string;
    const userId = (req as IAuthRequest)?.user?.userId;

    logger.info('Getting amendments request', {
      page,
      limit,
      filters,
      user_id: userId,
      headers: req.headers
    });

    const result = await getAmendmentsService(page, limit, filters, userId, search);

    logger.info('Amendments retrieved successfully in controller', {
      total: result.total,
      returned: result.amendments.length
    });
    return returnResponse(res).ok('Amendments retrieved successfully', {
      amendments: result.amendments,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1
      }
    });
  } catch (error) {
    logger.error('Error in getAmendments controller', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      query: req.query,
      user_id: (req as any).user?.userId
    });
    return returnResponse(res).error('Failed to retrieve amendments', error);
  }
}

/**
 * Update amendment
 */
export async function updateAmendment(req: IAuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const canEdit = await checkPermission('amendment', 'edit', userId);
    const canCreate = await checkPermission('amendment', 'create', userId);
    if (!canEdit && !canCreate) {
      return returnResponse(res).error('You do not have permission to update amendments', null);
    }

    if (!id) {
      return returnResponse(res).error('Amendment ID is required', null);
    }

    if (!userId) {
      return returnResponse(res).error('User not authenticated', null);
    }

    const updateData: IAmendmentUpdate = {
      ...req.body,
      updated_by: userId
    };

    const amendment = await updateAmendmentService(id, updateData, req);

    if (!amendment) {
      return returnResponse(res).error('Amendment not found', null);
    }

    return returnResponse(res).ok('Amendment resubmitted successfully', amendment);
  } catch (error) {
    return returnResponse(res).error('Failed to update amendment', error);
  }
}
/**
 * Get amendments by society ID
 */
export async function getAmendmentsBySociety(req: Request, res: Response) {
  try {
    const { societyId } = req.params;
    const userId = (req as IAuthRequest)?.user?.userId;
    if (!societyId) {
      return returnResponse(res).error('Society ID is required', null);
    }

    const amendments = await getAmendmentsBySocietyService(societyId, userId);

    return returnResponse(res).ok('Amendments retrieved successfully', amendments);
  } catch (error) {
    return returnResponse(res).error('Failed to retrieve amendments', error);
  }
}

/**
 * Update amendment status
 */
export async function updateAmendmentStatus(req: IAuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).user?.userId;

    if (!id) {
      return returnResponse(res).error('Amendment ID is required', null);
    }

    if (!status) {
      return returnResponse(res).error('Status is required', null);
    }

    if (!userId) {
      return returnResponse(res).error('User not authenticated', null);
    }

    const amendment = await updateAmendmentStatusService(id, status, userId, req, req?.user);

    if (!amendment) {
      return returnResponse(res).error('Amendment not found', null);
    }

    return returnResponse(res).ok('Amendment status updated successfully', amendment);
  } catch (error: any) {
    return returnResponse(res).error('Failed to update amendment status', error.message);
  }
}

/**
 * Get amendment details by user ID
 */
export async function getAmendmentDetailsByUserId(req: IAuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req?.user?.userId as string;

    logger.info('Getting amendment details by user request', {
      user_id: id,
      requesting_user: userId
    });

    if (!id) {
      logger.warn('User ID missing in request');
      returnResponse(res).error('User ID is required', null);
    }

    const amendments = await getAmendmentDetailsByUserIdService(id as string);
    if (!amendments) {
      returnResponse(res).error('Amendment not found', null);
    }

    logger.info('Amendment details retrieved successfully for user in controller', {
      user_id: id
    });
    returnResponse(res).ok('Amendment details retrieved successfully', amendments);
  } catch (error) {
    logger.error('Error in getAmendmentDetailsByUserId controller', {
      user_id: req.params.id,
      error: error instanceof Error ? error.message : String(error)
    });
    returnResponse(res).error('Failed to retrieve amendment details for user', error);
  }
} 