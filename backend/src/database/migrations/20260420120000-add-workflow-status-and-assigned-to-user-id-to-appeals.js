'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('appeals', 'district_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'districts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('appeals', 'workflow_status', {
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

    await queryInterface.addColumn('appeals', 'assigned_to_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User to whom this appeal is assigned (set when workflow approved with assigned_to)'
    });

    await queryInterface.addIndex('appeals', ['district_id']);
    await queryInterface.addIndex('appeals', ['workflow_status']);
    await queryInterface.addIndex('appeals', ['assigned_to_user_id']);

    // Best-effort backfill of district_id for existing appeals from creating user
    try {
      await queryInterface.sequelize.query(`
        UPDATE appeals a
        JOIN users u ON u.id = a.created_by
        SET a.district_id = u.district_id
        WHERE a.district_id IS NULL
      `);
    } catch (e) {
      // Ignore backfill errors (dialect differences) - column additions still succeed
    }

    // Best-effort backfill of workflow_status for existing appeals with submitted status
    // Map to APPEAL module's sequence 1 step so old records also participate in the workflow
    try {
      await queryInterface.sequelize.query(`
        UPDATE appeals a
        JOIN statuses s ON s.id = a.status
        JOIN modules m ON m.key = 'APPEAL'
        JOIN module_workflows mw ON mw.module_id = m.id AND mw.sequence = 1 AND mw.active = true
        SET a.workflow_status = mw.id
        WHERE a.workflow_status IS NULL
          AND s.key = 'submitted'
      `);
    } catch (e) {
      // Ignore backfill errors - column additions still succeed
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('appeals', ['assigned_to_user_id']);
    await queryInterface.removeIndex('appeals', ['workflow_status']);
    await queryInterface.removeIndex('appeals', ['district_id']);

    await queryInterface.removeColumn('appeals', 'assigned_to_user_id');
    await queryInterface.removeColumn('appeals', 'workflow_status');
    await queryInterface.removeColumn('appeals', 'district_id');
  }
};
