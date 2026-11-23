'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'failed_otp_attempts', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of consecutive failed OTP verification attempts'
    });

    await queryInterface.addColumn('users', 'otp_locked_until', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp until which the account is locked due to failed OTP attempts'
    });

    await queryInterface.addIndex('users', ['otp_locked_until'], {
      name: 'idx_users_otp_locked_until'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'idx_users_otp_locked_until');
    await queryInterface.removeColumn('users', 'otp_locked_until');
    await queryInterface.removeColumn('users', 'failed_otp_attempts');
  }
};
