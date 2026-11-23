import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';
import logger from '../utils/logger';

// Database configuration
interface IDatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
}

const dbConfig: IDatabaseConfig = {
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '3306'),
  user: process.env['DB_USER'] || 'root',
  password: process.env['DB_PASSWORD'] || ' ',
  database: process.env['DB_NAME'] || 'rcs',
  connectionLimit: parseInt(process.env['DB_CONNECTION_LIMIT'] || '1000')
};

// Create connection pool
let pool: mysql.Pool | null = null;

export const createPool = (): mysql.Pool => {
  if (!pool) {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
  }
  return pool;
};

// Connect to database
export const connectDatabase = async (): Promise<void> => {
  try {
    pool = createPool();

    // Test the connection
    const connection = await pool.getConnection();
    logger.info('Database connected successfully');
    connection.release();
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw new Error('Failed to connect to database');
  }
};

// Get database connection
export const getConnection = async (): Promise<mysql.PoolConnection> => {
  try {
    if (!pool) {
      throw new Error('Database pool not initialized');
    }
    return await pool.getConnection();
  } catch (error) {
    logger.error('Failed to get database connection:', error);
    throw new Error('Database connection error');
  }
};

// Execute query with parameters
export const executeQuery = async <T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> => {
  const startTime = Date.now();

  try {
    if (!pool) {
      throw new Error('Database pool not initialized');
    }
    const [rows] = await pool.execute(query, params);
    const duration = Date.now() - startTime;

    logger.info('Database query executed successfully', {
      query: query.substring(0, 100) + '...',
      duration: `${duration}ms`,
      rowCount: Array.isArray(rows) ? rows.length : 0
    });

    return rows as T[];
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Database query failed:', {
      query: query.substring(0, 100) + '...',
      duration: `${duration}ms`,
      error: error
    });
    throw error;
  }
};

// Execute transaction
export const executeTransaction = async <T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  try {
    if (pool) {
      await pool.end();
      logger.info('Database connection closed');
    }
  } catch (error) {
    logger.error('Failed to close database connection:', error);
  }
};

// Health check for database
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const connection = await getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

// Get database statistics
export const getDatabaseStats = async (): Promise<{
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
}> => {
  try {
    const stats = await executeQuery<{ Variable_name: string; Value: string }>(
      'SHOW STATUS LIKE "Threads_%"'
    );

    const statsMap = stats.reduce((acc, row) => {
      acc[row.Variable_name] = parseInt(row.Value);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalConnections: statsMap['Threads_connected'] || 0,
      activeConnections: statsMap['Threads_running'] || 0,
      idleConnections: (statsMap['Threads_connected'] || 0) - (statsMap['Threads_running'] || 0)
    };
  } catch (error) {
    logger.error('Failed to get database stats:', error);
    return {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0
    };
  }
};

export default pool as mysql.Pool | null; 