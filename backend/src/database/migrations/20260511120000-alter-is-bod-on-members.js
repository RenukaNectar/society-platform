'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('members', 'is_bod', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'is_co_opted',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('members', 'is_bod');
  },
};
