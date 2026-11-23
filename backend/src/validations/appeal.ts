import { body, query, param } from 'express-validator';

// Validation for creating appeal
export const createAppealValidation = [
  body('appellant_type')
    .notEmpty()
    .withMessage('Appellant type is required')
    .isString()
    .withMessage('Appellant type must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Appellant type must be between 1 and 100 characters'),

  body('name_of_appellant')
    .notEmpty()
    .withMessage('Name of appellant is required')
    .isString()
    .withMessage('Name of appellant must be a string')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Name of appellant must be between 1 and 200 characters'),

  body('society_registration_no')
    .optional()
    .isString()
    .withMessage('Society registration number must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Society registration number must be between 1 and 100 characters'),

  body('contact_phone')
    .optional()
    .isString()
    .withMessage('Contact phone must be a string')
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Contact phone must be between 10 and 15 characters')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Contact phone contains invalid characters'),

  body('contact_email')
    .optional()
    .isEmail()
    .withMessage('Contact email must be a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('order_type')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Order type must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Order type cannot exceed 100 characters'),

  body('specify_order_type')
    .if(body('order_type').equals('Other'))
    .isString()
    .withMessage('Specify order type must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Specify order type is required when order type is Other')
    .bail()
    .isLength({ max: 100 })
    .withMessage('Specify order type cannot exceed 100 characters'),

  body('specify_order_type')
    .if((value, { req }) => req.body.order_type !== 'Other')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Specify order type must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Specify order type cannot exceed 100 characters'),

  body('order_number')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Order number must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Order number cannot exceed 100 characters'),

  body('order_date')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Order date must be a valid date'),

  body('grounds_of_appeal')
    .optional()
    .isString()
    .withMessage('Grounds of appeal must be a string')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Grounds of appeal must be between 1 and 2000 characters'),

  body('relief_sought')
    .optional()
    .isString()
    .withMessage('Relief sought must be a string')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Relief sought must be between 1 and 2000 characters'),

  body('supporting_documents')
    .optional()
    .isUUID()
    .withMessage('Supporting documents must be a valid UUID'),

  body('date_of_filing')
    .optional()
    .isISO8601()
    .withMessage('Date of filing must be a valid date'),

  body('e_signed')
    .optional()
    .isBoolean()
    .withMessage('E-signed must be a boolean value'),

  body('status')
    .optional()
    .isString()
    .withMessage('Status must be a string')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Status must be between 1 and 50 characters')
];

// Validation for getting all appeals
export const getAppealsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),

  query('appellant_type')
    .optional()
    .isString()
    .withMessage('Appellant type must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Appellant type must be between 1 and 100 characters'),

  query('status')
    .optional()
    .isString()
    .withMessage('Status must be a string')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Status must be between 1 and 50 characters'),

  query('society_registration_no')
    .optional()
    .isString()
    .withMessage('Society registration number must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Society registration number must be between 1 and 100 characters'),

  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
];

// Validation for getting appeal by ID
export const getAppealByIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Appeal ID is required')
    .isUUID()
    .withMessage('Appeal ID must be a valid UUID')
];
