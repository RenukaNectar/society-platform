import { Op } from 'sequelize';
import Session from '../models/Session';
import User from '../models/user';
import { ISession } from '../types';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';

// Create session
export const createSession = async (userId: string, data: any, expires: Date, req?: any): Promise<ISession> => {
  try {
    const createData = {
      user_id: userId,
      data,
      expires,
      created_by: req?.user?.userId || null,
      updated_by: req?.user?.userId || null
    };
    const session = await Session.create(createData);

    logger.info('Session created successfully', { sessionId: session.id, userId });
    return session.toJSON();
  } catch (error) {
    logger.error('Failed to create session:', error);
    throw new AppError('Failed to create session', 500);
  }
};

// Find session by ID
export const findSessionById = async (id: string): Promise<ISession | null> => {
  try {
    const session = await Session.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'first_name', 'last_name']
        }
      ]
    });
    return session ? session.toJSON() : null;
  } catch (error) {
    logger.error('Failed to find session by ID:', error);
    throw new AppError('Failed to find session', 500);
  }
};

// Find sessions by user ID
export const findSessionsByUserId = async (userId: string): Promise<ISession[]> => {
  try {
    const sessions = await Session.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });
    return sessions.map(session => session.toJSON());
  } catch (error) {
    logger.error('Failed to find sessions by user ID:', error);
    throw new AppError('Failed to find sessions', 500);
  }
};

// Find active sessions by user ID
export const findActiveSessionsByUserId = async (userId: string): Promise<ISession[]> => {
  try {
    const sessions = await Session.findAll({
      where: {
        user_id: userId,
        expires: { [Op.gt]: new Date() }
      },
      order: [['created_at', 'DESC']]
    });
    return sessions.map(session => session.toJSON());
  } catch (error) {
    logger.error('Failed to find active sessions by user ID:', error);
    throw new AppError('Failed to find active sessions', 500);
  }
};

// Update session
export const updateSession = async (id: string, updateData: Partial<ISession>, req?: any): Promise<ISession> => {
  try {
    const session = await Session.findByPk(id);
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    const sessionUpdateData = {
      ...updateData,
      updated_by: req?.user?.userId || null
    };
    await session.update(sessionUpdateData);

    const updatedSession = await Session.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'first_name', 'last_name']
        }
      ]
    });

    logger.info('Session updated successfully', { sessionId: id });
    return updatedSession!.toJSON();
  } catch (error) {
    logger.error('Failed to update session:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update session', 500);
  }
};

// Delete session
export const deleteSession = async (id: string): Promise<void> => {
  try {
    const session = await Session.findByPk(id);
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    await session.destroy();
    logger.info('Session deleted successfully', { sessionId: id });
  } catch (error) {
    logger.error('Failed to delete session:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete session', 500);
  }
};

// Delete all sessions for a user
export const deleteAllSessionsByUserId = async (userId: string): Promise<void> => {
  try {
    await Session.destroy({
      where: { user_id: userId }
    });
    logger.info('All sessions deleted for user', { userId });
  } catch (error) {
    logger.error('Failed to delete all sessions for user:', error);
    throw new AppError('Failed to delete sessions', 500);
  }
};

// Delete expired sessions
export const deleteExpiredSessions = async (): Promise<number> => {
  try {
    const deletedCount = await Session.destroy({
      where: {
        expires: { [Op.lt]: new Date() }
      }
    });

    logger.info('Expired sessions deleted', { count: deletedCount });
    return deletedCount;
  } catch (error) {
    logger.error('Failed to delete expired sessions:', error);
    throw new AppError('Failed to delete expired sessions', 500);
  }
};

// Extend session expiry
export const extendSession = async (id: string, newExpiry: Date, req?: any): Promise<ISession> => {
  try {
    const session = await Session.findByPk(id);
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    const updateData = {
      ...{ expires: newExpiry },
      updated_by: req?.user?.userId || null
    };
    await session.update(updateData);

    const updatedSession = await Session.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'first_name', 'last_name']
        }
      ]
    });

    logger.info('Session extended successfully', { sessionId: id });
    return updatedSession!.toJSON();
  } catch (error) {
    logger.error('Failed to extend session:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to extend session', 500);
  }
};

// Get session statistics
export const getSessionStats = async (): Promise<{
  total: number;
  active: number;
  expired: number;
}> => {
  try {
    const total = await Session.count();
    const active = await Session.count({
      where: {
        expires: { [Op.gt]: new Date() }
      }
    });
    const expired = await Session.count({
      where: {
        expires: { [Op.lt]: new Date() }
      }
    });

    return {
      total,
      active,
      expired
    };
  } catch (error) {
    logger.error('Failed to get session stats:', error);
    throw new AppError('Failed to get session statistics', 500);
  }
};

// Get sessions with pagination
export const getAllSessions = async (
  page: number = 1,
  limit: number = 10,
  userId?: string,
  activeOnly?: boolean
): Promise<{
  sessions: ISession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    const whereConditions: any = {};

    if (userId) {
      whereConditions.user_id = userId;
    }

    if (activeOnly) {
      whereConditions.expires = { [Op.gt]: new Date() };
    }

    const { count, rows } = await Session.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'first_name', 'last_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    });

    return {
      sessions: rows.map(session => session.toJSON()),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  } catch (error) {
    logger.error('Failed to get sessions:', error);
    throw new AppError('Failed to get sessions', 500);
  }
}; 