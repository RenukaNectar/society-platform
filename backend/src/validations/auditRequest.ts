import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/auth';

// Validation for creating audit request
export const createAuditRequestValidation = [
  body('society_registration_id')
    .isUUID()
    .withMessage('Society registration ID must be a valid UUID'),
  
  body('financial_year')
    .isString()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Financial year must be in format YYYY-YY (e.g., 2024-25)'),
  
  body('auditor_name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Auditor name is required and must be between 1 and 255 characters'),
  
  body('auditor_registration_number')
    .optional()
    .isString()
    .trim()
    .isLength({max: 100 })
    .withMessage('Auditor registration number must be between 1 and 100 characters'),
  
  body('audit_completion_date')
    .isISO8601()
    .withMessage('Audit completion date must be a valid date'),
  
  body('audit_classification')
    .isIn(['A', 'B', 'C', 'D'])
    .withMessage('Audit classification must be A, B, C, or D'),
  
  body('agm_date')
    .optional()
    .isISO8601()
    .withMessage('AGM date must be a valid date'),
  
  body('bod_meeting_date')
    .optional()
    .isISO8601()
    .withMessage('BOD meeting date must be a valid date'),
  
  body('agm_total_members_on_roll')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0 && Number.isInteger(num);
    })
    .withMessage('AGM total members on roll must be a positive integer'),
  
  body('agm_members_attended')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0 && Number.isInteger(num);
    })
    .withMessage('AGM members attended must be a positive integer'),

  body('bod_total_members_on_roll')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0 && Number.isInteger(num);
    })
    .withMessage('BOD total members on roll must be a positive integer'),
  
  body('bod_members_attended')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0 && Number.isInteger(num);
    })
    .withMessage('BOD members attended must be a positive integer'),
  
  body('turnover')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0;
    })
    .withMessage('Turnover must be a positive number'),
  
  body('profit_loss')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num);
    })
    .withMessage('Profit/Loss must be a valid number'),

  body('profit_loss_type')
    .optional({ values: 'falsy' })
    .isIn(['profit', 'loss'])
    .withMessage('profit_loss_type must be either profit or loss'),

  body('gross_profit')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0;
    })
    .withMessage('Gross profit must be a positive number'),

  body('working_capital')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0;
    })
    .withMessage('Working capital must be a positive number'),
  
  body('accumulated_profit')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0;
    })
    .withMessage('Accumulated profit must be a positive number'),
  
  body('accumulated_loss')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0;
    })
    .withMessage('Accumulated loss must be a positive number'),
  
  body('audit_fee_paid')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0;
    })
    .withMessage('Audit fee paid must be a positive number'),
  
  body('declaration_accepted')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (typeof value === 'boolean') return true;
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        return lowerValue === 'true' || lowerValue === 'false' || lowerValue === '1' || lowerValue === '0';
      }
      if (typeof value === 'number') {
        return value === 0 || value === 1;
      }
      return false;
    })
    .withMessage('Declaration accepted must be a boolean'),
  
  body('additional_notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Additional notes must be less than 1000 characters'),
  
  validateRequest
];

