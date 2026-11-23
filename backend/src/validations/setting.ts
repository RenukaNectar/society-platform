import { body, param, query } from "express-validator";

export const settingValidation = [
  body('key').notEmpty().withMessage('Key is required').isLength({ min: 1, max: 255 }).withMessage('Key must be between 1 and 255 characters'),
  body('title').notEmpty().withMessage('Title is required').isLength({ min: 1, max: 255 }).withMessage('Title must be between 1 and 255 characters'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('value').notEmpty().withMessage('Value is required'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
];

export const updateSettingValidation = [
  body('key').optional().isLength({ min: 1, max: 255 }).withMessage('Key must be between 1 and 255 characters'),
  body('title').optional().isLength({ min: 1, max: 255 }).withMessage('Title must be between 1 and 255 characters'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('value').optional().notEmpty().withMessage('Value cannot be empty'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
];

export const settingIdValidation = [
  param('id').isUUID().withMessage('Valid setting ID is required')
];

export const settingQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  query('key').optional().isString().withMessage('Key must be a string')
];
