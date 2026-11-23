import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import { 
  getNotificationsByUserId, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  getActiveNotificationCount
} from "../services/NotificationService";
import { Response } from "express";
import { returnResponse } from "../utils/response";
import { IAuthRequest } from "../types";

export const getUnreadNotifications = async (req: IAuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { page = 1, limit = 10 } = req.query;
    
    const result = await getNotificationsByUserId(
      userId,
      Number(page),
      Number(limit),
      false, // isRead = false for unread notifications
      true   // active = true for active notifications
    );

    returnResponse(res).ok('Unread notifications retrieved successfully', {
      notifications: result.notifications,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    logger.error('Failed to get unread notifications:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getAllNotifications = async (req: IAuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { page = 1, limit = 20, isRead } = req.query;
    
    const result = await getNotificationsByUserId(
      userId,
      Number(page),
      Number(limit),
      isRead !== undefined ? Boolean(isRead) : undefined,
      true   // active = true for active notifications
    );

    returnResponse(res).ok('Notifications retrieved successfully', {
      notifications: result.notifications,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    logger.error('Failed to get notifications:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const markNotificationAsReadController = async (req: IAuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const notificationId = req.params.id as any;
    await markNotificationAsRead(userId, notificationId);

    returnResponse(res).ok('Notification marked as read successfully', {});
  } catch (error) {
    logger.error('Failed to mark notification as read:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const markAllNotificationsAsReadController = async (req: IAuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    await markAllNotificationsAsRead(userId);

    returnResponse(res).ok('All notifications marked as read successfully', {});
  } catch (error) {
    logger.error('Failed to mark all notifications as read:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getUnreadNotificationCountController = async (req: IAuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const count = await getUnreadNotificationCount(userId);

    returnResponse(res).ok('Unread notification count retrieved successfully', count);
  } catch (error) {
    logger.error('Failed to get unread notification count:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
}; 

export const getActiveNotificationCountController = async (req: IAuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const count = await getActiveNotificationCount(userId);

    returnResponse(res).ok('Active notification count retrieved successfully', count);
  } catch (error) {
    logger.error('Failed to get active notification count:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Internal server error');
  }
};