import { body, param } from 'express-validator';

// Validation for creating auditor
export const createAuditorValidation = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Auditor name is required and must be between 1 and 255 characters'),
  
  body('address')
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Address is required and must be between 1 and 1000 characters'),
  
  body('mobile1')
    .isString()
    .trim()
    .matches(/^\d{10}$/)
    .withMessage('Mobile 1 is required and must be exactly 10 digits'),
  
  body('email')
    .isArray()
    .withMessage('Email must be an array')
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error('At least one email is required');
      }
      
      for (const email of value) {
        if (typeof email !== 'string' || !email.includes('@')) {
          throw new Error('Each email must be a valid email address');
        }
      }
      return true;
    }),
];

// Validation for updating auditor
export const updateAuditorValidation = [
  param('id')
    .isUUID()
    .withMessage('Auditor ID must be a valid UUID'),
  
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Auditor name must be between 1 and 255 characters'),
  
  body('address')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Address must be between 1 and 1000 characters'),
  
  body('mobile1')
    .optional()
    .isString()
    .trim()
    .matches(/^\d{10}$/)
    .withMessage('Mobile 1 must be exactly 10 digits'),
  
  body('email')
    .optional()
    .isArray()
    .withMessage('Email must be an array')
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error('At least one email is required');
      }
      
      for (const email of value) {
        if (typeof email !== 'string' || !email.includes('@')) {
          throw new Error('Each email must be a valid email address');
        }
      }
      return true;
    }),
];

// Validation for getting auditor by ID
export const getAuditorByIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Auditor ID must be a valid UUID'),
];

// Validation for deleting auditor
export const deleteAuditorValidation = [
  param('id')
    .isUUID()
    .withMessage('Auditor ID must be a valid UUID'),
];
