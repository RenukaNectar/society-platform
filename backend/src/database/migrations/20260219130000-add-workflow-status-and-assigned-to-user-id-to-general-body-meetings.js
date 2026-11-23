'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('general_body_meetings', 'workflow_status', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'module_workflows',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'FK to module_workflows.id (current workflow step for AGM)'
    });

    await queryInterface.addColumn('general_body_meetings', 'assigned_to_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User to whom this AGM is assigned (set when workflow approved with assigned_to)'
    });

    await queryInterface.addIndex('general_body_meetings', ['workflow_status']);
    await queryInterface.addIndex('general_body_meetings', ['assigned_to_user_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('general_body_meetings', ['assigned_to_user_id']);
    await queryInterface.removeIndex('general_body_meetings', ['workflow_status']);
    await queryInterface.removeColumn('general_body_meetings', 'assigned_to_user_id');
    await queryInterface.removeColumn('general_body_meetings', 'workflow_status');
  }
};
