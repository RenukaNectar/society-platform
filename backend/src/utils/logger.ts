import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ILogEntry } from '../types';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env['NODE_ENV'] || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info['timestamp']} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console(),
  
  // Error log file
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
  }),
  
  // Combined log file
  new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

// Create a stream object for Morgan
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Export logger instance
export default logger;

// Helper functions for structured logging
export const logError = (message: string, error?: Error, meta?: Record<string, any>): void => {
  logger.error(message, {
    error: error?.message,
    stack: error?.stack,
    ...meta
  });
};

export const logInfo = (message: string, meta?: Record<string, any>): void => {
  logger.info(message, meta);
};

export const logWarn = (message: string, meta?: Record<string, any>): void => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, any>): void => {
  logger.debug(message, meta);
};

// Structured logging for API requests
export const logApiRequest = (req: any, res: any, responseTime: number): void => {
  const logEntry: ILogEntry = {
    level: 'info',
    message: 'API Request',
    timestamp: new Date().toISOString(),
    meta: {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    }
  };

  logger.info(logEntry.message, logEntry.meta);
};

// Structured logging for database operations
export const logDatabaseOperation = (operation: string, table: string, duration: number, success: boolean): void => {
  const level = success ? 'info' : 'error';
  const message = success ? 'Database operation completed' : 'Database operation failed';
  
  logger[level](message, {
    operation,
    table,
    duration: `${duration}ms`,
    success
  });
}; 