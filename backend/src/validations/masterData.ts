import { param, query } from "express-validator";

export const masterDataQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('local_body_code').optional().isInt({ min: 1 }).withMessage('local_body_code must be a positive integer'),
  query('localbody_code').optional().isInt({ min: 1 }).withMessage('localbody_code must be a positive integer')
];

export const idValidation = [
  param('id').isInt().withMessage('Valid ID is required')
];

export const uuidValidation = [
  param('id').isUUID().withMessage('Valid UUID is required')
];

export const codeValidation = [
  param('code').isString().withMessage('Valid code is required')
];

export const stateCodeValidation = [
  param('stateCode').isString().withMessage('Valid state code is required')
];

export const districtCodeValidation = [
  param('districtCode').isString().withMessage('Valid district code is required')
];

/** Path `/blocks/by-district/:districtCode` — primary value is numeric district_code; UUID still allowed for legacy. */
export const districtCodeParamValidation = [
  param('districtCode')
    .exists()
    .withMessage('District code is required')
    .bail()
    .isString()
    .withMessage('District code must be a string')
    .bail()
    .custom((value: string) => {
      const v = (value || '').trim();
      if (!v) {
        throw new Error('District code cannot be empty');
      }
      if (/^\d+$/.test(v)) {
        return true;
      }
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(v)) {
        return true;
      }
      throw new Error('District code must be numeric (or legacy district UUID)');
    }),
];

export const districtSocietyGraphValidation = [
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be between 2000 and 2100')
]; 