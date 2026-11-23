import { Op } from 'sequelize';
import SocietyRegistration from '../models/SocietyRegistration';
import logger from './logger';

export interface RegistrationNumberConfig {
  prefix: string;
  startIndex: number;
  yearFormat: string;
  separator: string;
}

export const DEFAULT_CONFIG: RegistrationNumberConfig = {
  prefix: 'NO.COOP(ORG)',
  startIndex: 1000,
  yearFormat: 'YYYY',
  separator: '/'
};

export class RegistrationNumberGenerator {
  private config: RegistrationNumberConfig;

  constructor(config: Partial<RegistrationNumberConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate the next registration number
   */
  async generateNextNumber(): Promise<string> {
    try {
      const currentYear = new Date().getFullYear().toString();
      const nextIndex = await this.getNextIndex();

      return `${this.config.prefix}${nextIndex}${this.config.separator}${currentYear}`;
    } catch (error) {
      logger.error('Error generating registration number:', error);
      throw new Error('Failed to generate registration number');
    }
  }

  /**
   * Get the next available index for the current year
   */
  private async getNextIndex(): Promise<number> {
    const currentYear = new Date().getFullYear();

    // Find the highest registration number for the current year
    const existingRegistrations = await SocietyRegistration.findAll({
      where: {
        registration_number: {
          [Op.like]: `${this.config.prefix}%${this.config.separator}${currentYear}`
        }
      },
      attributes: ['registration_number'],
      order: [['registration_number', 'DESC']],
      limit: 1
    });

    if (existingRegistrations.length === 0) {
      // No registrations for current year, start with startIndex
      return this.config.startIndex;
    }

    // Extract the index from the highest registration number
    const highestNumber = existingRegistrations[0]?.registration_number;
    if (!highestNumber) {
      return this.config.startIndex;
    }
    const indexMatch = highestNumber.match(new RegExp(`${this.config.prefix}(\\d+)${this.config.separator}${currentYear}`));

    if (indexMatch && indexMatch[1]) {
      const currentIndex = parseInt(indexMatch[1], 10);
      return currentIndex + 1;
    }

    // Fallback to startIndex if parsing fails
    return this.config.startIndex;
  }

  /**
   * Validate if a registration number follows the correct format
   */
  static validateFormat(registrationNumber: string): boolean {
    const pattern = /^NO\.COOP\(ORG\)\d+\/\d{4}$/;
    return pattern.test(registrationNumber);
  }

  /**
   * Extract components from a registration number
   */
  static parseRegistrationNumber(registrationNumber: string): {
    prefix: string;
    index: number;
    year: number;
    isValid: boolean;
  } {
    const pattern = /^NO\.COOP\(ORG\)(\d+)\/(\d{4})$/;
    const match = registrationNumber.match(pattern);

    if (!match) {
      return {
        prefix: 'NO.COOP(ORG)',
        index: 0,
        year: 0,
        isValid: false
      };
    }

    return {
      prefix: 'NO.COOP(ORG)',
      index: parseInt(match[1] || '0', 10),
      year: parseInt(match[2] || '0', 10),
      isValid: true
    };
  }

  /**
   * Get statistics about registration numbers
   */
  async getStatistics(): Promise<{
    totalRegistrations: number;
    currentYearRegistrations: number;
    nextNumber: string;
    lastNumber: string | null;
  }> {
    const currentYear = new Date().getFullYear();

    const [totalCount, currentYearCount, lastRegistration] = await Promise.all([
      SocietyRegistration.count(),
      SocietyRegistration.count({
        where: {
          registration_number: {
            [Op.like]: `${this.config.prefix}%${this.config.separator}${currentYear}`
          }
        }
      }),
      SocietyRegistration.findOne({
        where: {
          registration_number: {
            [Op.like]: `${this.config.prefix}%${this.config.separator}${currentYear}`
          }
        },
        attributes: ['registration_number'],
        order: [['registration_number', 'DESC']]
      })
    ]);

    const nextNumber = await this.generateNextNumber();

    return {
      totalRegistrations: totalCount,
      currentYearRegistrations: currentYearCount,
      nextNumber,
      lastNumber: lastRegistration?.registration_number || null
    };
  }
}

// Export default instance
export const registrationNumberGenerator = new RegistrationNumberGenerator();

// Export utility functions
export const generateRegistrationNumber = () => registrationNumberGenerator.generateNextNumber();
export const validateRegistrationNumber = (number: string) => RegistrationNumberGenerator.validateFormat(number);
export const parseRegistrationNumber = (number: string) => RegistrationNumberGenerator.parseRegistrationNumber(number);
export const getRegistrationStatistics = () => registrationNumberGenerator.getStatistics(); 