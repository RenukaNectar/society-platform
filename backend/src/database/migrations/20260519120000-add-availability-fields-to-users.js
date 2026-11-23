'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'is_available', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether user is currently available for workflow assignments. False = on leave / unavailable.'
    });

    await queryInterface.addColumn('users', 'unavailable_since', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when user was marked unavailable. Auto-set when is_available flipped to false.'
    });

    await queryInterface.addColumn('users', 'unavailable_until', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Optional date until which user is unavailable. When current time crosses this, system auto-marks available again.'
    });

    await queryInterface.addColumn('users', 'unavailable_reason', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Reason text shown to admins / assigners when user is marked unavailable.'
    });

    await queryInterface.addIndex('users', ['is_available']);
    await queryInterface.addIndex('users', ['unavailable_until']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', ['unavailable_until']);
    await queryInterface.removeIndex('users', ['is_available']);
    await queryInterface.removeColumn('users', 'unavailable_reason');
    await queryInterface.removeColumn('users', 'unavailable_until');
    await queryInterface.removeColumn('users', 'unavailable_since');
    await queryInterface.removeColumn('users', 'is_available');
  }
};
