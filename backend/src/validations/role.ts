import { body, param, query } from "express-validator";

export const roleValidation = [
  body('name').isLength({ min: 2, max: 50 }).withMessage('Role name must be between 2 and 50 characters'),
  body('description').optional().isLength({ max: 200 }).withMessage('Description must be less than 200 characters')
];

export const roleIdValidation = [
  param('id').isUUID().withMessage('Valid role ID is required')
];

export const roleQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
]; 