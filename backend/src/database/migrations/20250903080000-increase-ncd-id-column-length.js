'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Increase ncd_id column length to accommodate longer NCD IDs
    await queryInterface.changeColumn('society_registrations', 'ncd_id', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to original length
    await queryInterface.changeColumn('society_registrations', 'ncd_id', {
      type: Sequelize.STRING(40),
      allowNull: true
    });
  }
};
