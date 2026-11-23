'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('society_registrations', 'ncd_running_number', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  },    

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('society_registrations', 'ncd_running_number');
  }
};
