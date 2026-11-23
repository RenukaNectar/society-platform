'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('members', 'is_co_opted', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'designation',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('members', 'is_co_opted');
  },
};
