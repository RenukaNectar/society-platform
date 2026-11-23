import { body, param, query } from "express-validator";

export const userValidation = [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('phone').notEmpty().withMessage('Phone number is required').matches(/^[6-9]\d{9}$/).withMessage('Valid phone number is required (10 digits starting with 6-9)'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('aadhar_number').optional().isLength({ min: 12, max: 12 }).withMessage('Aadhar number must be 12 digits'),
  body('pan_number').optional().isLength({ min: 10, max: 10 }).withMessage('PAN number must be 10 characters'),
  body('role_id').optional().isUUID().withMessage('Valid role ID is required')
];

export const updateUserValidation = [
  body('email').optional().isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Valid email is required'),
  body('first_name').optional().notEmpty().withMessage('First name is required'),
  body('last_name').optional().notEmpty().withMessage('Last name is required'),
  body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Valid phone number is required (10 digits starting with 6-9)'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('aadhar_number').optional().isLength({ min: 12, max: 12 }).withMessage('Aadhar number must be 12 digits'),
  body('pan_number').optional().isLength({ min: 10, max: 10 }).withMessage('PAN number must be 10 characters'),
  body('role_id').optional().isUUID().withMessage('Valid role ID is required')
];

export const userIdValidation = [
  param('id').isUUID().withMessage('Valid user ID is required')
];

export const userQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('isLocked').optional().isBoolean().withMessage('isLocked must be a boolean')
];

/**
 * Validation for PATCH /users/:id/availability
 */
export const setUserAvailabilityValidation = [
  body('isAvailable')
    .exists({ checkNull: true })
    .withMessage('isAvailable is required')
    .isBoolean()
    .withMessage('isAvailable must be a boolean'),
  body('reason')
    .optional({ nullable: true })
    .isString()
    .withMessage('reason must be a string')
    .isLength({ max: 500 })
    .withMessage('reason cannot exceed 500 characters'),
  body('unavailableUntil')
    .optional({ nullable: true })
    .custom((value) => {
      if (value == null || value === '') return true;
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
      const d = new Date(value);
      if (isNaN(d.getTime())) {
        throw new Error('unavailableUntil must be a valid date (YYYY-MM-DD or ISO)');
      }
      return true;
    })
];

/**
 * Validation for GET /users/available/list
 */
export const getAvailableUsersValidation = [
  query('roleId').optional().isUUID().withMessage('roleId must be a valid UUID'),
  query('roleName').optional().isString().withMessage('roleName must be a string'),
  query('districtId').optional().isUUID().withMessage('districtId must be a valid UUID'),
  query('stateId').optional().isUUID().withMessage('stateId must be a valid UUID'),
  query('excludeUserId')
    .optional()
    .custom((value) => {
      const ids = Array.isArray(value) ? value : [value];
      const uuidRe = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!ids.every((id) => typeof id === 'string' && uuidRe.test(id))) {
        throw new Error('excludeUserId must be a valid UUID (or array of UUIDs)');
      }
      return true;
    }),
  query()
    .custom((_, { req }) => {
      if (!req.query?.roleId && !req.query?.roleName) {
        throw new Error('Either roleId or roleName is required');
      }
      return true;
    })
];
