'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if the table exists
    const tableExists = await queryInterface.showAllTables();
    if (!tableExists.includes('society_registrations')) {
      console.log('society_registrations table does not exist, skipping audit fields');
      return;
    }

    // Add audit fields if they don't exist
    const tableDescription = await queryInterface.describeTable('society_registrations');
    
    if (!tableDescription.created_by) {
      await queryInterface.addColumn('society_registrations', 'created_by', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      await queryInterface.addIndex('society_registrations', ['created_by']);
    }

    if (!tableDescription.updated_by) {
      await queryInterface.addColumn('society_registrations', 'updated_by', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      await queryInterface.addIndex('society_registrations', ['updated_by']);
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove audit fields
    await queryInterface.removeColumn('society_registrations', 'updated_by');
    await queryInterface.removeColumn('society_registrations', 'created_by');
  }
}; 