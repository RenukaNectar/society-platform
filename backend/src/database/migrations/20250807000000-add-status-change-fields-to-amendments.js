'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('amendments', 'status_changed_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when the status was last changed'
    });

    await queryInterface.addColumn('amendments', 'status_changed_by', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User who last changed the status'
    });

    // Add index for better performance
    await queryInterface.addIndex('amendments', ['status_changed_by']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('amendments', 'status_changed_at');
    await queryInterface.removeColumn('amendments', 'status_changed_by');
  }
};
