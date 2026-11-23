import { body, param, query } from 'express-validator';

export const createBodMemberValidation = [
  body('society_id')
    .notEmpty()
    .withMessage('Society ID is required')
    .isUUID()
    .withMessage('Society ID must be a valid UUID'),
  body('agm_id')
    .notEmpty()
    .withMessage('AGM ID is required')
    .isUUID()
    .withMessage('AGM ID must be a valid UUID'),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .withMessage('Name must be a string')
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('designation')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Designation must be a string')
    .isLength({ max: 100 })
    .withMessage('Designation must not exceed 100 characters'),
  body('gender')
    .optional()
    .isString()
    .withMessage('Gender must be a string'),
  body('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  body('shareholder_category')
    .optional()
    .isString()
    .withMessage('Shareholder category must be a string'),
  body('mobile')
    .optional()
    .isString()
    .withMessage('Mobile must be a string'),
  body('is_co_opted')
    .optional()
    .isBoolean()
    .withMessage('is_co_opted must be a boolean')
];

export const getBodMembersBySocietyValidation = [
  param('societyId')
    .notEmpty()
    .withMessage('Society ID is required')
    .isUUID()
    .withMessage('Society ID must be a valid UUID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];
