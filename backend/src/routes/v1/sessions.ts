import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { 
  getSessions,
  getSessionById,
  getSessionsByUserId,
  deleteSessionController,
  deleteAllSessionsByUserIdController,
  deleteExpiredSessionsController,
  extendSessionController,
  getSessionStatsController
} from '../../controllers/sessionController';
import { 
  sessionIdValidation,
  userIdValidation,
  sessionQueryValidation
} from '../../validations/session';

const router = Router();

// Get all sessions
router.get('/', 
  authenticateToken, 
  requireRole(['admin', 'super_admin']),
  sessionQueryValidation,
  validateRequest,
  getSessions
);

// Get session by ID
router.get('/:id', 
  authenticateToken, 
  requireRole(['admin', 'super_admin']),
  sessionIdValidation,
  validateRequest,
  getSessionById
);

// Get sessions by user ID
router.get('/user/:userId', 
  authenticateToken, 
  requireRole(['admin', 'super_admin']),
  userIdValidation,
  validateRequest,
  getSessionsByUserId
);

// Delete session
router.delete('/:id', 
  authenticateToken, 
  requireRole(['admin', 'super_admin']),
  sessionIdValidation,
  validateRequest,
  deleteSessionController
);

// Delete all sessions by user ID
router.delete('/user/:userId', 
  authenticateToken, 
  requireRole(['admin', 'super_admin']),
  userIdValidation,
  validateRequest,
  deleteAllSessionsByUserIdController
);

// Delete expired sessions
router.delete('/expired/cleanup', 
  authenticateToken, 
  requireRole(['admin', 'super_admin']),
  deleteExpiredSessionsController
);

// Extend session
router.patch('/:id/extend', 
  authenticateToken, 
  requireRole(['admin', 'super_admin']),
  sessionIdValidation,
  validateRequest,
  extendSessionController
);

// Get session statistics
router.get('/stats/overview', 
  authenticateToken, 
  requireRole(['admin', 'super_admin']),
  getSessionStatsController
);

export default router; 