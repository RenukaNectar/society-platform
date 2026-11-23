import { param } from "express-validator";

export const registrationNumberValidation = [
  param('registrationNumber').notEmpty().withMessage('Registration number is required')
]; 