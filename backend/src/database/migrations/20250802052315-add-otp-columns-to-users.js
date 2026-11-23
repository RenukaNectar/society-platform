'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'otp', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Hashed OTP for password reset'
    });

    await queryInterface.addColumn('users', 'otp_expiry', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'OTP expiry timestamp'
    });

    // Add index for OTP expiry for efficient cleanup
    await queryInterface.addIndex('users', ['otp_expiry'], {
      name: 'idx_users_otp_expiry'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'idx_users_otp_expiry');
    await queryInterface.removeColumn('users', 'otp_expiry');
    await queryInterface.removeColumn('users', 'otp');
  }
}; 