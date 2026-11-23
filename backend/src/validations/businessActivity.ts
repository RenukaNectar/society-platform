import { body, param, query } from 'express-validator';

const additionalDataObjectRule = body('additional_data').custom((value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'object' && !Array.isArray(value)) return true;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed === null) return true;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return true;
    } catch {
      /* fall through */
    }
  }
  throw new Error('additional_data must be a JSON object (cooperative form data)');
});

export const businessActivityQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('district_id').optional().isString().withMessage('District ID must be a string'),
  query('state_id').optional().isString().withMessage('State ID must be a string'),
  query('sector_of_operation').optional().isString().withMessage('sector_of_operation must be a string'),
  query('society_id').optional().isString().withMessage('society_id must be a string'),
];

export const businessActivitySocietyIdValidation = [
  param('societyId').isString().withMessage('Valid society registration ID is required'),
];

export const businessActivityIdValidation = [
  param('id').isString().withMessage('Valid business activity ID is required'),
];

export const createBusinessActivityValidation = [
  additionalDataObjectRule,
  body('sector_of_operation')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('sector_of_operation must be a valid sector id'),
  body('title').optional({ values: 'falsy' }).isString().withMessage('title must be a string'),
  body('is_primary').optional().isBoolean().withMessage('is_primary must be a boolean'),
];

export const updateBusinessActivityValidation = [
  additionalDataObjectRule.optional({ nullable: true }),
  body('sector_of_operation')
    .optional({ nullable: true })
    .isString()
    .withMessage('sector_of_operation must be a valid sector id'),
  body('title').optional({ nullable: true }).isString().withMessage('title must be a string'),
  body('is_primary').optional().isBoolean().withMessage('is_primary must be a boolean'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
];
