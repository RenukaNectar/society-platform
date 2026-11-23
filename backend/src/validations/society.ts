import { param, query } from "express-validator";

export const societyIdValidation = [
  param('id').isString().withMessage('Valid society ID is required')
];

export const societyQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('search').optional().isString().withMessage('Search must be a string'),
  // Filter parameters
  query('status').optional().isString().withMessage('Status must be a string'),
  query('reference_year').optional().isString().withMessage('Reference year must be a string'),
  query('district_id').optional().isString().withMessage('District ID must be a string'),
  query('state_id').optional().isString().withMessage('State ID must be a string'),
  query('cooperative_society_type_id').optional().isString().withMessage('Cooperative society type ID must be a string'),
  query('functional_status').optional().isString().withMessage('Functional status must be a string'),
  query('from').optional().isString().withMessage('From date must be a string'),
  query('to').optional().isString().withMessage('To date must be a string'),
  query('has_applicant')
    .optional()
    .isIn(['true', 'false', '1', '0'])
    .withMessage('has_applicant must be true, false, 1, or 0')
]; 