import { body, param, query } from 'express-validator';

/**
 * Validation for updating workflow status (all modules).
 * Use resourceId for any module (e.g. society_id for SOCIETY_REGISTRATION, UUID for others). societyId kept for backward compat.
 */
export const updateWorkflowStatusValidation = [
  body('resourceId')
    .optional()
    .isString()
    .withMessage('Resource ID must be a string'),
  body('societyId')
    .optional()
    .isString()
    .withMessage('Society ID must be a string (backward compat; use resourceId for new clients)'),
  body('moduleName')
    .notEmpty()
    .withMessage('Module name is required')
    .isString()
    .withMessage('Module name must be a string'),
  body('action')
    .notEmpty()
    .withMessage('Action is required')
    .isIn(['approve', 'reject', 'back'])
    .withMessage('Action must be one of: approve, reject, back'),
  body('comments')
    .optional()
    .isString()
    .withMessage('Comments must be a string'),
  body('districtId')
    .optional()
    .isUUID()
    .withMessage('District ID must be a valid UUID'),
  body('stateId')
    .optional()
    .isUUID()
    .withMessage('State ID must be a valid UUID'),
  body('isHq')
    .optional()
    .isBoolean()
    .withMessage('isHq must be a boolean'),
  body('assigned_to')
    .optional()
    .isUUID()
    .withMessage('Assigned to must be a valid UUID'),
  body('bypass')
    .optional()
    .isBoolean()
    .withMessage('bypass must be a boolean'),
  body('documents')
    .optional()
    .custom((value) => {
      // Allow object, array, or null
      if (value === null || typeof value === 'object') {
        return true;
      }
      throw new Error('Documents must be an object or null');
    }),
  body()
    .custom((_, { req }) => {
      if (!req.body?.resourceId && !req.body?.societyId) {
        throw new Error('Either resourceId or societyId is required');
      }
      return true;
    }),
];

/**
 * Validation for getting workflow status. Param = resourceId (society_id for SOCIETY_REGISTRATION, or record UUID for other modules).
 * Backward compatibility: accepts both resourceId and societyId parameter names.
 */
export const getWorkflowStatusValidation = [
  param('resourceId')
    .optional()
    .isString()
    .withMessage('Resource ID must be a string'),
  param('societyId')
    .optional()
    .isString()
    .withMessage('Society ID must be a string (backward compat; use resourceId for new clients)'),
  query('moduleName')
    .notEmpty()
    .withMessage('Module name is required')
    .isString()
    .withMessage('Module name must be a string'),
  query('isHq')
    .optional()
    .isBoolean()
    .withMessage('isHq must be a boolean'),
  param()
    .custom((params, { req }) => {
      if (!params.resourceId && !params.societyId) {
        throw new Error('Resource ID is required (use resourceId or societyId parameter)');
      }
      return true;
    }),
];

/**
 * Validation for reassigning a workflow resource to a new user.
 */
export const reassignWorkflowValidation = [
  body('resourceId')
    .notEmpty()
    .withMessage('resourceId is required')
    .isUUID()
    .withMessage('resourceId must be a valid UUID'),
  body('moduleName')
    .notEmpty()
    .withMessage('moduleName is required')
    .isString()
    .withMessage('moduleName must be a string'),
  body('newAssigneeUserId')
    .notEmpty()
    .withMessage('newAssigneeUserId is required')
    .isUUID()
    .withMessage('newAssigneeUserId must be a valid UUID'),
  body('reason')
    .notEmpty()
    .withMessage('reason is required')
    .isString()
    .withMessage('reason must be a string')
    .isLength({ min: 10, max: 2000 })
    .withMessage('reason must be between 10 and 2000 characters'),
];

/**
 * Validation for fetching assignment history for a resource.
 */
export const getAssignmentHistoryValidation = [
  param('resourceId')
    .notEmpty()
    .withMessage('resourceId is required')
    .isUUID()
    .withMessage('resourceId must be a valid UUID'),
  query('moduleName')
    .notEmpty()
    .withMessage('moduleName is required')
    .isString()
    .withMessage('moduleName must be a string'),
];
