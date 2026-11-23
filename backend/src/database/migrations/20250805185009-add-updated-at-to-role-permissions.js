'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if the table exists
    const tableExists = await queryInterface.showAllTables();
    if (!tableExists.includes('role_permissions')) {
      console.log('role_permissions table does not exist, skipping updated_at column');
      return;
    }

    // Add updated_at column if it doesn't exist
    const tableDescription = await queryInterface.describeTable('role_permissions');
    
    if (!tableDescription.updated_at) {
      await queryInterface.addColumn('role_permissions', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      });
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove updated_at column
    const tableDescription = await queryInterface.describeTable('role_permissions');
    
    if (tableDescription.updated_at) {
      await queryInterface.removeColumn('role_permissions', 'updated_at');
    }
  }
}; 