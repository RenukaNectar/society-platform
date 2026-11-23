'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('annual_forms', 'workflow_status', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'module_workflows',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'FK to module_workflows.id (current workflow step for ANNUAL_FILING)'
    });

    await queryInterface.addColumn('annual_forms', 'assigned_to_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User to whom this annual form is assigned (set when workflow approved with assigned_to)'
    });

    await queryInterface.addIndex('annual_forms', ['workflow_status']);
    await queryInterface.addIndex('annual_forms', ['assigned_to_user_id']);

    // Best-effort backfill of workflow_status for existing annual forms
    try {
      await queryInterface.sequelize.query(`
        UPDATE annual_forms a
        JOIN modules m ON m.key = 'ANNUAL_FILING'
        JOIN module_workflows mw ON mw.module_id = m.id AND mw.sequence = 1 AND mw.active = true
        SET a.workflow_status = mw.id
        WHERE a.workflow_status IS NULL
      `);
    } catch (e) {
      // Ignore backfill errors
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('annual_forms', ['assigned_to_user_id']);
    await queryInterface.removeIndex('annual_forms', ['workflow_status']);
    await queryInterface.removeColumn('annual_forms', 'assigned_to_user_id');
    await queryInterface.removeColumn('annual_forms', 'workflow_status');
  }
};
