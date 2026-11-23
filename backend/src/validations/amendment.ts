import { body, param, query } from 'express-validator';

const notFutureDateTime = (label: string) => (value: unknown) => {
  if (value == null || value === '') return true;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return true;
  if (parsed.getTime() > Date.now()) {
    throw new Error(`${label} cannot be in the future`);
  }
  return true;
};

export const createAmendmentValidation = [
  body('society_id')
    .notEmpty()
    .withMessage('Society ID field is required and cannot be empty')
    .isString()
    .withMessage('Society ID must be a string'),
  body('chairperson_name').optional().isString().isLength({ max: 255 }).withMessage('Chairperson name must not exceed 255 characters'),
  body('chairperson_address').optional().isString().withMessage('Chairperson address must be a string'),
  body('chairperson_contact').optional().isString().isLength({ max: 255 }).withMessage('Chairperson contact must not exceed 255 characters'),
  body('signatory_name').optional().isString().isLength({ max: 255 }).withMessage('Signatory name must not exceed 255 characters'),
  body('signatory_address').optional().isString().withMessage('Signatory address must be a string'),
  body('signatory_contact').optional().isString().isLength({ max: 255 }).withMessage('Signatory contact must not exceed 255 characters'),
  body('members').optional().isArray().withMessage('Members must be an array'),
  body('members.*.name').optional().isString().isLength({ max: 255 }).withMessage('Member name must not exceed 255 characters'),
  body('members.*.gender').optional().isString().isLength({ max: 20 }).withMessage('Member gender must not exceed 20 characters'),
  body('members.*.category').optional().isString().isLength({ max: 100 }).withMessage('Member category must not exceed 100 characters'),
  body('members.*.designation').optional().isString().isLength({ max: 40 }).withMessage('Member designation must not exceed 40 characters'),
  body('resolution_extract').optional().isString().withMessage('Resolution extract must be a string'),
  body('general_body_meeting_date')
    .optional()
    .isISO8601()
    .withMessage('General body meeting date must be a valid date')
    .bail()
    .custom(notFutureDateTime('Meeting date')),
  body('notice_days').optional().isInt({ min: 0 }).withMessage('Notice days must be a non-negative integer'),
  body('notice_date').optional().isISO8601().withMessage('Notice date must be a valid date'),
  body('total_members').optional().isInt({ min: 1 }).withMessage('Total members must be a positive integer'),
  body('quorum_required').optional().isInt({ min: 1 }).withMessage('Quorum required must be a positive integer'),
  body('members_present').optional().isInt({ min: 0 }).withMessage('Members present must be a non-negative integer'),
  body('members_voted').optional().isInt({ min: 0 }).withMessage('Members voted must be a non-negative integer'),
  body('votes_in_favour').optional().isInt({ min: 0 }).withMessage('Votes in favour must be a non-negative integer'),
  body('votes_against').optional().isInt({ min: 0 }).withMessage('Votes against must be a non-negative integer'),
  body('byelaw_number').optional().isString().isLength({ max: 100 }).withMessage('Byelaw number must not exceed 100 characters'),
  body('existing_byelaw').optional().isString().withMessage('Existing byelaw must be a string'),
  body('new_proposed_byelaw').optional().isString().withMessage('New proposed byelaw must be a string'),
  body('existing_byelaw_media_id').optional().isUUID().withMessage('Valid existing byelaw media ID is required'),
  body('new_proposed_byelaw_media_id').optional().isUUID().withMessage('Valid new proposed byelaw media ID is required'),
  body('circular_notice_media_id').optional().isUUID().withMessage('Valid circular notice media ID is required'),
  body('minutes_of_meeting_media_id').optional().isUUID().withMessage('Valid minutes of meeting media ID is required'),
  body('attendance_sheet_media_id').optional().isUUID().withMessage('Valid attendance sheet media ID is required'),
  body('registration_number_of_previous_application').optional().isString().isLength({ max: 40 }).withMessage('Registration number of previous application must not exceed 40 characters'),
  body('amendment_reason').optional().isString().withMessage('Amendment reason must be a string'),
  body('proposed_byelaw_text').optional().isString().withMessage('Proposed byelaw text must be a string'),
  body('deleted_members').optional({ nullable: true }).isArray().withMessage('Deleted members must be an array'),
  body('deleted_members.*.name').optional().isString().withMessage('Deleted member name must be a string'),
  body('deleted_members.*.deletion_reason')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('Deletion reason is required for deleted members'),
  body('deleted_members.*.supporting_document_media_id')
    .optional()
    .isUUID()
    .withMessage('Valid supporting document media ID is required for deleted members'),
  body('status_id').optional().isString().withMessage('Status ID must be a string if provided'),
  body('certificate_issue_date').optional().isISO8601().withMessage('Certificate issue date must be a valid date'),
  body('certificate_number').optional().isString().isLength({ max: 255 }).withMessage('Certificate number must not exceed 255 characters')
];

