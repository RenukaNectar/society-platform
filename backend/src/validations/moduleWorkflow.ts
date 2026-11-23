import { body, param, query } from 'express-validator';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** module_workflows JSON role column: single UUID or array of UUIDs (same as assigned_to). */
const workflowRoleIdColumn = (field: string, label: string, required = false) =>
  (required ? body(field).notEmpty() : body(field).optional()).custom((value) => {
    if (value === undefined || value === null || value === '') {
      if (required) throw new Error(`${label} is required`);
      return true;
    }
    if (typeof value === 'string') {
      if (!uuidRegex.test(value)) throw new Error(`${label} must be a valid UUID`);
      return true;
    }
    if (Array.isArray(value)) {
      if (!value.length && required) throw new Error(`${label} is required`);
      if (!value.every((id) => typeof id === 'string' && uuidRegex.test(id))) {
        throw new Error(`${label} array must contain valid UUIDs`);
      }
      return true;
    }
    throw new Error(`${label} must be a UUID or array of UUIDs`);
  });

export const moduleWorkflowValidation = [
  body('module_id')
    .notEmpty()
    .withMessage('Module ID is required')
    .isUUID()
    .withMessage('Module ID must be a valid UUID'),

  body('sequence')
    .notEmpty()
    .withMessage('Sequence is required')
    .isInt({ min: 1 })
    .withMessage('Sequence must be a positive integer'),

  workflowRoleIdColumn('allowed_role_id', 'Allowed role ID'),

  body('approval_status_id')
    .optional()
    .isUUID()
    .withMessage('Approval status ID must be a valid UUID'),

  body('approval_notification_template_id')
    .optional()
    .isUUID()
    .withMessage('Approval notification template ID must be a valid UUID'),

  body('approval_send_to')
    .optional()
    .isIn(['all', 'single'])
    .withMessage('Approval send to must be either "all" or "single"'),

  body('approval_documents')
    .optional()
    .isArray()
    .withMessage('Approval documents must be an array'),

  workflowRoleIdColumn('reject_role_id', 'Reject role ID'),
  body('reject_status_id')
    .optional()
    .isUUID()
    .withMessage('Reject status ID must be a valid UUID'),

  body('reject_notification_template_id')
    .optional()
    .isUUID()
    .withMessage('Reject notification template ID must be a valid UUID'),

  body('reject_send_to')
    .optional()
    .isString()
    .withMessage('Reject send to must be a string'),

  body('reject_documents')
    .optional()
    .isArray()
    .withMessage('Reject documents must be an array'),

  workflowRoleIdColumn('assigned_to', 'Assigned to'),

  body('is_hq')
    .optional()
    .isBoolean()
    .withMessage('is_hq must be a boolean'),

  body('active')
    .optional()
    .isBoolean()
    .withMessage('active must be a boolean')
];

export const updateModuleWorkflowValidation = [
  body('module_id')
    .optional()
    .isUUID()
    .withMessage('Module ID must be a valid UUID'),

  body('sequence')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Sequence must be a positive integer'),

  workflowRoleIdColumn('allowed_role_id', 'Allowed role ID'),
  body('approval_status_id')
    .optional()
    .isUUID()
    .withMessage('Approval status ID must be a valid UUID'),

  body('approval_notification_template_id')
    .optional()
    .isUUID()
    .withMessage('Approval notification template ID must be a valid UUID'),

  body('approval_send_to')
    .optional()
    .isIn(['all', 'single'])
    .withMessage('Approval send to must be either "all" or "single"'),

  body('approval_documents')
    .optional()
    .isArray()
    .withMessage('Approval documents must be an array'),

  workflowRoleIdColumn('reject_role_id', 'Reject role ID'),

  body('reject_status_id')
    .optional()
    .isUUID()
    .withMessage('Reject status ID must be a valid UUID'),

  body('reject_notification_template_id')
    .optional()
    .isUUID()
    .withMessage('Reject notification template ID must be a valid UUID'),

  body('reject_send_to')
    .optional()
    .isString()
    .withMessage('Reject send to must be a string'),

  body('reject_documents')
    .optional()
    .isArray()
    .withMessage('Reject documents must be an array'),

  workflowRoleIdColumn('assigned_to', 'Assigned to'),

  body('is_hq')
    .optional()
    .isBoolean()
    .withMessage('is_hq must be a boolean'),

  body('active')
    .optional()
    .isBoolean()
    .withMessage('active must be a boolean')
];

export const moduleWorkflowIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Module workflow ID is required')
    .isUUID()
    .withMessage('Module workflow ID must be a valid UUID')
];

export const moduleIdValidation = [
  param('module_id')
    .notEmpty()
    .withMessage('Module ID is required')
    .isUUID()
    .withMessage('Module ID must be a valid UUID')
];

export const moduleWorkflowQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('module_id')
    .optional()
    .isUUID()
    .withMessage('Module ID must be a valid UUID'),

  query('active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Active must be either "true" or "false"'),

  query('is_hq')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('is_hq must be either "true" or "false"')
];

export const toggleStatusValidation = [
  body('active')
    .notEmpty()
    .withMessage('Active status is required')
    .isBoolean()
    .withMessage('Active must be a boolean')
];
