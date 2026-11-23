import { body, param, query } from "express-validator";
import { SOCIETY_REGISTRATION_REQUIRED_DOCUMENT_FIELDS } from "../utils/societyRegistrationRequiredDocuments";
import {
  assertSocietyNameFormat,
  resolveSocietyNameFromBody,
} from "../utils/societyNameRules";

const societyRegistrationDocumentUuidRules = SOCIETY_REGISTRATION_REQUIRED_DOCUMENT_FIELDS.map(
  ({ field, label }) =>
    body(field)
      .optional({ values: 'falsy' })
      .isUUID()
      .withMessage(`${label} must be a valid media ID`)
);

/** Block, village, gram panchayat, ULB, and ward — optional; validated only when a value is sent. */
export const societyRegistrationOptionalFieldRules = [
  body('block_id').optional({ values: 'falsy' }).isString().withMessage('Block must be a string'),
  body('village_code').optional({ values: 'falsy' }).isString().withMessage('Village must be a string'),
  body(['gram_panchayat_id', 'gram_panchayat'])
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Gram panchayat must be a string'),
  body('urban_local_body_type')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Urban local body type must be a string'),
  body('urban_local_body_code')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Urban local body must be a string'),
  body(['locality_ward_code', 'local_body_ward'])
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Local body ward must be a string'),
  body('local_bodies').optional({ values: 'falsy' }).isString().withMessage('Local bodies must be a string')
];

/** Frontend sends `cooperative_society_name`; legacy clients may send `society_name`. */
const requireSocietyName = body(['cooperative_society_name', 'society_name']).custom((_value, { req }) => {
  const name = resolveSocietyNameFromBody(req.body);
  const normalized = assertSocietyNameFormat(name);
  // Persist normalized full name for downstream create/update
  req.body.cooperative_society_name = normalized;
  return true;
});

const optionalSocietyNameIfPresent = body(['cooperative_society_name', 'society_name'])
  .optional({ values: 'falsy' })
  .custom((value, { req }) => {
    if (value === undefined || value === null || value === '') return true;
    const name = resolveSocietyNameFromBody(req.body);
    const normalized = assertSocietyNameFormat(name);
    req.body.cooperative_society_name = normalized;
    return true;
  });

/** Clients send status UUID from `statuses` table, or enriched `{ id, key }` — not legacy string enums. */
const optionalStatusField = body('status')
  .optional({ values: 'falsy' })
  .custom((value) => {
    if (value == null || value === '') return true;
    if (typeof value === 'object' && value !== null) {
      const id = (value as { id?: unknown }).id;
      if (id != null && String(id).trim()) return true;
      throw new Error('Invalid status');
    }
    if (typeof value === 'string' && value.trim()) return true;
    throw new Error('Invalid status');
  });

/** Clients may send is_msme as boolean, 0/1, or yes/no string. */
const isMsmeTruthy = (value: unknown): boolean => {
  if (value === true || value === 1 || value === '1') return true;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === 'yes';
  }
  return false;
};

const udyamNoValidation = body('udyam_no').custom((value, { req }) => {
  if (!isMsmeTruthy(req.body?.is_msme)) {
    return true;
  }
  if (value == null || String(value).trim() === '') {
    throw new Error('udyam_no is required when is_msme is true');
  }
  if (String(value).trim().length > 50) {
    throw new Error('udyam_no cannot exceed 50 characters');
  }
  return true;
});

export const societyRegistrationValidation = [
  ...societyRegistrationOptionalFieldRules,
  requireSocietyName,
  body('registration_number').optional().isString().withMessage('Registration number must be a string'),
  body('registration_date').optional().isISO8601().withMessage('Registration date must be a valid date'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('contact_person').optional().isString().withMessage('Contact person must be a string'),
  body(['mobile', 'phone']).optional({ values: 'falsy' }).isMobilePhone('en-IN').withMessage('Valid phone number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  optionalStatusField,
  body('is_affiliated_union_federation').optional().isString().withMessage('is_affiliated_union_federation must be a string'),
  body('affiliated_union_level').optional().isString().withMessage('affiliated_union_level must be a string'),
  body('affiliated_union_name').optional().isString().withMessage('affiliated_union_name must be a string'),
  body('is_msme').optional({ values: 'falsy' }),
  udyamNoValidation,
  ...societyRegistrationDocumentUuidRules,
];

export const updateSocietyRegistrationValidation = [
  ...societyRegistrationOptionalFieldRules,
  optionalSocietyNameIfPresent,
  body('registration_number').optional().isString().withMessage('Registration number must be a string'),
  body('registration_date').optional().isISO8601().withMessage('Registration date must be a valid date'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('contact_person').optional().isString().withMessage('Contact person must be a string'),
  body(['mobile', 'phone']).optional({ values: 'falsy' }).isMobilePhone('en-IN').withMessage('Valid phone number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  optionalStatusField,
  body('is_affiliated_union_federation').optional().isString().withMessage('is_affiliated_union_federation must be a string'),
  body('affiliated_union_level').optional().isString().withMessage('affiliated_union_level must be a string'),
  body('affiliated_union_name').optional().isString().withMessage('affiliated_union_name must be a string'),
  body('is_msme').optional({ values: 'falsy' }),
  udyamNoValidation,
  ...societyRegistrationDocumentUuidRules,
];

/** Sector form payload only — does not submit or resubmit the application. */
export const updateSocietyAdditionalDataValidation = [
  body('additional_data')
    .exists({ checkNull: false })
    .withMessage('additional_data is required')
    .custom((value) => {
      if (value === null) return true;
      if (typeof value === 'object' && !Array.isArray(value)) return true;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (parsed === null) return true;
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return true;
        } catch {
          /* fall through */
        }
      }
      throw new Error('additional_data must be a JSON object (cooperative form data)');
    }),
  body('sector_of_operation')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('sector_of_operation must be a valid sector id'),
];

export const societyIdValidation = [
  param('id').isString().withMessage('Valid society ID is required')
];

export const userIdValidation = [
  param('userId').isUUID().withMessage('Valid user ID is required')
];

export const societyQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('status').optional().isString().withMessage('Status must be a string'),
  query('reference_year').optional().isString().withMessage('Reference year must be a string'),
  query('from').optional().isString().withMessage('From date must be a string'),
  query('to').optional().isString().withMessage('To date must be a string'),
  query('district_id').optional().isString().withMessage('District ID must be a string'),
  query('state_id').optional().isString().withMessage('State ID must be a string'),
  query('cooperative_society_type_id').optional().isString().withMessage('Cooperative society type ID must be a string'),
  query('functional_status').optional().isString().withMessage('Functional status must be a string'),
  query('has_applicant')
    .optional()
    .isIn(['true', 'false', '1', '0'])
    .withMessage('has_applicant must be true, false, 1, or 0')
];