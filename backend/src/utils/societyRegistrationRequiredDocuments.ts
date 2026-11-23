import { AppError } from './errors';

export const SOCIETY_REGISTRATION_REQUIRED_DOCUMENT_FIELDS = [
  { field: 'bye_laws', label: 'Bye laws' },
  { field: 'contributor_list', label: 'Contributor list' },
  { field: 'circular_minutes_of_meeting', label: 'Circular minutes of meeting' },
  { field: 'bank_certificate', label: 'Bank certificate' },
  { field: 'land_document', label: 'Land document' },
  { field: 'economic_scheme', label: 'Economic scheme' },
  { field: 'full_particulars_of_the_promoter', label: 'Full particulars of the promoter' },
  { field: 'circular_for_promoters_meeting', label: 'Circular for promoters meeting' },
  { field: 'minutes_of_meeting_of_promoters_meeting', label: 'Minutes of meeting of promoters meeting' },
] as const;

export type SocietyRegistrationRequiredDocumentField =
  (typeof SOCIETY_REGISTRATION_REQUIRED_DOCUMENT_FIELDS)[number]['field'];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const assertRequiredSocietyRegistrationDocuments = (
  data: Record<string, unknown>
): void => {
  for (const { field, label } of SOCIETY_REGISTRATION_REQUIRED_DOCUMENT_FIELDS) {
    const raw = data[field];
    const trimmed = typeof raw === 'string' ? raw.trim() : raw != null ? String(raw).trim() : '';

    if (!trimmed) {
      throw new AppError(`${label} is required`, 400);
    }

    if (!UUID_REGEX.test(trimmed)) {
      throw new AppError(`${label} must be a valid media ID`, 400);
    }
  }
};
