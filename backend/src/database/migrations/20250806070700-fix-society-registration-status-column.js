'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // First, let's check if the status column exists and what its current type is
    const tableDescription = await queryInterface.describeTable('society_registrations');
    
    if (tableDescription.status) {
      // Remove the existing status column
      await queryInterface.removeColumn('society_registrations', 'status');
    }

    // Add the status column with proper UUID type and foreign key reference
    await queryInterface.addColumn('society_registrations', 'status', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'statuses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Current status of the society registration (references statuses.id)'
    });

    // Add index for the status column
    await queryInterface.addIndex('society_registrations', ['status']);
  },

  async down (queryInterface, Sequelize) {
    // Remove the index first
    await queryInterface.removeIndex('society_registrations', ['status']);
    
    // Remove the status column
    await queryInterface.removeColumn('society_registrations', 'status');
    
    // Add back the old status column as STRING
    await queryInterface.addColumn('society_registrations', 'status', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Current status of the society registration'
    });
  }
};
