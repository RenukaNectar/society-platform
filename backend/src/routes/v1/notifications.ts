import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import { 
  getUnreadNotifications,
  getAllNotifications,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  getUnreadNotificationCountController
} from '../../controllers/notificationController';
import { 
  notificationIdValidation,
  notificationQueryValidation
} from '../../validations/notification';
import { checkUserAvailability } from '../../services/NotificationService';
import logger from '../../utils/logger';

const router = Router();

// Health check endpoint for notifications
router.get('/health', authenticateToken, async (req, res) => {
  try {
    const availability = await checkUserAvailability();
    
    // Check if critical roles have users
    const criticalRoles = ['registrar', 'deputy_registrar', 'joint_registrar', 'field_inspector', 'senior_inspector'];
    const missingRoles = criticalRoles.filter(role => !availability[role] || availability[role].total === 0);
    
    const status = missingRoles.length === 0 ? 'healthy' : 'degraded';
    const message = missingRoles.length === 0 
      ? 'Notification system is healthy' 
      : `Notification system degraded: missing users for roles: ${missingRoles.join(', ')}`;
    
    res.json({
      status,
      message,
      timestamp: new Date().toISOString(),
      userAvailability: availability,
      missingRoles,
      suggestions: missingRoles.length > 0 ? [
        'Create users with missing roles',
        'Assign existing users to missing roles',
        'Check role name spelling (case-sensitive)'
      ] : []
    });
  } catch (error) {
    logger.error('Notification health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      message: 'Failed to check notification system health',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get unread notifications for the authenticated user
router.get('/unread', 
  authenticateToken,
  notificationQueryValidation,
  validateRequest,
  getUnreadNotifications
);

// Get all notifications for the authenticated user
router.get('/', 
  authenticateToken,
  notificationQueryValidation,
  validateRequest,
  getAllNotifications
);

// Mark notification as read
router.patch('/:id/read', 
  authenticateToken,
  notificationIdValidation,
  validateRequest,
  markNotificationAsReadController
);

// Mark all notifications as read
router.patch('/mark-all-read', 
  authenticateToken,
  markAllNotificationsAsReadController
);

// Get unread notification count
router.get('/count/unread', 
  authenticateToken,
  getUnreadNotificationCountController
);

export default router; 