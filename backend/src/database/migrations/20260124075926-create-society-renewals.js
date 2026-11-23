'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('society_renewals', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      society_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        comment: 'ID from society_registrations table'
      },
      challan_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      submit_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'statuses',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      renewal_certificate_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      certificate_issue_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
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

    await queryInterface.addIndex('society_renewals', ['society_id']);
    await queryInterface.addIndex('society_renewals', ['status']);
    await queryInterface.addIndex('society_renewals', ['created_by']);
    await queryInterface.addIndex('society_renewals', ['updated_by']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('society_renewals');
  }
};
