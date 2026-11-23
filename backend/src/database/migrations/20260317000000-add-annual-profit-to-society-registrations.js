'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('society_registrations', 'annual_profit', {
      type: Sequelize.DECIMAL(17, 2),
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('society_registrations', 'annual_profit');
  }
};

