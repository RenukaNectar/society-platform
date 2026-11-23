import { param, query } from "express-validator";

export const sessionIdValidation = [
  param('id').isUUID().withMessage('Valid session ID is required')
];

export const userIdValidation = [
  param('userId').isUUID().withMessage('Valid user ID is required')
];

export const sessionQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('userId').optional().isUUID().withMessage('Valid user ID is required'),
  query('activeOnly').optional().isBoolean().withMessage('activeOnly must be a boolean')
]; 