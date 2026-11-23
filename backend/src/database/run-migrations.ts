import fs from 'fs';
import path from 'path';
import { executeQuery, connectDatabase } from '../config/database';
import logger from '../utils/logger';

const migrationsDir = __dirname;

const runMigrations = async (): Promise<void> => {
  try {
    logger.info('Starting database migrations...');

    // Connect to database first
    await connectDatabase();

    // Create migrations table if it doesn't exist
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Get list of migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Get executed migrations
    const executedMigrations = await executeQuery('SELECT filename FROM migrations');
    const executedFiles = executedMigrations.map((row: any) => row.filename);

    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedFiles.includes(file)) {
        logger.info(`Running migration: ${file}`);
        
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Split SQL by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            await executeQuery(statement);
          }
        }
        
        // Record migration as executed
        await executeQuery('INSERT INTO migrations (filename) VALUES (?)', [file]);
        
        logger.info(`Migration completed: ${file}`);
      } else {
        logger.info(`Migration already executed: ${file}`);
      }
    }

    logger.info('All migrations completed successfully');

  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration error:', error);
      process.exit(1);
    });
}

export default runMigrations; 