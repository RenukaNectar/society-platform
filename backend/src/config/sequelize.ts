import { Sequelize } from 'sequelize';
import logger from '../utils/logger';
import dotenv from 'dotenv';
dotenv.config();
// Database configuration
const dbConfig = {
  host: process.env['DB_HOST'],
  port: process.env['DB_PORT'],
  username: process.env['DB_USER'],
  password: process.env['DB_PASSWORD'],
  database: process.env['DB_NAME'],

  dialect: 'mysql' as const,
  logging: (msg: string) => logger.info(msg),
  pool: {
    max: parseInt(process.env['DB_CONNECTION_LIMIT'] || '100'),
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
};

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database || '',
  dbConfig.username || '',
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port ? Number(dbConfig.port) : undefined,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: dbConfig.define
  }
);

// Test database connection
export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw new Error('Failed to connect to database');
  }
};

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Failed to close database connection:', error);
  }
};

// Health check for database
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

export default sequelize; 