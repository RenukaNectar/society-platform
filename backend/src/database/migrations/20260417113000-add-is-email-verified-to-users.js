'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'is_email_verified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Tracks whether user email ownership is verified'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'is_email_verified');
  }
};
