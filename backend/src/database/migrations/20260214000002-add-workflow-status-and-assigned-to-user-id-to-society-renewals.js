'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('society_renewals', 'workflow_status', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'module_workflows',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'FK to module_workflows.id (current workflow step)'
    });

    await queryInterface.addColumn('society_renewals', 'assigned_to_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User to whom this renewal is assigned (set when workflow approved with assigned_to)'
    });

    await queryInterface.addIndex('society_renewals', ['workflow_status']);
    await queryInterface.addIndex('society_renewals', ['assigned_to_user_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('society_renewals', ['assigned_to_user_id']);
    await queryInterface.removeIndex('society_renewals', ['workflow_status']);
    await queryInterface.removeColumn('society_renewals', 'assigned_to_user_id');
    await queryInterface.removeColumn('society_renewals', 'workflow_status');
  }
};
