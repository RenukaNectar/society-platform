import { Umzug, SequelizeStorage } from 'umzug';
import { Sequelize } from 'sequelize';
import path from 'path';
import sequelize from '../config/sequelize';
import logger from '../utils/logger';

const umzug = new Umzug({
  migrations: {
    glob: path.join(__dirname, '*.js'),
    resolve: ({ name, path, context }) => {
      const migration = require(path!);
      return {
        name,
        up: async () => migration.up(context.queryInterface, context.sequelize),
        down: async () => migration.down(context.queryInterface, context.sequelize),
      };
    },
  },
  context: { queryInterface: sequelize.getQueryInterface(), sequelize: Sequelize },
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

const runMigrations = async (): Promise<void> => {
  try {
    logger.info('Starting Sequelize migrations...');

    // Connect to database first
    await sequelize.authenticate();
    logger.info('Database connected successfully');

    // Run pending migrations
    const pending = await umzug.pending();
    if (pending.length === 0) {
      logger.info('No pending migrations');
      return;
    }

    logger.info(`Found ${pending.length} pending migrations`);
    
    await umzug.up();
    
    logger.info('All migrations completed successfully');

  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
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