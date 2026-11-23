'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('society_registrations', 'status', {
        type: Sequelize.STRING(100),
        allowNull: true,
        references: {
          model: 'statuses',
          key: 'key'
        },
        comment: 'Current status of the society registration'
      });
      console.log('Added status column to society_registrations');
    } catch (error) {
      console.log('Column status already exists in society_registrations, skipping...');
    }

    try {
      await queryInterface.addColumn('society_registrations', 'status_changed_by', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'User who last updated the status'
      });
      console.log('Added status_changed_by column to society_registrations');
    } catch (error) {
      console.log('Column status_changed_by already exists in society_registrations, skipping...');
    }

    try {
      await queryInterface.addColumn('society_registrations', 'status_changed_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when status was last changed'
      });
      console.log('Added status_changed_at column to society_registrations');
    } catch (error) {
      console.log('Column status_changed_at already exists in society_registrations, skipping...');
    }

    // Add indexes with error handling
    try {
      await queryInterface.addIndex('society_registrations', ['status']);
    } catch (error) {
      console.log('Index on status already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('society_registrations', ['status_changed_by']);
    } catch (error) {
      console.log('Index on status_changed_by already exists, skipping...');
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('society_registrations', 'status_changed_at');
    await queryInterface.removeColumn('society_registrations', 'status_changed_by');
    await queryInterface.removeColumn('society_registrations', 'status');
  }
}; 