const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Database configuration
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

const runSpecificSeeder = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Import and run the specific seeder
    const seeder = require('./src/database/seeders/20250102000006-restructured-role-permissions.js');
    
    console.log('Running role-permissions seeder...');
    await seeder.up(sequelize.getQueryInterface(), sequelize);
    
    console.log('Seeder completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeder failed:', error);
    process.exit(1);
  }
};

runSpecificSeeder();
