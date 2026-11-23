'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('users');
    if (tableDefinition.is_hq) {
      return Promise.resolve();
    }
    // add after is_active column
    await queryInterface.addColumn('users', 'is_hq', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }, {
      after: 'is_active'
    });
  },
  async down(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('users');
    if (tableDefinition.is_hq) {
      await queryInterface.removeColumn('users', 'is_hq');
    }
  }
};
