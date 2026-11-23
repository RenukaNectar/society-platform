import { body, query, param } from 'express-validator';

const meetingDateNotInFuture = (value: unknown) => {
    if (value == null || value === '') return true;
    const parsed = new Date(String(value));
    return !Number.isNaN(parsed.getTime()) && parsed.getTime() <= Date.now();
};

export const createAnnualGeneralMeetingValidation = [
    body('society_id')
        .notEmpty()
        .withMessage('Society ID is required')
        .isUUID()
        .withMessage('Society ID must be a valid UUID'),
    
    body('society_name')
        .notEmpty()
        .withMessage('Society name is required')
        .isLength({ min: 1, max: 255 })
        .withMessage('Society name must be between 1 and 255 characters'),
    
    body('meeting_date')
        .notEmpty()
        .withMessage('Meeting date is required')
        .isISO8601()
        .withMessage('Meeting date must be a valid date')
        .custom(meetingDateNotInFuture)
        .withMessage('Meeting date cannot be in the future'),
    
    body('chairman_name')
        .optional()
        .isLength({ max: 255 })
        .withMessage('Chairman name cannot exceed 255 characters'),
    
    body('total_shareholders')
        .notEmpty()
        .withMessage('Total shareholders is required')
        .isInt({ min: 0 })
        .withMessage('Total shareholders must be a non-negative integer'),
    
    body('attended_shareholders')
        .notEmpty()
        .withMessage('Attended shareholders is required')
        .isInt({ min: 0 })
        .withMessage('Attended shareholders must be a non-negative integer'),
    
    body('media_id')
        .optional()
        .isUUID()
        .withMessage('Media ID must be a valid UUID'),
    
    body('minutes_of_meeting_id')
        .optional()
        .isUUID()
        .withMessage('Minutes of meeting ID must be a valid UUID'),
    
    body('notice_id')
        .optional()
        .isUUID()
        .withMessage('Notice ID must be a valid UUID'),
    
    body('attendance_sheet_id')
        .optional()
        .isUUID()
        .withMessage('Attendance sheet ID must be a valid UUID'),
    
    body('comments')
        .optional()
        .isString()
        .isLength({ max: 1000 })
        .withMessage('Comments cannot exceed 1000 characters'),

    body('elected_bod_members')
        .optional()
        .isArray()
        .withMessage('Elected BOD members must be an array'),
    body('elected_bod_members.*.name')
        .notEmpty()
        .withMessage('Elected BOD member name is required')
        .isString()
        .withMessage('Elected BOD member name must be a string'),
    body('elected_bod_members.*.designation')
        .optional({ values: 'falsy' })
        .isString()
        .withMessage('Elected BOD member designation must be a string'),
    body('elected_bod_members.*.member_id')
        .optional()
        .isString()
        .withMessage('Elected BOD member id must be a string'),
    body('elected_bod_members.*.gender')
        .optional()
        .isString()
        .withMessage('Elected BOD member gender must be a string'),
    body('elected_bod_members.*.category')
        .optional()
        .isString()
        .withMessage('Elected BOD member category must be a string'),
    body('elected_bod_members.*.shareholder_category')
        .optional({ values: 'falsy' })
        .isString()
        .withMessage('Elected BOD member shareholder_category must be a string')
        .isLength({ max: 100 })
        .withMessage('Elected BOD member shareholder_category must not exceed 100 characters'),
    body('elected_bod_members.*.mobile')
        .optional()
        .isString()
        .withMessage('Elected BOD member mobile must be a string'),
    body('elected_bod_members.*.is_co_opted')
        .optional()
        .isBoolean()
        .withMessage('Elected BOD member is_co_opted must be a boolean'),
    body('elected_bod_members.*.is_selected_for_bod')
        .optional()
        .isBoolean()
        .withMessage('Elected BOD member is_selected_for_bod must be a boolean'),

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
    
    body('status')
        .optional()
        .isUUID()
        .withMessage('Status must be a valid UUID')
];

