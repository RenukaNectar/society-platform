import { body, param, query } from "express-validator";

export const createMemberValidation = [
  body('name').optional().isString().withMessage('Name must be a string'),
  body('gender').optional().isString().withMessage('Gender must be a string'),
  body('category').optional().isString().withMessage('Category must be a string'),
  body('shareholder_category')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Shareholder category must be a string')
    .isLength({ max: 100 })
    .withMessage('Shareholder category must not exceed 100 characters'),
  body('designation').optional().isString().withMessage('Designation must be a string'),
  body('is_co_opted').optional().isBoolean().withMessage('is_co_opted must be a boolean'),
  body('society_id').notEmpty().withMessage('Society ID is required')
];

export const updateMemberValidation = [
  body('name').optional().isString().withMessage('Name must be a string'),
  body('gender').optional().isString().withMessage('Gender must be a string'),
  body('category').optional().isString().withMessage('Category must be a string'),
  body('shareholder_category')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Shareholder category must be a string')
    .isLength({ max: 100 })
    .withMessage('Shareholder category must not exceed 100 characters'),
  body('designation').optional().isString().withMessage('Designation must be a string'),
  body('is_co_opted').optional().isBoolean().withMessage('is_co_opted must be a boolean')
];

export const memberIdValidation = [
  param('id').isInt().withMessage('Valid member ID is required')
];

export const getMembersBySocietyIdValidation = [
  param('societyId').isString().withMessage('Valid society ID is required')
];

export const getMembersValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('society_id').optional().isString().withMessage('Valid society ID is required'),
];

export const createMultipleMembersValidation = [
  body('members').isArray().withMessage('Members must be an array'),
  body('members.*.name').optional().isString().withMessage('Name must be a string'),
  body('members.*.gender').optional().isString().withMessage('Gender must be a string'),
  body('members.*.category').optional().isString().withMessage('Category must be a string'),
  body('members.*.shareholder_category')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Shareholder category must be a string')
    .isLength({ max: 100 })
    .withMessage('Shareholder category must not exceed 100 characters'),
  body('members.*.designation').optional().isString().withMessage('Designation must be a string'),
  body('members.*.is_co_opted').optional().isBoolean().withMessage('is_co_opted must be a boolean'),
  body('members.*.society_id').notEmpty().withMessage('Society ID is required for each member')
]; 

export const getBodMembersValidation = [
  param('society_id').isString().withMessage('Valid society ID is required')
];

export const sendBodOtpValidation = [
  body('members_id').isString().withMessage('Members ID is required'),
  body('society_id').isString().withMessage('Society ID is required')
];

export const verifyBodOtpValidation = [
  body('members_id').isString().withMessage('Members ID is required'),
  body('society_id').isString().withMessage('Society ID is required'),
  body('otp').isString().withMessage('OTP is required')
];