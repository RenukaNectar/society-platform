'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('election_requests', 'district_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'districts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'District scoped to this election request (used for workflow routing)'
    });

    await queryInterface.addColumn('election_requests', 'workflow_status', {
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

    await queryInterface.addColumn('election_requests', 'assigned_to_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User to whom this election request is assigned (set when workflow approved with assigned_to)'
    });

    await queryInterface.addIndex('election_requests', ['district_id']);
    await queryInterface.addIndex('election_requests', ['workflow_status']);
    await queryInterface.addIndex('election_requests', ['assigned_to_user_id']);

    // Best-effort backfill of district_id from the linked society registration.
    try {
      await queryInterface.sequelize.query(`
        UPDATE election_requests er
        JOIN society_registrations sr ON sr.id = er.society_registration_id
        SET er.district_id = sr.district_id
        WHERE er.district_id IS NULL
      `);
    } catch (e) {
      // ignore dialect-specific errors; column addition still succeeds
    }

    // Best-effort backfill of workflow_status for existing rows that are still at the initial step.
    try {
      await queryInterface.sequelize.query(`
        UPDATE election_requests er
        JOIN statuses s ON s.id = er.status_id
        JOIN modules m ON m.key = 'ELECTION'
        JOIN module_workflows mw ON mw.module_id = m.id AND mw.sequence = 1 AND mw.active = true
        SET er.workflow_status = mw.id
        WHERE er.workflow_status IS NULL
          AND s.key IN ('pending', 'submitted')
      `);
    } catch (e) {
      // ignore backfill errors
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('election_requests', ['assigned_to_user_id']);
    await queryInterface.removeIndex('election_requests', ['workflow_status']);
    await queryInterface.removeIndex('election_requests', ['district_id']);

    await queryInterface.removeColumn('election_requests', 'assigned_to_user_id');
    await queryInterface.removeColumn('election_requests', 'workflow_status');
    await queryInterface.removeColumn('election_requests', 'district_id');
  }
};
