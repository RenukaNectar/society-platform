import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { 
  generateRegistrationNumber, 
  validateRegistrationNumber, 
  parseRegistrationNumber, 
  getRegistrationStatistics 
} from '../utils/registrationNumberGenerator';

export const getNextRegistrationNumber = async () => {
  try {
    const nextNumber = await generateRegistrationNumber();
    return {
      nextRegistrationNumber: nextNumber,
      message: 'Next registration number generated successfully'
    };
  } catch (error) {
    logger.error('Error generating next registration number:', error);
    throw new AppError('Failed to generate next registration number', 500);
  }
};

export const validateRegistrationNumberFormat = (registrationNumber: string) => {
  try {
    const isValid = validateRegistrationNumber(registrationNumber);
    const parsed = parseRegistrationNumber(registrationNumber);
    
    return {
      isValid,
      parsed,
      message: isValid ? 'Registration number format is valid' : 'Registration number format is invalid'
    };
  } catch (error) {
    logger.error('Error validating registration number:', error);
    throw new AppError('Failed to validate registration number', 500);
  }
};

export const getRegistrationNumberStatistics = async () => {
  try {
    const stats = await getRegistrationStatistics();
    return {
      ...stats,
      message: 'Registration number statistics retrieved successfully'
    };
  } catch (error) {
    logger.error('Error getting registration number statistics:', error);
    throw new AppError('Failed to get registration number statistics', 500);
  }
};

export const getRegistrationNumberInfo = async (registrationNumber: string) => {
  try {
    const parsed = parseRegistrationNumber(registrationNumber);
    
    if (!parsed.isValid) {
      throw new AppError('Invalid registration number format', 400);
    }

    return {
      registrationNumber,
      prefix: parsed.prefix,
      index: parsed.index,
      year: parsed.year,
      message: 'Registration number information retrieved successfully'
    };
  } catch (error) {
    logger.error('Error getting registration number info:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get registration number information', 500);
  }
}; 