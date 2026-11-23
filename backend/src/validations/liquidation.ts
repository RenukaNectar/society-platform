import { body, param, query } from 'express-validator';

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

export const createLiquidationValidation = [
  body('society_id')
    .notEmpty()
    .withMessage('Society ID is required')
    .isUUID()
    .withMessage('Valid society ID is required'),
  body('society_registration_number')
    .notEmpty()
    .withMessage('Society registration number is required')
    .isString()
    .isLength({ max: 50 })
    .withMessage('Society registration number cannot exceed 50 characters'),
  body('society_name')
    .notEmpty()
    .withMessage('Society name is required')
    .isString()
    .isLength({ max: 255 })
    .withMessage('Society name cannot exceed 255 characters'),
  body('society_type')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Society type cannot exceed 100 characters'),
  body('address')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('date_of_original_registration')
    .optional()
    .isISO8601()
    .withMessage('Date of original registration must be a valid date'),
  body('date_of_minutes_meeting')
    .optional()
    .isISO8601()
    .withMessage('Date of minutes meeting must be a valid date')
    .bail()
    .custom(notFutureDate('Meeting date')),
  body('minutes_meeting_media_id')
    .optional()
    .isUUID()
    .withMessage('Valid minutes meeting media ID is required'),
  body('attendance_sheet_media_id')
    .optional()
    .isUUID()
    .withMessage('Valid attendance sheet media ID is required'),
  body('date_of_circular_notice')
    .optional()
    .isISO8601()
    .withMessage('Date of circular notice must be a valid date')
    .bail()
    .custom(notFutureDate('Circular notice date')),
  body('circular_notice_media_id')
    .optional()
    .isUUID()
    .withMessage('Valid circular notice media ID is required'),
  body('liquidation_order_number')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Liquidation order number cannot exceed 100 characters'),
  body('date_of_liquidation_order')
    .optional()
    .isISO8601()
    .withMessage('Date of liquidation order must be a valid date'),
  body('mode_of_liquidation')
    .notEmpty()
    .withMessage('Mode of liquidation is required')
    .isIn(['voluntary', 'compulsory'])
    .withMessage('Mode of liquidation must be either voluntary or compulsory'),
  body('reason_for_liquidation')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Reason for liquidation cannot exceed 500 characters'),
  body('total_assets')
    .optional()
    .isNumeric()
    .withMessage('Total assets must be a number'),
  body('total_liabilities')
    .optional()
    .isNumeric()
    .withMessage('Total liabilities must be a number'),
  body('net_position')
    .optional()
    .isNumeric()
    .withMessage('Net position must be a number'),
  body('share_capital_paid_up')
    .optional()
    .isNumeric()
    .withMessage('Share capital paid up must be a number'),
  body('reserve_funds')
    .optional()
    .isNumeric()
    .withMessage('Reserve funds must be a number'),
  body('creditors_list_media_id')
    .optional()
    .isUUID()
    .withMessage('Valid creditors list media ID is required'),
  body('members_list_media_id')
    .optional()
    .isUUID()
    .withMessage('Valid members list media ID is required'),
  body('initiated_by')
    .optional()
    .isIn(['applicant', 'rcs'])
    .withMessage('initiated_by must be "applicant" (society files) or "rcs" (RCS office initiates). Defaults to applicant if omitted.'),
];

/** Update: id in params; all body fields optional (only send fields to update) */
export const updateLiquidationValidation = [
  param('id').isUUID().withMessage('Valid liquidation ID is required'),
  body('society_registration_number')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('Society registration number cannot exceed 50 characters'),
  body('society_name')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Society name cannot exceed 255 characters'),
  body('society_type')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Society type cannot exceed 100 characters'),
  body('address')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('date_of_original_registration')
    .optional()
    .isISO8601()
    .withMessage('Date of original registration must be a valid date'),
  body('date_of_minutes_meeting')
    .optional()
    .isISO8601()
    .withMessage('Date of minutes meeting must be a valid date')
    .bail()
    .custom(notFutureDate('Meeting date')),
  body('minutes_meeting_media_id')
    .optional()
    .isUUID()
    .withMessage('Valid minutes meeting media ID is required'),
  body('attendance_sheet_media_id')
    .optional()
    .isUUID()
    .withMessage('Valid attendance sheet media ID is required'),
  body('date_of_circular_notice')
    .optional()
    .isISO8601()
    .withMessage('Date of circular notice must be a valid date')
    .bail()
    .custom(notFutureDate('Circular notice date')),
  body('circular_notice_media_id')
    .optional()
    .isUUID()
    .withMessage('Valid circular notice media ID is required'),
  body('liquidation_order_number')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Liquidation order number cannot exceed 100 characters'),
  body('date_of_liquidation_order')
    .optional()
    .isISO8601()
    .withMessage('Date of liquidation order must be a valid date'),
  body('mode_of_liquidation')
    .optional()
    .isIn(['voluntary', 'compulsory'])
    .withMessage('Mode of liquidation must be either voluntary or compulsory'),
  body('reason_for_liquidation')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Reason for liquidation cannot exceed 500 characters'),
  body('total_assets')
    .optional()
    .isNumeric()
    .withMessage('Total assets must be a number'),
  body('total_liabilities')
    .optional()
    .isNumeric()
    .withMessage('Total liabilities must be a number'),
  body('net_position')
    .optional()
    .isNumeric()
    .withMessage('Net position must be a number'),
  body('share_capital_paid_up')
    .optional()
    .isNumeric()
    .withMessage('Share capital paid up must be a number'),
  body('reserve_funds')
    .optional()
    .isNumeric()
    .withMessage('Reserve funds must be a number'),
  body('creditors_list_media_id')
    .optional()
    .isUUID()
    .withMessage('Valid creditors list media ID is required'),
  body('members_list_media_id')
    .optional()
    .isUUID()
    .withMessage('Valid members list media ID is required'),
];

export const liquidationFiltersValidation = [

  query('status_id')
    .optional()
    .isUUID()
    .withMessage('Valid status ID is required'),
  query('liquidation_type')
    .optional()
    .isIn(['voluntary', 'compulsory'])
    .withMessage('Liquidation type must be either voluntary or compulsory'),
  query('society_id')
    .optional()
    .isUUID()
    .withMessage('Valid society ID is required'),
  query('liquidation_order_date_from')
    .optional()
    .isISO8601()
    .withMessage('Liquidation order date from must be a valid date'),
  query('liquidation_order_date_to')
    .optional()
    .isISO8601()
    .withMessage('Liquidation order date to must be a valid date'),
  query('is_applicant')
    .optional()
    .custom((v) => [0, 1, '0', '1', true, false].includes(v))
    .withMessage('is_applicant must be 0, 1, true, or false (applicant workflow = 1, RCS workflow = 0)'),
  query('workflow_status')
    .optional()
    .isUUID()
    .withMessage('workflow_status must be a valid UUID (module_workflows id)'),
  query('workflowstatus')
    .optional()
    .isUUID()
    .withMessage('workflowstatus must be a valid UUID (module_workflows id)'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be at least 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000')
];

export const liquidationIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid liquidation ID is required')
];
