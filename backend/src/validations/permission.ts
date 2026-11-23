import { body, param, query } from "express-validator";

export const permissionValidation = [
  body('name').isLength({ min: 2, max: 50 }).withMessage('Permission name must be between 2 and 50 characters'),
  body('description').optional().isLength({ max: 200 }).withMessage('Description must be less than 200 characters'),
  body('resource').isLength({ min: 2, max: 50 }).withMessage('Resource must be between 2 and 50 characters'),
  body('action').isLength({ min: 2, max: 50 }).withMessage('Action must be between 2 and 50 characters')
];

export const updatePermissionValidation = [
  body('name').optional().isLength({ min: 2, max: 50 }).withMessage('Permission name must be between 2 and 50 characters'),
  body('description').optional().isLength({ max: 200 }).withMessage('Description must be less than 200 characters'),
  body('resource').optional().isLength({ min: 2, max: 50 }).withMessage('Resource must be between 2 and 50 characters'),
  body('action').optional().isLength({ min: 2, max: 50 }).withMessage('Action must be between 2 and 50 characters')
];

export const permissionIdValidation = [
  param('id').isUUID().withMessage('Valid permission ID is required')
];

export const permissionQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('resource').optional().isString().withMessage('Resource must be a string'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
]; 