export const updateAmendmentValidation = [
  param('id').isUUID().withMessage('Valid amendment ID is required'),
  body('chairperson_name').optional().isString().isLength({ max: 255 }).withMessage('Chairperson name must not exceed 255 characters'),
  body('chairperson_address').optional().isString().withMessage('Chairperson address must be a string'),
  body('chairperson_contact').optional().isString().isLength({ max: 255 }).withMessage('Chairperson contact must not exceed 255 characters'),
  body('signatory_details').optional().isString().withMessage('Signatory details must be a string'),
  body('resolution_extract').optional().isString().withMessage('Resolution extract must be a string'),
  body('general_body_meeting_date')
    .optional()
    .isISO8601()
    .withMessage('General body meeting date must be a valid date')
    .bail()
    .custom(notFutureDateTime('Meeting date')),
  body('notice_days').optional().isInt({ min: 0 }).withMessage('Notice days must be a non-negative integer'),
  body('notice_date').optional().isISO8601().withMessage('Notice date must be a valid date'),
  body('total_members').optional().isInt({ min: 1 }).withMessage('Total members must be a positive integer'),
  body('quorum_required').optional().isInt({ min: 1 }).withMessage('Quorum required must be a positive integer'),
  body('members_present').optional().isInt({ min: 0 }).withMessage('Members present must be a non-negative integer'),
  body('members_voted').optional().isInt({ min: 0 }).withMessage('Members voted must be a non-negative integer'),
  body('votes_in_favour').optional().isInt({ min: 0 }).withMessage('Votes in favour must be a non-negative integer'),
  body('votes_against').optional().isInt({ min: 0 }).withMessage('Votes against must be a non-negative integer'),
  body('byelaw_number').optional().isString().isLength({ max: 100 }).withMessage('Byelaw number must not exceed 100 characters'),
  body('existing_byelaw').optional().isString().withMessage('Existing byelaw must be a string'),
  body('new_proposed_byelaw').optional().isString().withMessage('New proposed byelaw must be a string'),
  body('existing_byelaw_media_id').optional().isUUID().withMessage('Valid existing byelaw media ID is required'),
  body('new_proposed_byelaw_media_id').optional().isUUID().withMessage('Valid new proposed byelaw media ID is required'),
  body('circular_notice_media_id').optional().isUUID().withMessage('Valid circular notice media ID is required'),
  body('minutes_of_meeting_media_id').optional().isUUID().withMessage('Valid minutes of meeting media ID is required'),
  body('attendance_sheet_media_id').optional().isUUID().withMessage('Valid attendance sheet media ID is required'),
  body('registration_number_of_previous_application').optional().isString().isLength({ max: 40 }).withMessage('Registration number of previous application must not exceed 40 characters'),
  body('amendment_reason').optional().isString().withMessage('Amendment reason must be a string'),
  body('proposed_byelaw_text').optional().isString().withMessage('Proposed byelaw text must be a string'),
  body('deleted_members').optional({ nullable: true }).isArray().withMessage('Deleted members must be an array'),
  body('deleted_members.*.name').optional().isString().withMessage('Deleted member name must be a string'),
  body('deleted_members.*.deletion_reason')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('Deletion reason is required for deleted members'),
  body('deleted_members.*.supporting_document_media_id')
    .optional()
    .isUUID()
    .withMessage('Valid supporting document media ID is required for deleted members'),
  body('status_id').optional().isString().withMessage('Status ID must be a string'),
  body('certificate_issue_date').optional().isISO8601().withMessage('Certificate issue date must be a valid date'),
  body('certificate_number').optional().isString().isLength({ max: 255 }).withMessage('Certificate number must not exceed 255 characters')
];

export const assignToOfficerValidation = [
  param('id').isUUID().withMessage('Valid amendment ID is required'),
];

export const officerReviewValidation = [
  param('id').isUUID().withMessage('Valid amendment ID is required'),
  body('action').isIn(['approve', 'reject', 'forward']).withMessage('Action must be one of: approve, reject, forward'),
  body('comments').notEmpty().withMessage('Comments are required')
];

export const qrcsReviewValidation = [
  param('id').isUUID().withMessage('Valid amendment ID is required'),
  body('action').isIn(['approve', 'reject']).withMessage('Action must be one of: approve, reject'),
  body('comments').notEmpty().withMessage('Comments are required')
];

export const amendmentIdValidation = [
  param('id').isUUID().withMessage('Valid amendment ID is required')
];

export const getAmendmentByIdValidation = [
  param('id').isUUID().withMessage('Valid amendment ID is required')
];

export const getAmendmentsBySocietyIdValidation = [
  param('societyId').isString().withMessage('Valid society ID is required')
];

export const getAmendmentsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('society_id').optional().isString().withMessage('Valid society ID is required'),
  query('status_id').optional().isString().withMessage('Valid status ID is required'),
  query('created_by').optional().isUUID().withMessage('Valid created by ID is required')
]; 