export const getAnnualGeneralMeetingsValidation = [
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
        .isLength({ max: 100 })
        .withMessage('Search query cannot exceed 100 characters'),
    
    query('society_id')
        .optional()
        .isUUID()
        .withMessage('Society ID must be a valid UUID')
];

export const getAnnualGeneralMeetingByIdValidation = [
    param('id')
        .notEmpty()
        .withMessage('ID parameter is required')
        .isUUID()
        .withMessage('ID must be a valid UUID')
];

export const getAgmCalendarYearEligibilityValidation = [
    query('society_id')
        .notEmpty()
        .withMessage('Society ID is required')
        .isUUID()
        .withMessage('Society ID must be a valid UUID'),
    query('year')
        .optional()
        .isInt({ min: 1900, max: 2100 })
        .withMessage('Year must be between 1900 and 2100')
];

export const resubmitAnnualGeneralMeetingValidation = [
    param('id')
        .notEmpty()
        .withMessage('ID parameter is required')
        .isUUID()
        .withMessage('ID must be a valid UUID'),
    body('society_name')
        .optional()
        .isLength({ min: 1, max: 255 })
        .withMessage('Society name must be between 1 and 255 characters'),
    body('meeting_date')
        .optional()
        .isISO8601()
        .withMessage('Meeting date must be a valid date')
        .custom(meetingDateNotInFuture)
        .withMessage('Meeting date cannot be in the future'),
    body('chairman_name')
        .optional()
        .isLength({ max: 255 })
        .withMessage('Chairman name cannot exceed 255 characters'),
    body('total_shareholders')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Total shareholders must be a non-negative integer'),
    body('attended_shareholders')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Attended shareholders must be a non-negative integer'),
    body('media_id')
        .optional()
        .isUUID()
        .withMessage('Media ID must be a valid UUID'),
    body('minutes_of_meeting_id')
        .optional()
        .isUUID()
        .withMessage('Minutes of meeting ID must be a valid UUID'),
    body('notice_id')
        .optional()
        .isUUID()
        .withMessage('Notice ID must be a valid UUID'),
    body('attendance_sheet_id')
        .optional()
        .isUUID()
        .withMessage('Attendance sheet ID must be a valid UUID'),
    body('comments')
        .optional()
        .isString()
        .isLength({ max: 1000 })
        .withMessage('Comments cannot exceed 1000 characters'),
    body('elected_bod_members')
        .optional()
        .isArray()
        .withMessage('Elected BOD members must be an array'),
    body('elected_bod_members.*.name')
        .optional()
        .isString()
        .withMessage('Elected BOD member name must be a string'),
    body('elected_bod_members.*.designation')
        .optional()
        .isString()
        .withMessage('Elected BOD member designation must be a string'),
    body('elected_bod_members.*.member_id')
        .optional()
        .isString()
        .withMessage('Elected BOD member id must be a string'),
    body('elected_bod_members.*.gender')
        .optional()
        .isString()
        .withMessage('Elected BOD member gender must be a string'),
    body('elected_bod_members.*.category')
        .optional()
        .isString()
        .withMessage('Elected BOD member category must be a string'),
    body('elected_bod_members.*.shareholder_category')
        .optional({ values: 'falsy' })
        .isString()
        .withMessage('Elected BOD member shareholder_category must be a string')
        .isLength({ max: 100 })
        .withMessage('Elected BOD member shareholder_category must not exceed 100 characters'),
    body('elected_bod_members.*.mobile')
        .optional()
        .isString()
        .withMessage('Elected BOD member mobile must be a string'),
    body('elected_bod_members.*.is_co_opted')
        .optional()
        .isBoolean()
        .withMessage('Elected BOD member is_co_opted must be a boolean'),
    body('elected_bod_members.*.is_selected_for_bod')
        .optional()
        .isBoolean()
        .withMessage('Elected BOD member is_selected_for_bod must be a boolean'),

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
];
