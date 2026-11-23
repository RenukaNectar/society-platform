
import { Op } from 'sequelize';
import Notification from '../models/Notification';
import UserNotification from '../models/UserNotification';
import User from '../models/user';
import Role from '../models/Role';
import District from '../models/District';
import { INotification, INotificationCreate } from '../types';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

// ============================================================================
// USER FETCH METHOD (SINGLE SOURCE OF TRUTH)
// ============================================================================

/**
 * Get users by district, state, and/or role
 */
export const getUsers = async (options: {
  districtId?: string;
  stateId?: string;
  roleNames?: string[];
  isActive?: boolean;
}): Promise<string[]> => {
  try {
    const { districtId, stateId, roleNames, isActive = true } = options;

    logger.info('getUsers called with options:', { districtId, stateId, roleNames, isActive });

    const whereClause: any = { is_active: isActive };

    if (districtId) whereClause.district_id = districtId;
    if (stateId) whereClause.state_id = stateId;

    const include: any[] = [];

    if (roleNames?.length) {
      include.push({
        model: Role,
        as: 'role',
        where: { name: { [Op.in]: roleNames }, is_active: true },
      });
    }

    if (districtId) {
      include.push({
        model: District,
        as: 'district',
        where: { id: districtId },
      });
    }

    logger.info('getUsers query details:', { whereClause, include });

    const users = await User.findAll({ where: whereClause, include });

    logger.info(`getUsers found ${users.length} users for criteria:`, {
      districtId,
      stateId,
      roleNames,
      isActive,
      userCount: users.length,
      userIds: users.map(u => u.id)
    });

    return users.map(u => u.id);
  } catch (error) {
    logger.error('Failed to fetch users:', error);
    throw new AppError('Failed to fetch users', 500);
  }
};

// ============================================================================
// SEND NOTIFICATION METHOD
// ============================================================================

/**
 * Send notification to single/multiple users
 */
export const sendNotification = async (
  userIds: string | string[],
  notificationData: INotificationCreate
): Promise<INotification> => {
  try {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    if (!ids.length) throw new AppError('No user IDs provided', 400);

    // Validate active users
    const activeUsers = await User.findAll({
      where: { id: { [Op.in]: ids }, is_active: true }
    });

    if (!activeUsers.length) throw new AppError('No active users found', 404);

    const validUserIds = activeUsers.map(u => u.id);

    // Create notification
    const notification = await Notification.create(notificationData);

    // Map notifications to users
    await UserNotification.bulkCreate(
      validUserIds.map(uid => ({
        user_id: uid,
        notification_id: notification.id,
        is_read: false,
        active: true,
      }))
    );

    logger.info(`Notification sent`, {
      notificationId: notification.id,
      totalUsers: validUserIds.length,
    });

    return notification.toJSON();
  } catch (error) {
    logger.error('Failed to send notification:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to send notification', 500);
  }
};

// ============================================================================
// UTILITY FUNCTIONS FOR DEBUGGING
// ============================================================================

/**
 * Check user availability for different roles and districts
 * This is useful for debugging notification issues
 */
export const checkUserAvailability = async () => {
  try {
    const results: any = {};

    // Check users by role
    const roles: string[] = ['drcs_arcs_district',
      'drcs_arcs_hq',
      'drcs_arcs_auditor',
      'jics_sics_district',
      'jics_sics_hq',
      'jics_sics_liquidator',
      'jics_sics_auditor',
      'dept_jics_sics',
      'jt_rcs_district',
      'rcs_district',
      'applicant',
      'admin'];

    for (const role of roles) {
      const users = await getUsers({ roleNames: [role] });
      results[role] = {
        total: users.length,
        users: users.slice(0, 10) // First 10 user IDs
      };
    }

    // Check users by district (if any districts exist)
    const districts = await District.findAll({ limit: 5 }); // Check first 5 districts
    for (const district of districts) {
      const users = await getUsers({ districtId: district.id });
      results[`district_${district.name}`] = {
        total: users.length,
        users: users.slice(0, 10)
      };
    }

    logger.info('User availability check completed', results);
    return results;
  } catch (error) {
    logger.error('Failed to check user availability:', error);
    throw error;
  }
};

// ============================================================================
// SAMPLE USAGE HELPERS
// ============================================================================

