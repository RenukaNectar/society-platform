import dotenv from 'dotenv';
dotenv.config();

import config from '../config';
import { Sequelize } from 'sequelize';

// Get current environment
const env = process.env.APP_ENV ?? 'development';

// Safely access db_env config
const envConfig = config[env];
if (!envConfig || !envConfig.db_env) {
  throw new Error(`No database config found for environment: ${env}`);
}

const dbConfig = envConfig.db_env;

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: false,
  }
);

export default sequelize;
