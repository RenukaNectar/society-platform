'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('society_registrations', 'additional_data', {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional JSON data for society registration'
      });
      
      console.log('Successfully added additional_data JSON column to society_registrations table');
    } catch (error) {
      console.error('Error adding additional_data JSON column:', error);
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('society_registrations', 'additional_data');
      console.log('Successfully removed additional_data JSON column from society_registrations table');
    } catch (error) {
      console.error('Error removing additional_data JSON column:', error);
      throw error;
    }
  }
};