export const notifyRegistrarsInDistrict = async (
  districtId: string,
  notificationData: INotificationCreate,
  roleNames: string[]
) => {
  logger.info(`notifyRegistrarsInDistrict called for district: ${districtId}`);

  const registrarIds = await getUsers({
    districtId,
    roleNames
  });

  logger.info(`Found ${registrarIds.length} registrar users in district ${districtId}:`, registrarIds);

  // Certificate issuance should not fail if no recipient users exist.
  if (registrarIds.length === 0) {
    logger.warn(`No registrar users found in district ${districtId}. Skipping notifications.`);
    return null;
  }

  try {
    return await sendNotification(registrarIds, notificationData);
  } catch (err: any) {
    // Notification failures must not block certificate issuance.
    logger.warn(`Failed to send registrar notifications for district ${districtId}. Skipping.`, {
      error: err?.message || String(err)
    });
    return null;
  }
};

export const notifyInspectorsInDistrict = async (
  districtId: string,
  notificationData: INotificationCreate,
  roleNames: string[]
) => {
  const inspectorIds = await getUsers({
    districtId,
    roleNames
  });
  return sendNotification(inspectorIds, notificationData);
};

/**
 * Send notification to specific roles in a district
 * This is a more flexible version of notifyInspectorsInDistrict
 */
export const notifyRolesInDistrict = async (
  districtId: string,
  notificationData: INotificationCreate,
  roleNames: string[]
) => {
  const userIds = await getUsers({
    districtId,
    roleNames,
    isActive: true
  });

  if (userIds.length === 0) {
    logger.warn(`No active users found for roles ${roleNames.join(', ')} in district ${districtId}`);
    return null;
  }

  return sendNotification(userIds, notificationData);
};






//=========================CORE NOTIFICATION METHODS=========================
//==============================================
// Get notifications by user ID
//==============================================

export const getNotificationsByUserId = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  isRead?: boolean,
  active?: boolean
): Promise<{
  notifications: INotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    const whereClause: any = {
      user_id: userId,
      active: true
    };
    if (isRead !== undefined) {
      whereClause.is_read = isRead;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await UserNotification.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Notification,
          as: 'notification',
          where: { active: true },
          include: [
            {
              model: User,
              as: 'createdByUser',
              attributes: ['id', 'first_name', 'last_name', 'email']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);
    return {
      notifications: rows.map((row) => {
        const notification = row.notification;
        return {
          ...notification.toJSON(),
          is_read: row.is_read,
          createdByUser: notification.createdByUser?.toJSON() || null
        };
      }),
      total: count,
      page,
      limit,
      totalPages
    };
  } catch (error) {
    logger.error('Failed to get notifications by user ID:', error);
    throw new AppError('Failed to get notifications', 500);
  }
};

//==============================================
// Mark notification as read
//==============================================

export const markNotificationAsRead = async (userId: string, notificationId: string): Promise<void> => {
  try {
    const userNotification = await UserNotification.findOne({
      where: {
        user_id: userId,
        notification_id: notificationId
      }
    });

    if (!userNotification) {
      throw new AppError('User notification not found', 404);
    }
    await userNotification.update({ is_read: true });
    logger.info('Notification marked as read for user', { userId, notificationId });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    logger.error('Failed to mark notification as read', error);
    throw new Error('Failed to mark notification as read');
  }
};

//==============================================
// Mark all notifications as read
//==============================================

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    await UserNotification.update({ is_read: true }, { where: { user_id: userId } });
    logger.info('All notifications marked as read for user', { userId });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    logger.error('Failed to mark all notifications as read', error);
    throw new Error('Failed to mark all notifications as read');
  }
};

//==============================================
// Get unread notification count
//==============================================

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const count = await UserNotification.count({ where: { user_id: userId, is_read: false } });
    return count;
  } catch (error) {
    logger.error('Failed to get unread notification count', error);
    throw new Error('Failed to get unread notification count');
  }
};

//==============================================
// Get active notification count
//==============================================

export const getActiveNotificationCount = async (userId: string): Promise<number> => {
  try {
    const count = await UserNotification.count({
      where: {
        user_id: userId,
        active: true
      }
    });
    return count;
  } catch (error) {
    logger.error('Failed to get unread notification count', error);
    throw new Error('Failed to get unread notification count');
  }
};

//==============================================
// Delete notification
//==============================================

export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await Notification.destroy({ where: { id: notificationId } });
    logger.info('Notification deleted', { notificationId });
  } catch (error) {
    logger.error('Failed to delete notification', error);
    throw new Error('Failed to delete notification');
  }
};
