import dotenv from 'dotenv';
dotenv.config();

interface DBConfig {
  username: string;
  password: string;
  database: string;
  host: string;
  port: number;
  dialect: 'mysql' | 'postgres' | 'sqlite' | 'mssql';
  use_env_variable?: string;
}

interface JwtConfig {
  ACCESS_EXPIRES_IN: string;
  JWT_SECRET: string;
  REFRESH_EXPIRES_IN: string;
}

interface ServerConfig {
  db_env: DBConfig;
  jwt_config: JwtConfig;
  app_url: string;
}

const config: { [key: string]: ServerConfig } = {
  development: {
    db_env: {
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mydb',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT ?? '3306'),
      dialect: 'mysql',
    },
    jwt_config: {
      ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
      JWT_SECRET: process.env.JWT_SECRET || 'supersecretkey',
      REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    app_url: process.env.APP_URL || 'http://127.0.0.1:3000',
  },
  production: {
    db_env: {
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mydb',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT ?? '3306'),
      dialect: 'mysql',
    },
    jwt_config: {
      ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
      JWT_SECRET: process.env.JWT_SECRET || 'supersecretkey',
      REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    app_url: process.env.APP_URL || 'http://127.0.0.1:3000',
  },
};

export default config;

export { default as NOTIFICATIONS } from './notifications';
export { default as sequelize } from './sequelize';
export { default as database } from './database';
