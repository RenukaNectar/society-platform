'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('amendments', 'workflow_status', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'module_workflows',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'FK to module_workflows.id (current workflow step for AMENDMENT)'
    });

    await queryInterface.addColumn('amendments', 'assigned_to_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User to whom this amendment is assigned (set when workflow approved with assigned_to)'
    });

    await queryInterface.addIndex('amendments', ['workflow_status']);
    await queryInterface.addIndex('amendments', ['assigned_to_user_id']);

    // Best-effort backfill of workflow_status for existing amendments
    try {
      await queryInterface.sequelize.query(`
        UPDATE amendments a
        JOIN modules m ON m.key = 'AMENDMENT'
        JOIN module_workflows mw ON mw.module_id = m.id AND mw.sequence = 1 AND mw.active = true
        SET a.workflow_status = mw.id
        WHERE a.workflow_status IS NULL
      `);
    } catch (e) {
      // Ignore backfill errors
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('amendments', ['assigned_to_user_id']);
    await queryInterface.removeIndex('amendments', ['workflow_status']);
    await queryInterface.removeColumn('amendments', 'assigned_to_user_id');
    await queryInterface.removeColumn('amendments', 'workflow_status');
  }
};
