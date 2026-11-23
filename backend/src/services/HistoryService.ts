import { Op } from 'sequelize';
import History from '../models/History';
import User from '../models/user';
import Role from '../models/Role';
import Media from '../models/Media';
import Activity from '../models/Activity';
import { IHistory, IHistoryCreate, IHistoryUpdate } from '../types';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { extractDocumentMediaIds } from './WorkflowCommentService';

// Create history record
export const createHistory = async (historyData: IHistoryCreate): Promise<IHistory> => {
  let payload: any = { ...historyData };
  try {
    if (payload.data != null && typeof payload.data === 'object') {
      payload.data = JSON.stringify(payload.data);
    }

    logger.debug('Creating history record with data:', payload);

    const history = await History.create(payload);

    logger.info('History record created successfully', {
      historyId: history.id,
      resource: history.resource,
      referenceId: history.reference_id,
      type: history.type,
      createdBy: history.created_by
    });

    return history.toJSON();
  } catch (error: any) {
    // Log specific database errors
    if (error.name === 'SequelizeValidationError') {
      logger.error('History validation error:', {
        error: error.message,
        validationErrors: error.errors?.map((e: any) => ({ field: e.path, message: e.message, value: e.value })),
        data: payload
      });
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      logger.error('History foreign key constraint error:', {
        error: error.message,
        table: error.table,
        fields: error.fields,
        data: payload
      });
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      logger.error('History unique constraint error:', {
        error: error.message,
        fields: error.fields,
        data: payload
      });
    } else if (error.name === 'SequelizeDatabaseError') {
      logger.error('History database error:', {
        error: error.message,
        sql: error.sql,
        data: payload
      });
    } else {
      logger.error('Failed to create history record:', {
        error: error.message,
        errorName: error.name,
        stack: error.stack,
        data: payload
      });
    }

    throw new AppError('Failed to create history record', 500);
  }
};

