'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('application_assignments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      module_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Workflow module key (SOCIETY_REGISTRATION, SOCIETY_RENEWAL, AUDIT_REQUEST, etc.)'
      },
      resource_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'ID of the entity row in the corresponding module table.'
      },
      workflow_status_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'module_workflows',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Workflow step (module_workflows.id) at the time of this assignment.'
      },
      previous_assignee_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User who was previously assigned (null for the very first assignment).'
      },
      new_assignee_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'User who is now assigned.'
      },
      assigned_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'User who performed this assignment / reassignment action.'
      },
      action_type: {
        type: Sequelize.ENUM('initial_assign', 'reassign', 'workflow_assign'),
        allowNull: false,
        defaultValue: 'reassign',
        comment: 'Type: initial_assign (first time), workflow_assign (via approve flow), reassign (manual takeback).'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Mandatory reason text supplied by assigner for reassign actions.'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('application_assignments', ['module_name', 'resource_id'], {
      name: 'idx_app_assignments_module_resource'
    });
    await queryInterface.addIndex('application_assignments', ['new_assignee_id']);
    await queryInterface.addIndex('application_assignments', ['previous_assignee_id']);
    await queryInterface.addIndex('application_assignments', ['assigned_by']);
    await queryInterface.addIndex('application_assignments', ['action_type']);
    await queryInterface.addIndex('application_assignments', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('application_assignments');
  }
};
