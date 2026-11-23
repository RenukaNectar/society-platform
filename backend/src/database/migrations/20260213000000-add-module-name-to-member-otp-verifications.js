'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'member_otp_verifications',
      'module_name',
      {
        type: Sequelize.STRING(50),
        allowNull: true
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('member_otp_verifications', 'module_name');
  }
};
