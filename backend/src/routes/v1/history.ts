import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import {
  createHistoryRecord,
  getHistoryById,
  getHistoryByReference,
  getHistoryByResource,
  getHistoryByType,
  getHistoryByUser,
  updateHistoryRecord,
  deactivateHistoryRecord,
  deleteHistoryRecord,
  getAllHistoryRecords,
  logOperationRecord
} from '../../controllers/historyController';
import {
  createHistoryValidation,
  updateHistoryValidation,
  historyIdValidation,
  historyReferenceValidation,
  historyResourceValidation,
  historyTypeValidation,
  historyUserValidation,
  historyQueryValidation,
  logOperationValidation
} from '../../validations/history';

const router = Router();

// Create history record
router.post('/', authenticateToken, createHistoryValidation, validateRequest, createHistoryRecord);

// Get history by ID
router.get('/:id', authenticateToken, historyIdValidation, validateRequest, getHistoryById);

// Get history by reference ID and resource
router.get('/reference/:referenceId/:resource', authenticateToken, historyReferenceValidation, validateRequest, getHistoryByReference);

// Get history by resource type
router.get('/resource/:resource', authenticateToken, historyResourceValidation, validateRequest, getHistoryByResource);

// Get history by action type
router.get('/type/:type', authenticateToken, historyTypeValidation, validateRequest, getHistoryByType);

// Get history by user
router.get('/user/:userId', authenticateToken, historyUserValidation, validateRequest, getHistoryByUser);

// Get all history with filters
router.get('/', authenticateToken, historyQueryValidation, validateRequest, getAllHistoryRecords);

// Update history record
router.put('/:id', authenticateToken, updateHistoryValidation, validateRequest, updateHistoryRecord);

// Deactivate history record (soft delete)
router.patch('/:id/deactivate', authenticateToken, historyIdValidation, validateRequest, deactivateHistoryRecord);

// Delete history record (hard delete)
router.delete('/:id', authenticateToken, historyIdValidation, validateRequest, deleteHistoryRecord);

// Utility endpoint to log operation
router.post('/log', authenticateToken, logOperationValidation, validateRequest, logOperationRecord);

export default router;
