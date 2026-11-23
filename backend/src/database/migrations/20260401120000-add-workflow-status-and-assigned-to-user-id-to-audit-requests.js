'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add district_id so workflow status API can resolve assignees by district (same as other modules)
    await queryInterface.addColumn('audit_requests', 'district_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'districts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('audit_requests', 'workflow_status', {
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

    await queryInterface.addColumn('audit_requests', 'assigned_to_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User to whom this audit request is assigned (set when workflow approved with assigned_to)'
    });

    await queryInterface.addIndex('audit_requests', ['district_id']);
    await queryInterface.addIndex('audit_requests', ['workflow_status']);
    await queryInterface.addIndex('audit_requests', ['assigned_to_user_id']);

    // Best-effort backfill of district_id for existing records
    // (safe to run multiple times; updates only null district_id rows)
    try {
      await queryInterface.sequelize.query(`
        UPDATE audit_requests ar
        JOIN society_registrations sr ON sr.id = ar.society_registration_id
        SET ar.district_id = sr.district_id
        WHERE ar.district_id IS NULL
      `);
    } catch (e) {
      // Ignore backfill errors (dialect differences) - column additions still succeed
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('audit_requests', ['assigned_to_user_id']);
    await queryInterface.removeIndex('audit_requests', ['workflow_status']);
    await queryInterface.removeIndex('audit_requests', ['district_id']);

    await queryInterface.removeColumn('audit_requests', 'assigned_to_user_id');
    await queryInterface.removeColumn('audit_requests', 'workflow_status');
    await queryInterface.removeColumn('audit_requests', 'district_id');
  }
};

