import sequelize from '../config/sequelize';
import { setupAssociations } from '../models';
import logger from '../utils/logger';

export const initializeDatabase = async (): Promise<void> => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Setup model associations
    setupAssociations();
    logger.info('Model associations configured');

    logger.info('Database initialization completed');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Failed to close database connection:', error);
  }
}; 