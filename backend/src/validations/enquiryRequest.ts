import { body, param, query } from 'express-validator';

// Validation for creating enquiry request
export const createEnquiryRequestValidation = [
  body('applicant_name')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Applicant name must be between 2 and 100 characters'),

  body('contact_number')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^\d{10}$/)
    .withMessage('Contact number must be a valid 10-digit number'),

  body('email_id')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address'),
  
  body('applicant_type')
    .optional({ values: 'falsy' })
    .isIn(['Member', 'Office Bearer', 'General Public', 'Other'])
    .withMessage('Invalid applicant type'),

  body('society_id')
    .optional()
    .isUUID()
    .withMessage('Invalid society ID format'),
  
  body('district_id')
    .optional()
    .isUUID()
    .withMessage('Invalid district ID format'),
  
  body('society_registration_number')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Society registration number must not exceed 50 characters'),
  
  body('society_name')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Society name must not exceed 200 characters'),

  body('subdivision')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Subdivision must not exceed 100 characters'),
  
  body('subject')
    .isIn(['Inquiry', 'Inspection', 'Complaint', 'Irregularity', 'Routine Check', 'Other'])
    .withMessage('Invalid subject type'),
  
  body('preferred_office_level')
    .optional()
    .isIn(['State', 'District', 'Subdivision'])
    .withMessage('Invalid preferred office level'),
  
  body('date_of_incident')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('documents')
    .optional()
    .isUUID()
    .withMessage('Invalid documents ID format')
];

// Validation for getting enquiry request by ID
export const getEnquiryRequestByIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid enquiry ID format')
];

// Validation for getting all enquiry requests
export const getEnquiryRequestsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  
  query('status')
    .optional()
    .isUUID()
    .withMessage('Invalid status ID format'),
  
  query('applicant_type')
    .optional()
    .isIn(['Member', 'Office Bearer', 'General Public', 'Other'])
    .withMessage('Invalid applicant type'),
  
  query('subject')
    .optional()
    .isIn(['Complaint', 'Irregularity', 'Routine Check', 'Other'])
    .withMessage('Invalid subject type'),
  
  query('district_id')
    .optional()
    .isUUID()
    .withMessage('Invalid district ID format'),
  
  query('society_id')
    .optional()
    .isUUID()
    .withMessage('Invalid society ID format'),
  
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
];