// Validation for updating audit request
export const updateAuditRequestValidation = [
  param('id')
    .isUUID()
    .withMessage('Audit request ID must be a valid UUID'),
  
  body('financial_year')
    .optional()
    .isString()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Financial year must be in format YYYY-YY (e.g., 2024-25)'),
  
  body('auditor_name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Auditor name must be between 1 and 255 characters'),
  
  body('auditor_registration_number')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Auditor registration number must be between 1 and 100 characters'),
  
  body('audit_completion_date')
    .optional()
    .isISO8601()
    .withMessage('Audit completion date must be a valid date'),
  
  body('audit_classification')
    .optional()
    .isIn(['A', 'B', 'C', 'D'])
    .withMessage('Audit classification must be A, B, C, or D'),
  
  body('agm_date')
    .optional()
    .isISO8601()
    .withMessage('AGM date must be a valid date'),
  
  body('bod_meeting_date')
    .optional()
    .isISO8601()
    .withMessage('BOD meeting date must be a valid date'),
  
  body('agm_total_members_on_roll')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0 && Number.isInteger(num);
    })
    .withMessage('AGM total members on roll must be a positive integer'),
  
  body('agm_members_attended')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0 && Number.isInteger(num);
    })
    .withMessage('AGM members attended must be a positive integer'),

  body('bod_total_members_on_roll')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0 && Number.isInteger(num);
    })
    .withMessage('BOD total members on roll must be a positive integer'),
  
  body('bod_members_attended')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0 && Number.isInteger(num);
    })
    .withMessage('BOD members attended must be a positive integer'),
  
  body('turnover')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0;
    })
    .withMessage('Turnover must be a positive number'),
  
  body('profit_loss')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num);
    })
    .withMessage('Profit/Loss must be a valid number'),

  body('profit_loss_type')
    .optional({ values: 'falsy' })
    .isIn(['profit', 'loss'])
    .withMessage('profit_loss_type must be either profit or loss'),

  body('gross_profit')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0;
    })
    .withMessage('Gross profit must be a positive number'),

  body('working_capital')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0;
    })
    .withMessage('Working capital must be a positive number'),
  
  body('accumulated_profit')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0;
    })
    .withMessage('Accumulated profit must be a positive number'),
  
  body('accumulated_loss')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0;
    })
    .withMessage('Accumulated loss must be a positive number'),
  
  body('audit_fee_paid')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0;
    })
    .withMessage('Audit fee paid must be a positive number'),
  
  body('audit_accounts_media_id')
    .optional()
    .isUUID()
    .withMessage('Audit accounts media ID must be a valid UUID'),
  
  body('audit_note_media_id')
    .optional()
    .isUUID()
    .withMessage('Audit note media ID must be a valid UUID'),
  
  body('vital_stats_form_media_id')
    .optional()
    .isUUID()
    .withMessage('Vital stats form media ID must be a valid UUID'),
  
  body('shareholder_list_media_id')
    .optional()
    .isUUID()
    .withMessage('Shareholder list media ID must be a valid UUID'),
  
  body('agm_bod_minutes_media_id')
    .optional()
    .isUUID()
    .withMessage('AGM/BOD minutes media ID must be a valid UUID'),
  
  body('auditor_appointment_letter_media_id')
    .optional()
    .isUUID()
    .withMessage('Auditor appointment letter media ID must be a valid UUID'),
  
  body('registration_certificate_media_id')
    .optional()
    .isUUID()
    .withMessage('Registration certificate media ID must be a valid UUID'),
  
  body('abstract_closing_stock_media_id')
    .optional()
    .isUUID()
    .withMessage('Abstract closing stock media ID must be a valid UUID'),
  
  body('asset_list_depreciation_media_id')
    .optional()
    .isUUID()
    .withMessage('Asset list depreciation media ID must be a valid UUID'),
  
  body('declaration_accepted')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (typeof value === 'boolean') return true;
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        return lowerValue === 'true' || lowerValue === 'false' || lowerValue === '1' || lowerValue === '0';
      }
      if (typeof value === 'number') {
        return value === 0 || value === 1;
      }
      return false;
    })
    .withMessage('Declaration accepted must be a boolean'),
  
  body('additional_notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Additional notes must be less than 1000 characters'),
  
  validateRequest
];

// Validation for getting audit request by ID
export const getAuditRequestByIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Audit request ID must be a valid UUID'),
  
  validateRequest
];

// Validation for getting audit requests with filters
export const getAuditRequestsValidation = [
  query('society_registration_id')
    .optional()
    .isUUID()
    .withMessage('Society registration ID must be a valid UUID'),
  
  query('status_id')
    .optional()
    .isUUID()
    .withMessage('Status ID must be a valid UUID'),
  
  query('financial_year')
    .optional()
    .isString()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Financial year must be in format YYYY-YY (e.g., 2024-25)'),
  
  query('assigned_officer_id')
    .optional()
    .isUUID()
    .withMessage('Assigned officer ID must be a valid UUID'),
  

  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  
  validateRequest
];

// Validation for submitting audit request
export const submitAuditRequestValidation = [
  param('id')
    .isUUID()
    .withMessage('Audit request ID must be a valid UUID'),
  
  validateRequest
];

// Validation for assigning officer
export const assignOfficerValidation = [
  param('id')
    .isUUID()
    .withMessage('Audit request ID must be a valid UUID'),

  
  validateRequest
];

// Validation for reviewing audit request
export const reviewAuditRequestValidation = [
  param('id')
    .isUUID()
    .withMessage('Audit request ID must be a valid UUID'),
  
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be approve or reject'),
  
  body('comments')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comments must be less than 1000 characters'),

  
  validateRequest
];

// Validation for deleting audit request
export const deleteAuditRequestValidation = [
  param('id')
    .isUUID()
    .withMessage('Audit request ID must be a valid UUID'),
  
  validateRequest
];

// Validation for getting audit requests by society
export const getAuditRequestsBySocietyValidation = [
  param('society_registration_id')
    .isUUID()
    .withMessage('Society registration ID must be a valid UUID'),
  
  validateRequest
];
