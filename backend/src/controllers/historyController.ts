import { Request, Response } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { returnResponse } from '../utils/response';
import {
  createHistory,
  findHistoryById,
  findHistoryByReference,
  findHistoryByResource,
  findHistoryByType,
  findHistoryByUser,
  updateHistory,
  deactivateHistory,
  deleteHistory,
  getAllHistory,
  logOperation
} from '../services/HistoryService';
import { IHistoryCreate, IHistoryUpdate } from '../types';

// Create history record
export const createHistoryRecord = async (req: Request, res: Response) => {
  try {
    const historyData: IHistoryCreate = req.body;
    const userId = (req as any).user?.userId;

    // Set created_by if not provided
    if (!historyData.created_by && userId) {
      historyData.created_by = userId;
    }

    const history = await createHistory(historyData);

    return returnResponse(res).ok('History record created successfully', history);
  } catch (error) {
    logger.error('Create history error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to create history record', 500);
  }
};

// Get history by ID
export const getHistoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('History ID is required', 400);
    }

    const history = await findHistoryById(id);

    if (!history) {
      throw new AppError('History record not found', 404);
    }

    return returnResponse(res).ok('History record retrieved successfully', history);
  } catch (error) {
    logger.error('Get history by ID error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get history record', 500);
  }
};

// Get history by reference ID and resource
export const getHistoryByReference = async (req: Request, res: Response) => {
  try {
    const { referenceId, resource } = req.params;

    if (!referenceId || !resource) {
      throw new AppError('Reference ID and resource are required', 400);
    }

    const history = await findHistoryByReference(referenceId, resource);

    return returnResponse(res).ok('History records retrieved successfully', {
      history,
      total: history.length
    });
  } catch (error) {
    logger.error('Get history by reference error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get history records', 500);
  }
};

// Get history by resource
export const getHistoryByResource = async (req: Request, res: Response) => {
  try {
    const { resource } = req.params;
    const { page = 1, limit = 1000 } = req.query;

    if (!resource) {
      throw new AppError('Resource is required', 400);
    }

    const result = await findHistoryByResource(
      resource,
      Number(limit),
      (Number(page) - 1) * Number(limit) // Convert page to offset
    );

    const totalPages = Math.ceil(result.total / Number(limit));

    return returnResponse(res).ok('History records retrieved successfully', {
      history: result.history,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    logger.error('Get history by resource error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get history records', 500);
  }
};

// Get history by type
export const getHistoryByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!type) {
      throw new AppError('Type is required', 400);
    }

    const result = await findHistoryByType(
      type,
      Number(limit),
      (Number(page) - 1) * Number(limit) // Convert page to offset
    );

    const totalPages = Math.ceil(result.total / Number(limit));

    return returnResponse(res).ok('History records retrieved successfully', {
      history: result.history,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    logger.error('Get history by type error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get history records', 500);
  }
};

// Get history by user
export const getHistoryByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    const result = await findHistoryByUser(
      userId,
      Number(limit),
      (Number(page) - 1) * Number(limit) // Convert page to offset
    );

    const totalPages = Math.ceil(result.total / Number(limit));

    return returnResponse(res).ok('History records retrieved successfully', {
      history: result.history,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    logger.error('Get history by user error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get history records', 500);
  }
};

// Update history record
export const updateHistoryRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: IHistoryUpdate = req.body;

    if (!id) {
      throw new AppError('History ID is required', 400);
    }

    const history = await updateHistory(id, updateData);

    if (!history) {
      throw new AppError('History record not found', 404);
    }

    return returnResponse(res).ok('History record updated successfully', history);
  } catch (error) {
    logger.error('Update history error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update history record', 500);
  }
};

// Deactivate history record
export const deactivateHistoryRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('History ID is required', 400);
    }

    const success = await deactivateHistory(id);

    if (!success) {
      throw new AppError('History record not found', 404);
    }

    return returnResponse(res).ok('History record deactivated successfully', null);
  } catch (error) {
    logger.error('Deactivate history error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to deactivate history record', 500);
  }
};

// Delete history record
export const deleteHistoryRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('History ID is required', 400);
    }

    const success = await deleteHistory(id);

    if (!success) {
      throw new AppError('History record not found', 404);
    }

    return returnResponse(res).ok('History record deleted successfully', null);
  } catch (error) {
    logger.error('Delete history error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete history record', 500);
  }
};

/** GET /:resourcePath/:id/history — processing comments + documents for a module record. */
export const getEntityProcessingHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const historyResources: string[] = Array.isArray((req as any).historyResources)
      ? (req as any).historyResources
      : [];

    if (!id) {
      throw new AppError('Resource ID is required', 400);
    }

    const limit = 1000;
    let history: Awaited<ReturnType<typeof findHistoryByReference>> = [];

    if (historyResources.length > 0) {
      const merged = new Map<string, (typeof history)[number]>();
      for (const resource of historyResources) {
        const rows = await findHistoryByReference(id, resource);
        for (const row of rows) {
          if (row?.id) {
            merged.set(String(row.id), row);
          }
        }
      }
      history = Array.from(merged.values()).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } else {
      const result = await getAllHistory(id, limit, 0);
      history = result.history;
    }

    return returnResponse(res).ok('History records retrieved successfully', {
      history,
      total: history.length,
    });
  } catch (error) {
    logger.error('Get entity processing history error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get history records', 500);
  }
};

// Get all history with filters
export const getAllHistoryRecords = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, resource, type, created_by, active, startDate, endDate } = req.query;

    const filters: any = {};

    if (resource) filters.resource = resource as string;
    if (type) filters.type = type as string;
    if (created_by) filters.created_by = created_by as string;
    if (active !== undefined) filters.active = active === 'true';
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const result = await getAllHistory(
      id || '',
      Number(limit),
      (Number(page) - 1) * Number(limit), // Convert page to offset
      filters
    );

    const totalPages = Math.ceil(result.pagination.total / Number(limit));

    return returnResponse(res).ok('History records retrieved successfully', {
      history: result.history,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.pagination.total,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    logger.error('Get all history error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get history records', 500);
  }
};

// Utility endpoint to log operation
export const logOperationRecord = async (req: Request, res: Response) => {
  try {
    const { resource, type, reference_id, comments } = req.body;
    const userId = (req as any).user?.userId;

    if (!resource || !type || !reference_id) {
      throw new AppError('Resource, type, and reference_id are required', 400);
    }

    await logOperation(resource, type, reference_id, userId, comments);

    return returnResponse(res).ok('Operation logged successfully', null);
  } catch (error) {
    logger.error('Log operation error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to log operation', 500);
  }
};
