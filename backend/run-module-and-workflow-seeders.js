const { Sequelize } = require('sequelize');
require('dotenv').config();
const SequelizeClass = Sequelize;

const sequelize = new Sequelize(
  process.env.DB_NAME || 'society_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

const runSeeders = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully.\n');

    const queryInterface = sequelize.getQueryInterface();

    // 1. Module seeder (adds LIQUIDATION_RCS and other modules)
    console.log('Running module seeder (20260123124317-seed-modules.js)...');
    const moduleSeeder = require('./src/database/seeders/20260123124317-seed-modules.js');
    await moduleSeeder.up(queryInterface, SequelizeClass);
    console.log('Module seeder completed.\n');

    // 2. Liquidation RCS workflow seeder (depends on LIQUIDATION_RCS module)
    console.log('Running liquidation RCS workflow seeder (20260211115830-seed-liquidation-rcs-workflow.js)...');
    const workflowSeeder = require('./src/database/seeders/20260211115830-seed-liquidation-rcs-workflow.js');
    await workflowSeeder.up(queryInterface, SequelizeClass);
    console.log('Liquidation RCS workflow seeder completed.\n');

    console.log('All seeders completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeder failed:', error);
    process.exit(1);
  }
};

runSeeders();
