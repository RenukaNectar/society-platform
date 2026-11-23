'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.addColumn('sector_of_operations', 'code', {
    type: Sequelize.STRING(100),
    allowNull: true
   });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('sector_of_operations', 'code');
  }
};