/** Parse history `data` JSON and attach `documents_media` (key → Media row) for workflow uploads. */
export const attachDocumentsMediaToHistoryRows = async (historyItems: IHistory[]): Promise<IHistory[]> => {
  if (!historyItems?.length) {
    return historyItems;
  }

  const pairLists: Array<Array<{ key: string; mediaId: string }>> = [];

  for (const item of historyItems) {
    let parsed: any = null;
    const raw = (item as any).data;
    if (raw) {
      try {
        parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch {
        parsed = null;
      }
    }
    const pairs = parsed?.documents ? extractDocumentMediaIds(parsed.documents) : [];
    pairLists.push(pairs);
  }

  // Legacy: workflow stored documents only on Activity, not History.data — match by reference, user, and time.
  const refId = (historyItems[0] as any)?.reference_id as string | undefined;
  const needsActivityFallback = refId && pairLists.some((p) => p.length === 0);
  if (needsActivityFallback) {
    const activities = await Activity.findAll({
      where: { reference_id: refId },
      order: [['created_at', 'DESC']],
      limit: 200,
      attributes: ['id', 'created_at', 'created_by', 'data']
    });

    for (let i = 0; i < historyItems.length; i++) {
      const rowPairs = pairLists[i] ?? [];
      if (rowPairs.length > 0) continue;
      const h = historyItems[i] as any;
      const hTime = new Date(h.created_at).getTime();
      const hUser = h.created_by;
      const hResource = h.resource;
      for (const act of activities as any[]) {
        const data = act?.data || {};
        if (data.moduleName && hResource && data.moduleName !== hResource) continue;
        if (!data.documents || typeof data.documents !== 'object') continue;
        if (hUser && act.created_by && String(act.created_by) !== String(hUser)) continue;
        const aTime = new Date(act.created_at).getTime();
        if (Number.isNaN(hTime) || Number.isNaN(aTime) || Math.abs(aTime - hTime) > 20000) continue;
        pairLists[i] = extractDocumentMediaIds(data.documents);
        break;
      }
    }
  }

  const allIds = new Set<string>();
  for (const pairs of pairLists) {
    for (const p of pairs) {
      const id = p.mediaId?.trim();
      if (id) allIds.add(id);
    }
  }

  if (allIds.size === 0) {
    return historyItems.map((item) => ({ ...(item as any), documents_media: {} })) as IHistory[];
  }

  const mediaRows = await Media.findAll({
    where: { id: { [Op.in]: Array.from(allIds) } },
    attributes: ['id', 'url', 'active', 'created_at', 'updated_at', 'created_by', 'updated_by']
  });
  const mediaById = new Map<string, Record<string, unknown>>();
  for (const row of mediaRows as any[]) {
    const j = row.toJSON ? row.toJSON() : row;
    if (j?.id) mediaById.set(j.id, j);
  }

  return historyItems.map((item, i) => {
    const documents_media: Record<string, unknown> = {};
    const rowPairs = pairLists[i] ?? [];
    for (const { key, mediaId } of rowPairs) {
      const id = mediaId?.trim();
      if (!id) continue;
      documents_media[key] = mediaById.get(id) ?? null;
    }
    return { ...(item as any), documents_media } as IHistory;
  });
};

// Find history by ID
export const findHistoryById = async (id: string): Promise<IHistory | null> => {
  try {
    const history = await History.findByPk(id, {
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });
    return history ? history.toJSON() : null;
  } catch (error) {
    logger.error('Failed to find history by ID:', error);
    throw new AppError('Failed to find history record', 500);
  }
};

// Find history by reference ID and resource
export const findHistoryByReference = async (
  referenceId: string,
  resource: string
): Promise<IHistory[]> => {
  try {
    const history = await History.findAll({
      where: {
        reference_id: referenceId,
        resource: resource,
        active: true
      },
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role_id'],
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name', 'description']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    return await attachDocumentsMediaToHistoryRows(history.map((h) => h.toJSON()));
  } catch (error) {
    logger.error('Failed to find history by reference:', error);
    throw new AppError('Failed to find history records', 500);
  }
};

// Find history by resource type
export const findHistoryByResource = async (
  resource: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ history: IHistory[], total: number }> => {
  try {
    const { count, rows } = await History.findAndCountAll({
      where: {
        resource: resource,
        active: true
      },
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return {
      history: rows.map(h => h.toJSON()),
      total: count
    };
  } catch (error) {
    logger.error('Failed to find history by resource:', error);
    throw new AppError('Failed to find history records', 500);
  }
};

// Find history by type
export const findHistoryByType = async (
  type: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ history: IHistory[], total: number }> => {
  try {
    const { count, rows } = await History.findAndCountAll({
      where: {
        type: type,
        active: true
      },
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return {
      history: rows.map(h => h.toJSON()),
      total: count
    };
  } catch (error) {
    logger.error('Failed to find history by type:', error);
    throw new AppError('Failed to find history records', 500);
  }
};

// Find history by user
export const findHistoryByUser = async (
  userId: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ history: IHistory[], total: number }> => {
  try {
    const { count, rows } = await History.findAndCountAll({
      where: {
        created_by: userId,
        active: true
      },
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return {
      history: rows.map(h => h.toJSON()),
      total: count
    };
  } catch (error) {
    logger.error('Failed to find history by user:', error);
    throw new AppError('Failed to find history records', 500);
  }
};

// Update history record
export const updateHistory = async (
  id: string,
  updateData: IHistoryUpdate
): Promise<IHistory | null> => {
  try {
    const history = await History.findByPk(id);
    if (!history) {
      return null;
    }

    await history.update(updateData);
    logger.info('History record updated successfully', { historyId: id });
    return history.toJSON();
  } catch (error) {
    logger.error('Failed to update history record:', error);
    throw new AppError('Failed to update history record', 500);
  }
};

// Soft delete history record (set active to false)
export const deactivateHistory = async (id: string): Promise<boolean> => {
  try {
    const history = await History.findByPk(id);
    if (!history) {
      return false;
    }

    await history.update({ active: false });
    logger.info('History record deactivated successfully', { historyId: id });
    return true;
  } catch (error) {
    logger.error('Failed to deactivate history record:', error);
    throw new AppError('Failed to deactivate history record', 500);
  }
};

// Hard delete history record
export const deleteHistory = async (id: string): Promise<boolean> => {
  try {
    const history = await History.findByPk(id);
    if (!history) {
      return false;
    }

    await history.destroy();
    logger.info('History record deleted successfully', { historyId: id });
    return true;
  } catch (error) {
    logger.error('Failed to delete history record:', error);
    throw new AppError('Failed to delete history record', 500);
  }
};

// Utility function to log common operations with retry mechanism
export const logOperation = async (
  resource: string,
  type: string,
  referenceId: string,
  userId?: string,
  comments?: string,
  maxRetries: number = 3
): Promise<void> => {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;
      logger.info(`Attempting to log operation (attempt ${attempt}/${maxRetries})`, {
        resource,
        type,
        referenceId,
        userId,
        hasComments: !!comments,
        timestamp: new Date().toISOString()
      });

      // Validate required fields
      if (!resource || !type || !referenceId) {
        logger.error('Missing required fields for history logging', { resource, type, referenceId });
        return;
      }

      // Check database connection health
      try {
        const { checkDatabaseHealth } = require('../config/sequelize');
        const isHealthy = await checkDatabaseHealth();
        if (!isHealthy) {
          throw new Error('Database connection is not healthy');
        }
      } catch (healthError) {
        const errorMessage = healthError instanceof Error ? healthError.message : String(healthError);
        logger.warn('Database health check failed, proceeding with history logging attempt', { error: errorMessage });
      }

      // If userId is provided, validate it exists
      if (userId) {
        try {
          const user = await User.findByPk(userId);
          if (!user) {
            logger.warn('User not found for history logging, setting created_by to null', { userId });
            userId = undefined;
          } else {
            logger.debug('User validated successfully for history logging', { userId, userName: `${user.first_name} ${user.last_name}` });
          }
        } catch (userError) {
          const errorMessage = userError instanceof Error ? userError.message : String(userError);
          logger.warn('Failed to validate user for history logging, setting created_by to null', { userId, error: errorMessage });
          userId = undefined;
        }
      } else {
        logger.info('No userId provided for history logging, setting created_by to null');
      }

      const historyData = {
        resource,
        type,
        reference_id: referenceId,
        created_by: userId,
        comments
      };

      logger.debug('History data to be created:', historyData);

      const history = await createHistory(historyData);

      logger.info('Operation logged successfully', {
        historyId: history.id,
        resource,
        type,
        referenceId,
        userId,
        timestamp: new Date().toISOString(),
        attempts: attempt
      });

      // Success - exit retry loop
      return;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error(`Failed to log operation (attempt ${attempt}/${maxRetries}):`, {
        error: errorMessage,
        stack: errorStack,
        resource,
        type,
        referenceId,
        userId,
        timestamp: new Date().toISOString(),
        attempt
      });

      // If this is the last attempt, give up
      if (attempt >= maxRetries) {
        logger.error('Max retries reached for history logging, giving up', {
          resource,
          type,
          referenceId,
          userId
        });
        break;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 1s, 2s, 4s, max 5s
      logger.info(`Retrying history logging in ${delay}ms...`, { attempt, maxRetries });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Don't throw error here as logging should not break main operations
  logger.warn('History logging failed after all retry attempts, but main operation continues');
};

// Get all history with pagination
export const getAllHistory = async (
  referenceId: string,
  limit: number = 100,
  offset: number = 0,
  filters?: {
    resource?: string;
    type?: string;
    created_by?: string;
    active?: boolean;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{ history: IHistory[], pagination: { total: number, limit: number, page: number, totalPages: number } }> => {
  try {
    const whereClause: any = {};

    if (filters?.resource) {
      whereClause.resource = filters.resource;
    }

    if (filters?.type) {
      whereClause.type = filters.type;
    }

    if (filters?.created_by) {
      whereClause.created_by = filters.created_by;
    }

    if (filters?.active !== undefined) {
      whereClause.active = filters.active;
    }

    if (filters?.startDate || filters?.endDate) {
      whereClause.created_at = {};
      if (filters.startDate) {
        whereClause.created_at[Op.gte] = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.created_at[Op.lte] = filters.endDate;
      }
    }

    const { count, rows } = await History.findAndCountAll({
      where: {
        ...whereClause,
        reference_id: referenceId,
        active: true
      },
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const jsonRows = rows.map((h) => h.toJSON());
    const history = await attachDocumentsMediaToHistoryRows(jsonRows);

    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(count / limit);

    return {
      history,
      pagination: {
        total: count,
        limit,
        page,
        totalPages
      }
    };
  } catch (error) {
    logger.error('Failed to get all history:', error);
    throw new AppError('Failed to get history records', 500);
  }
};
