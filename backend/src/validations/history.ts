import { body, param, query } from "express-validator";

export const createHistoryValidation = [
  body('resource')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Resource is required and must be between 1 and 100 characters'),
  body('type')
    .notEmpty()
    .isLength({ min: 1, max: 50 })
    .isIn(['create', 'update', 'delete', 'status_change', 'approval', 'rejection', 'resubmit', 'other'])
    .withMessage('Type is required and must be a valid action type'),
  body('comments')
    .optional()
    .isString()
    .withMessage('Comments must be a string'),
  body('reference_id')
    .notEmpty()
    .isUUID()
    .withMessage('Valid reference ID is required'),
  body('created_by')
    .optional()
    .isUUID()
    .withMessage('Valid user ID is required'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean')
];

export const updateHistoryValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid history ID is required'),
  body('comments')
    .optional()
    .isString()
    .withMessage('Comments must be a string'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean')
];

export const historyIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid history ID is required')
];

export const historyReferenceValidation = [
  param('referenceId')
    .isUUID()
    .withMessage('Valid reference ID is required'),
  param('resource')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Resource is required and must be between 1 and 100 characters')
];

export const historyResourceValidation = [
  param('resource')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Resource is required and must be between 1 and 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000')
];

export const historyTypeValidation = [
  param('type')
    .notEmpty()
    .isLength({ min: 1, max: 50 })
    .isIn(['create', 'update', 'delete', 'status_change', 'approval', 'rejection', 'other'])
    .withMessage('Type is required and must be a valid action type'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000')
];

export const historyUserValidation = [
  param('userId')
    .isUUID()
    .withMessage('Valid user ID is required'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000')
];

export const historyQueryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  query('resource')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Resource must be between 1 and 100 characters'),
  query('type')
    .optional()
    .isIn(['create', 'update', 'delete', 'status_change', 'approval', 'rejection', 'other'])
    .withMessage('Type must be a valid action type'),
  query('created_by')
    .optional()
    .isUUID()
    .withMessage('Valid user ID is required'),
  query('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

export const logOperationValidation = [
  body('resource')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Resource is required and must be between 1 and 100 characters'),
  body('type')
    .notEmpty()
    .isLength({ min: 1, max: 50 })
    .isIn(['create', 'update', 'delete', 'status_change', 'approval', 'rejection', 'other'])
    .withMessage('Type is required and must be a valid action type'),
  body('reference_id')
    .notEmpty()
    .isUUID()
    .withMessage('Valid reference ID is required'),
  body('comments')
    .optional()
    .isString()
    .withMessage('Comments must be a string')
];
