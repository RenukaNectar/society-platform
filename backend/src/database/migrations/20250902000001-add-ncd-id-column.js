'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if ncd_id column exists, if not add it
    const tableDescription = await queryInterface.describeTable('society_registrations');
    
    if (!tableDescription.ncd_id) {
      await queryInterface.addColumn('society_registrations', 'ncd_id', {
        type: Sequelize.STRING(40),
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Only remove if it exists
    const tableDescription = await queryInterface.describeTable('society_registrations');
    
    if (tableDescription.ncd_id) {
      await queryInterface.removeColumn('society_registrations', 'ncd_id');
    }
  }
};
