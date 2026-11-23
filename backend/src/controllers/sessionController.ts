import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import { 
  getAllSessions,
  findSessionById,
  findSessionsByUserId,
  deleteSession,
  deleteAllSessionsByUserId,
  deleteExpiredSessions,
  extendSession,
  getSessionStats
} from "../services/SessionService";
import { Request, Response } from "express";
import { returnResponse } from "../utils/response";

export const getSessions = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const userId = req.query.userId as string;
    const activeOnly = req.query.activeOnly === 'true';

    const result = await getAllSessions(page, limit, userId, activeOnly);

    returnResponse(res).ok('Sessions retrieved successfully', {
      sessions: result.sessions.map(session => ({
        id: session.id,
        user_id: session.user_id,
        expires: session.expires,
        data: session.data,
        created_at: session.created_at,
        updated_at: session.updated_at
      })),
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
    logger.error('Failed to get sessions:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getSessionById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const session = await findSessionById(id);

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    returnResponse(res).ok('Session retrieved successfully', session);
  } catch (error) {
    logger.error('Failed to get session:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getSessionsByUserId = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const sessions = await findSessionsByUserId(userId);

    returnResponse(res).ok('Sessions retrieved successfully', sessions);
  } catch (error) {
    logger.error('Failed to get sessions by user ID:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const deleteSessionController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await deleteSession(id);

    returnResponse(res).ok('Session deleted successfully', null);
  } catch (error) {
    logger.error('Failed to delete session:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const deleteAllSessionsByUserIdController = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    await deleteAllSessionsByUserId(userId);

    returnResponse(res).ok('All sessions deleted successfully', null);
  } catch (error) {
    logger.error('Failed to delete all sessions by user ID:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const deleteExpiredSessionsController = async (req: Request, res: Response) => {
  try {
  await deleteExpiredSessions();

    returnResponse(res).ok('Expired sessions deleted successfully', null);
  } catch (error) {
    logger.error('Failed to delete expired sessions:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const extendSessionController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const extendedSession = await extendSession(id, req.body);

    if (!extendedSession) {
      throw new AppError('Session not found', 404);
    }

    returnResponse(res).ok('Session extended successfully', extendedSession);
  } catch (error) {
    logger.error('Failed to extend session:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getSessionStatsController = async (req: Request, res: Response) => {
  try {
    const stats = await getSessionStats();

    returnResponse(res).ok('Session statistics retrieved successfully', stats);
  } catch (error) {
    logger.error('Failed to get session stats:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
}; 