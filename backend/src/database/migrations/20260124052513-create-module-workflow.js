'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('module_workflows', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      module_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'ID from module table'
      },
      sequence: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Approval order (1, 2, 3…)'
      },
      allowed_role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'User role ID'
      },
      approval_status_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Status ID after approval'
      },
      approval_notification_template_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Notification template table ID'
        // Foreign key constraint will be added later when notification_templates table is created
      },
      approval_send_to: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'all / single'
      },
      approval_documents: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Array of documents ([\'doc\'])'
      },
      reject_role_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Role ID after reject'
      },
      reject_status_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Status ID after reject'
      },
      reject_notification_template_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Notification template table ID for reject'
        // Foreign key constraint will be added later when notification_templates table is created
      },
      reject_send_to: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Where to send on reject'
      },
      reject_documents: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Array of documents for reject'
      },
      is_hq: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Is HQ workflow'
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Flow active or not'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('module_workflows');
  }
};
