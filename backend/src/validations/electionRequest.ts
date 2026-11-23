import { body, param, query } from 'express-validator';

// Validation for creating election request
export const createElectionRequestValidation = [
  body('society_registration_id')
    .isUUID()
    .withMessage('Society registration ID must be a valid UUID'),
  
  body('last_election_held_date')
    .optional()
    .isISO8601()
    .withMessage('Last election held date must be a valid date'),
  
  body('last_elected_committee_expiry_date')
    .optional()
    .isISO8601()
    .withMessage('Last elected committee expiry date must be a valid date'),
  
  body('reason_for_election_request')
    .isIn(['Regular Term', 'Early Dissolution', 'Court Order', 'Other'])
    .withMessage('Reason for election request must be one of: Regular Term, Early Dissolution, Court Order, Other'),
  
  body('proposed_election_date')
    .isISO8601()
    .custom((value) => {
      const proposedDate = new Date(value);
      const now = new Date();
      if (proposedDate <= now) {
        throw new Error('Proposed election date must be in the future');
      }
      return true;
    })
    .withMessage('Proposed election date must be in the future'),
  
  body('proposed_venue')
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Proposed venue is required and must be between 1 and 500 characters'),
  
  body('number_of_members_eligible_to_vote')
    .isInt({ min: 1 })
    .withMessage('Number of members eligible to vote must be a positive integer'),
  
  body('member_list_media_id')
    .optional()
    .isUUID()
    .withMessage('Member list media ID must be a valid UUID'),
  
  body('meeting_resolution_copy_media_id')
    .optional()
    .isUUID()
    .withMessage('Meeting resolution copy media ID must be a valid UUID'),
  
  body('previous_election_report_media_id')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty, null, or undefined
      }
      // If value is provided, it must be a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    })
    .withMessage('Previous election report media ID must be a valid UUID or empty'),
  
  body('additional_notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Additional notes must be less than 1000 characters')
];

// Validation for getting election request by ID
export const getElectionRequestByIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Election request ID must be a valid UUID')
];

// Validation for getting election requests with filters
export const getElectionRequestsValidation = [
  query('society_registration_id')
    .optional()
    .isUUID()
    .withMessage('Society registration ID must be a valid UUID'),
  
  query('status_id')
    .optional()
    .isUUID()
    .withMessage('Status ID must be a valid UUID'),
  
  query('reason_for_election_request')
    .optional()
    .isIn(['Regular Term', 'Early Dissolution', 'Court Order', 'Other'])
    .withMessage('Reason for election request must be one of: Regular Term, Early Dissolution, Court Order, Other'),
  
  query('proposed_election_date')
    .optional()
    .isISO8601()
    .withMessage('Proposed election date must be a valid date'),
  
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
    .withMessage('Limit must be between 1 and 1000')
];

// Validation for getting election requests by society
export const getElectionRequestsBySocietyValidation = [
  param('societyId')
    .isUUID()
    .withMessage('Society ID must be a valid UUID')
];

// Validation for updating election request status
export const updateElectionRequestStatusValidation = [
  param('id')
    .isUUID()
    .withMessage('Election request ID must be a valid UUID'),
  
  body('status_id')
    .isUUID()
    .withMessage('Status ID must be a valid UUID'),
  
  body('remarks')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks must be less than 1000 characters')
];

// Validation for updating election request
export const updateElectionRequestValidation = [
  param('id')
    .isUUID()
    .withMessage('Election request ID must be a valid UUID'),
  
  body('last_election_held_date')
    .optional()
    .isISO8601()
    .withMessage('Last election held date must be a valid date'),
  
  body('last_elected_committee_expiry_date')
    .optional()
    .isISO8601()
    .withMessage('Last elected committee expiry date must be a valid date'),
  
  body('reason_for_election_request')
    .optional()
    .isIn(['Regular Term', 'Early Dissolution', 'Court Order', 'Other'])
    .withMessage('Reason for election request must be one of: Regular Term, Early Dissolution, Court Order, Other'),
  
  body('proposed_election_date')
    .optional()
    .isISO8601()
    .custom((value) => {
      const proposedDate = new Date(value);
      const now = new Date();
      if (proposedDate <= now) {
        throw new Error('Proposed election date must be in the future');
      }
      return true;
    })
    .withMessage('Proposed election date must be in the future'),
  
  body('proposed_venue')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Proposed venue must be less than 500 characters'),
  
  body('number_of_members_eligible_to_vote')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Number of members eligible to vote must be a positive integer'),
  
  body('member_list_media_id')
    .optional()
    .isUUID()
    .withMessage('Member list media ID must be a valid UUID'),
  
  body('meeting_resolution_copy_media_id')
    .optional()
    .isUUID()
    .withMessage('Meeting resolution copy media ID must be a valid UUID'),
  
  body('previous_election_report_media_id')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty, null, or undefined
      }
      // If value is provided, it must be a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    })
    .withMessage('Previous election report media ID must be a valid UUID or empty'),
  
  body('additional_notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Additional notes must be less than 1000 characters')
];

// Validation for deleting election request
export const deleteElectionRequestValidation = [
  param('id')
    .isUUID()
    .withMessage('Election request ID must be a valid UUID')
];
