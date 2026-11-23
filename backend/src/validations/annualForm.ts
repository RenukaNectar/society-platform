import { body, param, query } from "express-validator";

const sanitizeMobileDigits = (value: unknown) =>
  String(value ?? '').replace(/\D/g, '').trim();

const tenDigitMobileField = (field: string, label: string) =>
  body(field)
    .customSanitizer(sanitizeMobileDigits)
    .notEmpty()
    .withMessage(`${label} is required`)
    .matches(/^\d{10}$/)
    .withMessage(`${label} must be exactly 10 digits`);

const optionalTenDigitMobileField = (field: string, label: string) =>
  body(field)
    .optional({ values: 'falsy' })
    .customSanitizer(sanitizeMobileDigits)
    .matches(/^\d{10}$/)
    .withMessage(`${label} must be exactly 10 digits`);

const todayDateOnly = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

const notFutureDate = (label: string) => (value: unknown) => {
  if (value == null || value === '') return true;
  const dateOnly = String(value).slice(0, 10);
  if (dateOnly > todayDateOnly()) {
    throw new Error(`${label} cannot be in the future`);
  }
  return true;
};

const pastMeetingDate = (field: string, label: string) =>
  body(field)
    .optional({ values: 'falsy' })
    .custom(notFutureDate(label));

export const createAnnualFormValidation = [
  tenDigitMobileField('president_contact', 'President contact'),
  tenDigitMobileField('secretary_contact', 'Secretary contact'),
  pastMeetingDate('last_agm_date', 'Last AGM date'),
  pastMeetingDate('general_body_meeting_date', 'General body meeting date'),
];

export const updateAnnualFormValidation = [
  optionalTenDigitMobileField('president_contact', 'President contact'),
  optionalTenDigitMobileField('secretary_contact', 'Secretary contact'),
  pastMeetingDate('last_agm_date', 'Last AGM date'),
  pastMeetingDate('general_body_meeting_date', 'General body meeting date'),
];

export const updateStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isUUID()
    .withMessage('Status must be a valid UUID'),
  
  body('remarks')
    .optional()
    .isString()
    .withMessage('Remarks must be a string')
];

export const annualFormIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid annual form ID is required')
];

export const societyIdValidation = [
  param('societyId')
    .notEmpty()
    .withMessage('Society ID is required')
    .isString()
    .withMessage('Society ID must be a string')
];

export const annualFormQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters')
];
