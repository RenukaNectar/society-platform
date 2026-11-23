'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('business_activities', 'status_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'statuses',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Application status from statuses table',
    });

    await queryInterface.addColumn('business_activities', 'workflow_status', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'module_workflows',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'FK to module_workflows.id (current BUSINESS_ACTIVITY step)',
    });

    await queryInterface.addColumn('business_activities', 'assigned_to_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Current assignee for workflow action',
    });

    await queryInterface.addColumn('business_activities', 'status_changed_by', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('business_activities', 'status_changed_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('business_activities', 'reject_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Reason when application is rejected or sent back',
    });

    await queryInterface.addIndex('business_activities', ['status_id']);
    await queryInterface.addIndex('business_activities', ['workflow_status']);
    await queryInterface.addIndex('business_activities', ['assigned_to_user_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('business_activities', ['assigned_to_user_id']);
    await queryInterface.removeIndex('business_activities', ['workflow_status']);
    await queryInterface.removeIndex('business_activities', ['status_id']);

    await queryInterface.removeColumn('business_activities', 'reject_reason');
    await queryInterface.removeColumn('business_activities', 'status_changed_at');
    await queryInterface.removeColumn('business_activities', 'status_changed_by');
    await queryInterface.removeColumn('business_activities', 'assigned_to_user_id');
    await queryInterface.removeColumn('business_activities', 'workflow_status');
    await queryInterface.removeColumn('business_activities', 'status_id');
  },
};
