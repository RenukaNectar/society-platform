'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'state_id', {
      type: Sequelize.STRING(40),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'district_id', {
      type: Sequelize.STRING(40),
      allowNull: true
    });
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'state_id');
    await queryInterface.removeColumn('users', 'district_id');
  }
};
