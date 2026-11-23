'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('liquidations', 'workflow_status', {
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

    await queryInterface.addColumn('liquidations', 'assigned_to_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User to whom this liquidation is assigned (set when workflow approved with assigned_to)'
    });

    await queryInterface.addIndex('liquidations', ['workflow_status']);
    await queryInterface.addIndex('liquidations', ['assigned_to_user_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('liquidations', ['assigned_to_user_id']);
    await queryInterface.removeIndex('liquidations', ['workflow_status']);
    await queryInterface.removeColumn('liquidations', 'assigned_to_user_id');
    await queryInterface.removeColumn('liquidations', 'workflow_status');
  }
};
