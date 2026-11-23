import { body, param, query } from "express-validator";

export const createSocietyConversionValidation = [
  body('society_id')
    .notEmpty()
    .withMessage('Society ID is required')
    .isUUID()
    .withMessage('Society ID must be a valid UUID'),
  body('conversion_from')
    .notEmpty()
    .withMessage('Conversion from (sector of operation) is required')
    .isUUID()
    .withMessage('Conversion from must be a valid UUID from sector of operations'),
  body('conversion_to')
    .notEmpty()
    .withMessage('Conversion to (sector of operation) is required')
    .isUUID()
    .withMessage('Conversion to must be a valid UUID from sector of operations'),
  body('cooperative_society_name')
    .optional()
    .isString()
    .withMessage('Society name must be a string'),
  body('full_address')
    .optional()
    .isString()
    .withMessage('Full address must be a string'),
  body('conversion_reason')
    .optional()
    .isString()
    .withMessage('Conversion reason must be a string'),
  body('notice_sgbm')
    .optional()
    .isString()
    .withMessage('Notice SGBM must be a string')
    .isLength({ max: 255 })
    .withMessage('Notice SGBM must not exceed 255 characters'),
  body('minutes_meeting')
    .optional()
    .isString()
    .withMessage('Minutes meeting must be a string')
    .isLength({ max: 255 })
    .withMessage('Minutes meeting must not exceed 255 characters'),
  body('attendance_sheet')
    .optional()
    .isString()
    .withMessage('Attendance sheet must be a string')
    .isLength({ max: 255 })
    .withMessage('Attendance sheet must not exceed 255 characters'),
  body('form_g')
    .optional()
    .isString()
    .withMessage('Form G must be a string')
    .isLength({ max: 255 })
    .withMessage('Form G must not exceed 255 characters'),
  body('bye_laws')
    .optional()
    .isString()
    .withMessage('Bye laws must be a string')
    .isLength({ max: 255 })
    .withMessage('Bye laws must not exceed 255 characters'),
  body('audit_report')
    .optional()
    .isString()
    .withMessage('Audit report must be a string')
    .isLength({ max: 255 })
    .withMessage('Audit report must not exceed 255 characters'),
  body('status')
    .optional()
    .isString()
    .withMessage('Status must be a string'),
  body('approval_date')
    .optional()
    .isISO8601()
    .withMessage('Approval date must be a valid date'),
  body('approval_remarks')
    .optional()
    .isString()
    .withMessage('Approval remarks must be a string'),
  body('certificate_path')
    .optional()
    .isString()
    .withMessage('Certificate path must be a string')
    .isLength({ max: 255 })
    .withMessage('Certificate path must not exceed 255 characters'),
  body('data')
    .optional()
    .custom((value) => {
      if (value !== null && typeof value !== 'object') {
        throw new Error('Data must be a valid JSON object');
      }
      return true;
    })
    .withMessage('Data must be a valid JSON object'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
];

export const societyConversionIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid society conversion ID is required')
];

export const societyIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid society ID is required')
];

export const societyConversionQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string'),
  query('status')
    .optional()
    .isString()
    .withMessage('Status must be a string'),
  query('society_id')
    .optional()
    .isUUID()
    .withMessage('Society ID must be a valid UUID'),
  query('conversion_from')
    .optional()
    .isUUID()
    .withMessage('Conversion from must be a valid UUID'),
  query('conversion_to')
    .optional()
    .isUUID()
    .withMessage('Conversion to must be a valid UUID'),
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
  query('from')
    .optional()
    .isString()
    .withMessage('From date must be a string'),
  query('to')
    .optional()
    .isString()
    .withMessage('To date must be a string'),
];

export const resubmitSocietyConversionValidation = [
  body('cooperative_society_name')
    .optional()
    .isString()
    .withMessage('Society name must be a string'),
  body('full_address')
    .optional()
    .isString()
    .withMessage('Full address must be a string'),
  body('conversion_reason')
    .optional()
    .isString()
    .withMessage('Conversion reason must be a string'),
  body('notice_sgbm')
    .optional()
    .isString()
    .withMessage('Notice SGBM must be a string')
    .isLength({ max: 255 })
    .withMessage('Notice SGBM must not exceed 255 characters'),
  body('minutes_meeting')
    .optional()
    .isString()
    .withMessage('Minutes meeting must be a string')
    .isLength({ max: 255 })
    .withMessage('Minutes meeting must not exceed 255 characters'),
  body('attendance_sheet')
    .optional()
    .isString()
    .withMessage('Attendance sheet must be a string')
    .isLength({ max: 255 })
    .withMessage('Attendance sheet must not exceed 255 characters'),
  body('form_g')
    .optional()
    .isString()
    .withMessage('Form G must be a string')
    .isLength({ max: 255 })
    .withMessage('Form G must not exceed 255 characters'),
  body('bye_laws')
    .optional()
    .isString()
    .withMessage('Bye laws must be a string')
    .isLength({ max: 255 })
    .withMessage('Bye laws must not exceed 255 characters'),
  body('audit_report')
    .optional()
    .isString()
    .withMessage('Audit report must be a string')
    .isLength({ max: 255 })
    .withMessage('Audit report must not exceed 255 characters'),
  body('status')
    .optional()
    .isString()
    .withMessage('Status must be a string'),
  body('approval_date')
    .optional()
    .isISO8601()
    .withMessage('Approval date must be a valid date'),
  body('approval_remarks')
    .optional()
    .isString()
    .withMessage('Approval remarks must be a string'),
  body('certificate_path')
    .optional()
    .isString()
    .withMessage('Certificate path must be a string')
    .isLength({ max: 255 })
    .withMessage('Certificate path must not exceed 255 characters'),
  body('data')
    .optional()
    .custom((value) => {
      if (value !== null && typeof value !== 'object') {
        throw new Error('Data must be a valid JSON object');
      }
      return true;
    })
    .withMessage('Data must be a valid JSON object'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
];